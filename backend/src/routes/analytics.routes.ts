import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate, authorizeRoles, getEnforcedWardId } from '../middleware/auth';

const router = Router();

/**
 * GET /analytics/export
 * Exports ward summary report in CSV or text/printable PDF format.
 * Scoped server-side by authenticated officer's ward.
 */
router.get('/export', authenticate, authorizeRoles('analyst', 'admin', 'officer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { format = 'csv', ward_id, city_id } = req.query;
    const enforcedWardId = getEnforcedWardId(req, ward_id as string);

    // Fetch reports for summary
    let reportSql = `SELECT r.*, w.name as ward_name FROM report r LEFT JOIN ward w ON r.ward_id = w.id WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (enforcedWardId) {
      reportSql += ` AND r.ward_id = $${paramIndex++}`;
      params.push(enforcedWardId);
    }
    if (city_id) {
      reportSql += ` AND r.city_id = $${paramIndex++}`;
      params.push(city_id);
    }
    reportSql += ` ORDER BY r.created_at DESC`;

    const reports = await query(reportSql, params);

    // Fetch hotspot scores
    let scoreSql = `SELECT h.*, g.name as cell_name FROM hotspot_score h LEFT JOIN grid_cell g ON h.grid_cell_id = g.id WHERE 1=1`;
    const scoreParams: any[] = [];
    let scoreIdx = 1;
    if (enforcedWardId) {
      scoreSql += ` AND h.ward_id = $${scoreIdx++}`;
      scoreParams.push(enforcedWardId);
    }
    scoreSql += ` ORDER BY h.timestamp DESC LIMIT 50`;
    const scores = await query(scoreSql, scoreParams);

    if (format === 'csv') {
      const csvRows = [
        ['Report ID', 'Tracking ID', 'Ward', 'Category', 'AI Predicted Category', 'AI Confidence', 'Status', 'Action Taken', 'Created At']
      ];

      for (const r of reports) {
        csvRows.push([
          r.id,
          r.tracking_id,
          r.ward_name || r.ward_id,
          r.category,
          r.ai_predicted_category || 'N/A',
          r.ai_confidence ? String(r.ai_confidence) : '0',
          r.status,
          `"${(r.action_taken || '').replace(/"/g, '""')}"`,
          r.created_at
        ]);
      }

      const csvContent = csvRows.map(e => e.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=vayuvigil_ward_summary_${Date.now()}.csv`);
      res.status(200).send(csvContent);
      return;
    } else {
      // PDF / Formatted Summary text document
      let reportText = `================================================================================\n`;
      reportText += `VAYU VIGIL - WARD ENVIRONMENTAL SUMMARY REPORT\n`;
      reportText += `Generated on: ${new Date().toUTCString()}\n`;
      reportText += `Scope: ${enforcedWardId ? `Ward ${enforcedWardId}` : 'All Wards (Municipal Aggregation)'}\n`;
      reportText += `================================================================================\n\n`;

      reportText += `1. EXECUTIVE HOTSPOT OVERVIEW\n`;
      reportText += `--------------------------------------------------------------------------------\n`;
      if (scores.length === 0) {
        reportText += `No active hotspots logged in the trailing window.\n\n`;
      } else {
        for (const s of scores.slice(0, 10)) {
          const sev = Number(s.risk_score) >= 80 ? 'CRITICAL' : Number(s.risk_score) >= 50 ? 'MODERATE' : 'LOW';
          reportText += `• Location: ${s.cell_name || s.grid_cell_id} | Risk Score: ${s.risk_score}/100 (${sev})\n`;
          reportText += `  Dominant Pollutant: ${s.dominant_category?.toUpperCase()} | PM2.5 Index: ${s.pm25_component} | Complaints Index: ${s.complaint_component}\n\n`;
        }
      }

      reportText += `2. CITIZEN COMPLAINTS RESOLUTION LOG\n`;
      reportText += `--------------------------------------------------------------------------------\n`;
      reportText += `Total Reports Logged: ${reports.length}\n`;
      const resolvedCnt = reports.filter(r => r.status === 'resolved').length;
      const inspectingCnt = reports.filter(r => r.status === 'inspecting').length;
      const newCnt = reports.filter(r => r.status === 'new').length;
      reportText += `Status Breakdown: Resolved: ${resolvedCnt} | Inspecting: ${inspectingCnt} | New/Pending: ${newCnt}\n\n`;

      for (const r of reports.slice(0, 15)) {
        reportText += `[${r.tracking_id}] ${r.category?.toUpperCase()} - Status: ${r.status.toUpperCase()}\n`;
        reportText += `Description: ${r.description || 'No text description provided'}\n`;
        reportText += `Action Logged: ${r.action_taken || 'Pending assignment'}\n`;
        reportText += `Timestamp: ${r.created_at}\n--------------------------------------------------------------------------------\n`;
      }

      reportText += `\nEnd of Report. Vayu Vigil Civic-Tech Platform.\n`;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=vayuvigil_ward_summary_${Date.now()}.txt`);
      res.status(200).send(reportText);
      return;
    }
  } catch (err) {
    console.error('Error exporting analytics:', err);
    res.status(500).json({ error: 'Failed to generate export report' });
  }
});

export default router;
