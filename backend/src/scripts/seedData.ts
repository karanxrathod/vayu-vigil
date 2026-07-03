import { query, execute } from '../db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function seedDatabase(forceReset: boolean = false): Promise<void> {
  const wards = await query('SELECT COUNT(*) as cnt FROM ward');
  const count = Number(wards[0]?.cnt || 0);

  if (count > 0 && !forceReset) {
    console.log('Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('--- Seeding Vayu Vigil Database ---');

  if (forceReset) {
    await execute('DELETE FROM alert');
    await execute('DELETE FROM hotspot_forecast');
    await execute('DELETE FROM hotspot_score');
    await execute('DELETE FROM grid_cell');
    await execute('DELETE FROM sensor_reading');
    await execute('DELETE FROM sensor');
    await execute('DELETE FROM report');
    await execute('DELETE FROM app_user');
    await execute('DELETE FROM ward');
    await execute('DELETE FROM city');
  }

  const timestamp = new Date().toISOString();
  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. City
  await execute(
    `INSERT INTO city (id, name, state) VALUES ($1, $2, $3)`,
    ['city-1-delhi', 'New Delhi NCR', 'Delhi']
  );

  // 2. Wards
  await execute(
    `INSERT INTO ward (id, city_id, name, boundary) VALUES ($1, $2, $3, $4)`,
    ['ward-1-sector-12', 'city-1-delhi', 'Sector 12 / Bhalswa Ward', '{"type":"Polygon","coordinates":[[[77.13,28.72],[77.18,28.72],[77.18,28.78],[77.13,28.78],[77.13,28.72]]]}']
  );
  await execute(
    `INSERT INTO ward (id, city_id, name, boundary) VALUES ($1, $2, $3, $4)`,
    ['ward-2-sector-9', 'city-1-delhi', 'Sector 9 Market Ward', '{"type":"Polygon","coordinates":[[[77.17,28.69],[77.21,28.69],[77.21,28.72],[77.17,28.72],[77.17,28.69]]]}']
  );
  await execute(
    `INSERT INTO ward (id, city_id, name, boundary) VALUES ($1, $2, $3, $4)`,
    ['ward-3-ring-road', 'city-1-delhi', 'Ring Road Ward', '{"type":"Polygon","coordinates":[[[77.21,28.65],[77.25,28.65],[77.25,28.69],[77.21,28.69],[77.21,28.65]]]}']
  );

  // 3. App Users
  const users = [
    { id: 'user-officer-1', phone: '+919800000001', email: 'officer.ward1@vayuvigil.gov', role: 'officer', ward_id: 'ward-1-sector-12' },
    { id: 'user-officer-2', phone: '+919800000002', email: 'officer.ward2@vayuvigil.gov', role: 'officer', ward_id: 'ward-2-sector-9' },
    { id: 'user-admin', phone: '+919800000000', email: 'admin@vayuvigil.gov', role: 'admin', ward_id: null },
    { id: 'user-analyst', phone: '+919800000003', email: 'analyst@vayuvigil.gov', role: 'analyst', ward_id: null },
    { id: 'user-citizen-demo', phone: '+919876543210', email: 'priya.citizen@gmail.com', role: 'citizen', ward_id: 'ward-1-sector-12' }
  ];

  for (const u of users) {
    await execute(
      `INSERT INTO app_user (id, phone, email, password_hash, role, preferred_language, ward_id, city_id, created_at)
       VALUES ($1, $2, $3, $4, $5, 'en', $6, 'city-1-delhi', $7)`,
      [u.id, u.phone, u.email, passwordHash, u.role, u.ward_id, timestamp]
    );
  }

  // 4. Grid Cells (500m tiles)
  const cells = [
    { id: 'cell-bhalswa-12', name: 'Bhalswa Landfill Grid 500m', ward_id: 'ward-1-sector-12', lat: 28.745, lon: 77.162 },
    { id: 'cell-market-9', name: 'Sector 9 Market Grid 500m', ward_id: 'ward-2-sector-9', lat: 28.705, lon: 77.185 },
    { id: 'cell-ring-rd-3', name: 'Ring Road Junction Grid 500m', ward_id: 'ward-3-ring-road', lat: 28.675, lon: 77.225 }
  ];

  for (const c of cells) {
    await execute(
      `INSERT INTO grid_cell (id, ward_id, city_id, name, centroid_lat, centroid_lon, bbox_min_lat, bbox_min_lon, bbox_max_lat, bbox_max_lon)
       VALUES ($1, $2, 'city-1-delhi', $3, $4, $5, $6, $7, $8, $9)`,
      [c.id, c.ward_id, c.name, c.lat, c.lon, c.lat - 0.005, c.lon - 0.005, c.lat + 0.005, c.lon + 0.005]
    );
  }

  // 5. Sensors
  const sensors = [
    { id: 'sensor-bhalswa-n1', ward_id: 'ward-1-sector-12', name: 'Bhalswa Landfill North Gate Sensor', lat: 28.748, lon: 77.160 },
    { id: 'sensor-bhalswa-s2', ward_id: 'ward-1-sector-12', name: 'Bhalswa Landfill South Bypass Node', lat: 28.742, lon: 77.164 },
    { id: 'sensor-sec12-m3', ward_id: 'ward-1-sector-12', name: 'Sector 12 Metro Station Node', lat: 28.735, lon: 77.155 },
    { id: 'sensor-gt-karnal4', ward_id: 'ward-1-sector-12', name: 'GT Karnal Road Junction Sensor', lat: 28.752, lon: 77.168 },
    { id: 'sensor-sec9-mkt1', ward_id: 'ward-2-sector-9', name: 'Sector 9 Central Market Node', lat: 28.706, lon: 77.184 },
    { id: 'sensor-sec9-comm2', ward_id: 'ward-2-sector-9', name: 'Sector 9 Community Center Node', lat: 28.702, lon: 77.188 },
    { id: 'sensor-sec9-prash3', ward_id: 'ward-2-sector-9', name: 'Prashant Vihar Road School Node', lat: 28.710, lon: 77.180 },
    { id: 'sensor-ring-fly1', ward_id: 'ward-3-ring-road', name: 'Ring Road Flyover Air Node', lat: 28.676, lon: 77.224 },
    { id: 'sensor-azad-jn2', ward_id: 'ward-3-ring-road', name: 'Azadpur Traffic Junction Node', lat: 28.672, lon: 77.228 }
  ];

  for (const s of sensors) {
    await execute(
      `INSERT INTO sensor (id, ward_id, city_id, name, lat, lon, status, created_at)
       VALUES ($1, $2, 'city-1-delhi', $3, $4, $5, 'active', $6)`,
      [s.id, s.ward_id, s.name, s.lat, s.lon, timestamp]
    );
  }

  // 6. Citizen Reports (18 sample reports)
  const sampleReports = [
    // CRITICAL CLUSTER in Bhalswa (Ward 1) -> Acute smoke
    { ward: 'ward-1-sector-12', cat: 'smoke', desc: 'Huge thick black smoke plume rising from open garbage burning at Bhalswa landfill perimeter.', lat: 28.746, lon: 77.161, status: 'new', conf: 0.96 },
    { ward: 'ward-1-sector-12', cat: 'smoke', desc: 'Toxic acrid smoke entering residential apartments from landfill combustion. Children coughing.', lat: 28.744, lon: 77.163, status: 'inspecting', conf: 0.95 },
    { ward: 'ward-1-sector-12', cat: 'smoke', desc: 'Continuous night-time waste burning near dump yard boundary wall.', lat: 28.747, lon: 77.159, status: 'new', conf: 0.94 },
    { ward: 'ward-1-sector-12', cat: 'smoke', desc: 'Smog trap caused by plastic and solid waste burning on bypass road.', lat: 28.743, lon: 77.165, status: 'new', conf: 0.92 },
    { ward: 'ward-1-sector-12', cat: 'smoke', desc: 'Open fire burning electrical wire scrap near dairy colony.', lat: 28.749, lon: 77.162, status: 'new', conf: 0.93 },
    { ward: 'ward-1-sector-12', cat: 'dust', desc: 'Unpaved road dust cloud whenever water tankers pass by.', lat: 28.736, lon: 77.156, status: 'new', conf: 0.88 },
    { ward: 'ward-1-sector-12', cat: 'dust', desc: 'Construction sand left uncovered without green net sprinkling.', lat: 28.738, lon: 77.154, status: 'resolved', action: 'Water-mist cannon deployed by municipal team and contractor warned.', conf: 0.89 },
    
    // Sector 9 Market (Ward 2) -> Moderate dust & traffic
    { ward: 'ward-2-sector-9', cat: 'dust', desc: 'Road excavation dust spreading across market stalls.', lat: 28.705, lon: 77.185, status: 'new', conf: 0.87 },
    { ward: 'ward-2-sector-9', cat: 'dust', desc: 'Heavy dust from building demolition without water spray.', lat: 28.707, lon: 77.183, status: 'inspecting', conf: 0.90 },
    { ward: 'ward-2-sector-9', cat: 'traffic', desc: 'Delivery trucks idling diesel engines for hours in loading bay.', lat: 28.704, lon: 77.187, status: 'new', conf: 0.86 },
    { ward: 'ward-2-sector-9', cat: 'other', desc: 'Uncollected market waste pile generating foul odor and flies.', lat: 28.703, lon: 77.186, status: 'resolved', action: 'Sanitation crew dispatched; waste cleared.', conf: 0.82 },
    { ward: 'ward-2-sector-9', cat: 'dust', desc: 'Dry road sweeping blowing PM10 dust into pedestrian faces.', lat: 28.708, lon: 77.182, status: 'new', conf: 0.85 },
    
    // Ring Road (Ward 3) -> Vehicular traffic & industrial exhaust
    { ward: 'ward-3-ring-road', cat: 'traffic', desc: 'Severe diesel smoke exhaust from old buses stuck in traffic bottleneck.', lat: 28.675, lon: 77.225, status: 'new', conf: 0.91 },
    { ward: 'ward-3-ring-road', cat: 'traffic', desc: 'Heavy vehicular congestion at underpass junction causing smog accumulation.', lat: 28.674, lon: 77.226, status: 'new', conf: 0.88 },
    { ward: 'ward-3-ring-road', cat: 'industry', desc: 'Black smoke plume from small industrial unit generator chimney.', lat: 28.677, lon: 77.223, status: 'inspecting', conf: 0.94 },
    { ward: 'ward-3-ring-road', cat: 'industry', desc: 'Chemical smell and vapor release near railway siding workshop.', lat: 28.673, lon: 77.227, status: 'new', conf: 0.89 },
    { ward: 'ward-3-ring-road', cat: 'traffic', desc: 'Overloaded commercial vehicles emitting black smoke on slope.', lat: 28.676, lon: 77.224, status: 'resolved', action: 'Traffic police challan issued and vehicle removed.', conf: 0.90 }
  ];

  for (let i = 0; i < sampleReports.length; i++) {
    const r = sampleReports[i];
    const id = crypto.randomUUID();
    const trackingId = `VV-${1001 + i}`;
    const timeOffsetMs = (Math.random() * 5 + 1) * 60 * 60 * 1000; // 1 to 6 hours ago
    const reportTime = new Date(Date.now() - timeOffsetMs).toISOString();

    await execute(
      `INSERT INTO report (
        id, tracking_id, user_id, ward_id, city_id, category, description, language,
        photo_url, voice_url, lat, lon, ai_predicted_category, ai_confidence,
        status, action_taken, assigned_officer_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'city-1-delhi', $5, $6, 'en', null, null, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id, trackingId, 'user-citizen-demo', r.ward, r.cat, r.desc,
        r.lat, r.lon, r.cat, r.conf, r.status,
        (r as any).action || null,
        r.status === 'inspecting' || r.status === 'resolved' ? 'user-officer-1' : null,
        reportTime, reportTime
      ]
    );
  }

  // 7. Generate 24 hours of sensor reading history for realistic charts
  console.log('Generating historical sensor readings and initial hotspot scores...');
  const nowMs = Date.now();
  for (const s of sensors) {
    // Generate 12 historical readings over last 6 hours
    for (let h = 6; h >= 0; h -= 0.5) {
      const readingTime = new Date(nowMs - h * 60 * 60 * 1000).toISOString();
      let pm25 = 45.0 + (Math.random() * 15 - 7);
      if (s.ward_id === 'ward-1-sector-12') {
        pm25 = 140.0 + (Math.random() * 40 - 20); // Bhalswa baseline severe
      } else if (s.ward_id === 'ward-3-ring-road') {
        pm25 = 68.0 + (Math.random() * 20 - 10);
      }
      const pm10 = pm25 * 1.65;
      await execute(
        `INSERT INTO sensor_reading (id, sensor_id, ward_id, city_id, lat, lon, timestamp, pm25, pm10, no2, co, temp, humidity, is_spike)
         VALUES ($1, $2, $3, 'city-1-delhi', $4, $5, $6, $7, $8, 28.0, 1.4, 32.5, 58.0, 0)`,
        [crypto.randomUUID(), s.id, s.ward_id, s.lat, s.lon, readingTime, Math.round(pm25 * 10) / 10, Math.round(pm10 * 10) / 10]
      );
    }
  }

  console.log('--- Seeding completed successfully! ---');
}
