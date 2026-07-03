import request from 'supertest';
import app from '../app';
import { initDb, closeDb } from '../db';
import { seedDatabase } from '../scripts/seedData';
import { scoreGridCell } from '../services/scoring.service';

let officerWard1Token: string;
let officerWard2Token: string;
let adminToken: string;
let citizenToken: string;

beforeAll(async () => {
  process.env.DATABASE_URL = 'sqlite://./test_vayu_vigil.db';
  await initDb();
  await seedDatabase(true);

  // Login Officer Ward 1 (Bhalswa)
  const res1 = await request(app).post('/api/v1/auth/login').send({
    email: 'officer.ward1@vayuvigil.gov',
    password: 'admin123'
  });
  officerWard1Token = res1.body.token;

  // Login Officer Ward 2 (Sector 9)
  const res2 = await request(app).post('/api/v1/auth/login').send({
    email: 'officer.ward2@vayuvigil.gov',
    password: 'admin123'
  });
  officerWard2Token = res2.body.token;

  // Login Admin
  const resAdmin = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@vayuvigil.gov',
    password: 'admin123'
  });
  adminToken = resAdmin.body.token;

  // Login Citizen
  const resCit = await request(app).post('/api/v1/auth/otp/verify').send({
    phone: '+919876543210',
    otp: '123456'
  });
  citizenToken = resCit.body.token;
});

afterAll(async () => {
  await closeDb();
});

describe('1. Report Submission Validation (PRD Section 4.1 & 10)', () => {
  it('should reject report submission without valid coordinates', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .send({
        description: 'Test report without coordinates',
        category: 'smoke'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Valid latitude and longitude are required/i);
  });

  it('should accept valid report submission and return tracking ID with AI classification', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .send({
        description: 'Thick smoke from factory burning plastic waste',
        category: 'smoke',
        lat: 28.745,
        lon: 77.162,
        language: 'en'
      });
    expect(res.status).toBe(201);
    expect(res.body.tracking_id).toMatch(/^VV-\d+$/);
    expect(res.body.ai_classification).toBeDefined();
    expect(res.body.ai_classification.predicted_category).toBe('smoke');
    expect(res.body.ai_classification.confidence).toBeGreaterThan(0.5);
  });
});

describe('2. Multi-Tenant Ward Data Isolation (Security PRD Section 10 & 12)', () => {
  it('should prove Ward-1 officer only sees Ward-1 hotspots and reports', async () => {
    const res = await request(app)
      .get('/api/v1/hotspots')
      .set('Authorization', `Bearer ${officerWard1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.hotspots.length).toBeGreaterThan(0);
    // Every returned hotspot must belong to ward-1-sector-12
    for (const h of res.body.hotspots) {
      expect(h.ward_id).toBe('ward-1-sector-12');
    }
  });

  it('should prove Ward-2 officer cannot see Ward-1 data when explicitly trying to filter by Ward-1', async () => {
    const res = await request(app)
      .get('/api/v1/hotspots?ward_id=ward-1-sector-12')
      .set('Authorization', `Bearer ${officerWard2Token}`);
    expect(res.status).toBe(200);
    // Even if client asks for Ward-1, server-side enforcement forces Ward-2
    for (const h of res.body.hotspots) {
      expect(h.ward_id).toBe('ward-2-sector-9');
      expect(h.ward_id).not.toBe('ward-1-sector-12');
    }
  });

  it('should return 403 when Ward-2 officer attempts to modify a Ward-1 hotspot status', async () => {
    const res = await request(app)
      .patch('/api/v1/hotspots/cell-bhalswa-12/status') // cell-bhalswa-12 belongs to Ward-1
      .set('Authorization', `Bearer ${officerWard2Token}`)
      .send({
        status: 'inspecting',
        action_taken: 'Unauthorized intervention attempt'
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Cannot update status for a hotspot outside your assigned ward/i);
  });

  it('should reject citizen token with 403 on officer/admin endpoints', async () => {
    const res = await request(app)
      .patch('/api/v1/hotspots/cell-bhalswa-12/status')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        status: 'inspecting',
        action_taken: 'Citizen attempt'
      });
    expect(res.status).toBe(403);
  });
});

describe('3. Hotspot Scoring Engine Formula (PRD Section 4.5)', () => {
  it('should literally compute risk_score = 0.5*pm25 + 0.3*complaints + 0.15*severity + 0.05*satellite', async () => {
    // We test our scoreGridCell function directly on a mock cell
    const mockCell = {
      id: 'test-cell-scoring',
      name: 'Test Scoring Cell',
      ward_id: 'ward-1-sector-12',
      city_id: 'city-1-delhi',
      centroid_lat: 28.74,
      centroid_lon: 77.16
    };

    const scoreObj = await scoreGridCell(mockCell);
    
    expect(scoreObj).toBeDefined();
    expect(scoreObj.risk_score).toBeGreaterThanOrEqual(0);
    expect(scoreObj.risk_score).toBeLessThanOrEqual(100);

    // Verify literal weighting equation from components
    const expectedRaw = 
        0.50 * scoreObj.pm25_component
      + 0.30 * scoreObj.complaint_component
      + 0.15 * scoreObj.severity_component
      + 0.05 * scoreObj.satellite_component;
      
    const expectedRounded = Math.round(expectedRaw * 10) / 10;
    expect(scoreObj.risk_score).toBeCloseTo(expectedRounded, 1);
  });
});

describe('4. Public vs. Officer Data Exposure Boundary (Security PRD Section 10)', () => {
  it('should strip PII (user_id, phone, email) and round GPS coordinates on public reports endpoint', async () => {
    const res = await request(app).get('/api/v1/reports');
    expect(res.status).toBe(200);
    expect(res.body.reports.length).toBeGreaterThan(0);

    for (const r of res.body.reports) {
      expect(r.user_id).toBeUndefined();
      expect(r.phone).toBeUndefined();
      expect(r.email).toBeUndefined();
      // Verify lat/lon are rounded to at most 2 decimal places (snapped to grid centroid)
      const latStr = r.lat.toString();
      const lonStr = r.lon.toString();
      const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
      const lonDecimals = lonStr.includes('.') ? lonStr.split('.')[1].length : 0;
      expect(latDecimals).toBeLessThanOrEqual(2);
      expect(lonDecimals).toBeLessThanOrEqual(2);
    }
  });

  it('should provide full details and exact GPS coordinates to authenticated officers of that ward', async () => {
    const res = await request(app)
      .get('/api/v1/reports?ward_id=ward-1-sector-12')
      .set('Authorization', `Bearer ${officerWard1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.reports.length).toBeGreaterThan(0);

    // Check that at least one report has unrounded coordinates (e.g. 3+ decimal places) as stored in seed data
    const hasExactCoords = res.body.reports.some((r: any) => {
      const latDecimals = r.lat.toString().includes('.') ? r.lat.toString().split('.')[1].length : 0;
      return latDecimals >= 3;
    });
    expect(hasExactCoords).toBe(true);
  });
});

describe('5. Demo Spike Injection Trigger (PRD Section 4.4 & 11)', () => {
  it('should inject a severe sensor spike on demand and update critical alerts', async () => {
    const res = await request(app)
      .post('/api/v1/sensors/trigger-spike')
      .send({
        target_id: 'sensor-bhalswa-n1',
        pm25: 350.0,
        duration_seconds: 60
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.injected_pm25).toBe(350.0);

    // Verify alert created
    const alertsRes = await request(app)
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(alertsRes.status).toBe(200);
    expect(alertsRes.body.alerts.length).toBeGreaterThan(0);
  });
});
