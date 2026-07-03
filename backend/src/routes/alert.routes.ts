import { Router, Request, Response } from 'express';
import { query, execute } from '../db';
import { authenticate, authorizeRoles, getEnforcedWardId } from '../middleware/auth';

const router = Router();

/**
 * GET /alerts
 * Lists active alerts for the authenticated officer's ward (or all wards if admin/analyst).
 */
router.get('/', authenticate, authorizeRoles('officer', 'admin', 'analyst'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { ward_id, city_id } = req.query;
    const enforcedWardId = getEnforcedWardId(req, ward_id as string);

    let sql = `SELECT a.*, g.name as locality_name, g.centroid_lat, g.centroid_lon 
               FROM alert a 
               LEFT JOIN grid_cell g ON a.grid_cell_id = g.id 
               WHERE a.status != 'resolved'`;
    const params: any[] = [];
    let paramIndex = 1;

    if (enforcedWardId) {
      sql += ` AND a.ward_id = $${paramIndex++}`;
      params.push(enforcedWardId);
    }
    if (city_id) {
      sql += ` AND a.city_id = $${paramIndex++}`;
      params.push(city_id);
    }

    sql += ` ORDER BY a.risk_score DESC, a.created_at DESC`;

    const alerts = await query(sql, params);

    res.status(200).json({ alerts });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

/**
 * PATCH /alerts/:id/acknowledge
 * Officer acknowledges or resolves an active alert.
 */
router.patch('/:id/acknowledge', authenticate, authorizeRoles('officer', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status = 'acknowledged' } = req.body;

    const alerts = await query('SELECT * FROM alert WHERE id = $1', [id]);
    const alert = alerts[0];
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    // Enforce ward isolation
    if (req.user?.role === 'officer' && req.user.ward_id !== alert.ward_id) {
      res.status(403).json({ error: 'Forbidden: Cannot acknowledge alerts outside your assigned ward' });
      return;
    }

    await execute(`UPDATE alert SET status = $1 WHERE id = $2`, [status, id]);

    res.status(200).json({ success: true, message: `Alert status updated to ${status}` });
  } catch (err) {
    console.error('Error acknowledging alert:', err);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

export default router;
