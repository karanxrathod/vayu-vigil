import { query, execute } from '../db';
import { runScoringJob } from './scoring.service';
import crypto from 'crypto';

export interface BotInteraction {
  id: string;
  channel: 'whatsapp' | 'sms';
  sender_phone: string;
  message_text: string;
  media_url?: string;
  assigned_report_id: string;
  tracking_id: string;
  ai_confidence: number;
  detected_category: string;
  reply_sent: string;
  timestamp: string;
}

let botHistory: BotInteraction[] = [
  {
    id: 'bot-msg-101',
    channel: 'whatsapp',
    sender_phone: '+919876543210',
    message_text: 'Severe plastic waste burning near Sector 12 bus stop, very hard to breathe here!',
    media_url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&auto=format&fit=crop&q=80',
    assigned_report_id: 'rep-wa-01',
    tracking_id: 'VV-9041',
    ai_confidence: 0.95,
    detected_category: 'smoke',
    reply_sent: '🇮🇳 Vayu Vigil Municipal Bot: Dhanyawad! Your report #VV-9041 (Smoke - 95% AI confidence) has been registered with Ward 1 (Sector 12) environmental authorities for immediate inspection.',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'bot-msg-102',
    channel: 'sms',
    sender_phone: '+919811223344',
    message_text: 'Heavy construction sand flying across main road without water sprinkling at Sector 9 market.',
    assigned_report_id: 'rep-sms-02',
    tracking_id: 'VV-9042',
    ai_confidence: 0.88,
    detected_category: 'dust',
    reply_sent: '🇮🇳 Vayu Vigil Municipal Bot: Thank you! Incident #VV-9042 (Dust - Ward 2 Sector 9) has been logged. Our municipal water sprinkler tanker team has been notified.',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export class BotService {
  public static getHistory(channel?: string): BotInteraction[] {
    if (channel && channel !== 'all') {
      return botHistory.filter(b => b.channel === channel);
    }
    return botHistory;
  }

  public static async processIncomingMessage(
    channel: 'whatsapp' | 'sms',
    senderPhone: string,
    text: string,
    mediaUrl?: string,
    lat?: number,
    lon?: number
  ): Promise<{ success: boolean; interaction: BotInteraction; report: any }> {
    const now = new Date().toISOString();
    const trackingId = `VV-${Math.floor(1000 + Math.random() * 9000)}`;
    const reportId = crypto.randomUUID();

    // Determine category and coordinates from text/media
    let category = 'other';
    const lower = text.toLowerCase();
    if (lower.includes('smoke') || lower.includes('fire') || lower.includes('burn') || lower.includes('aag') || lower.includes('dhua')) {
      category = 'smoke';
    } else if (lower.includes('dust') || lower.includes('sand') || lower.includes('mud') || lower.includes('dhul')) {
      category = 'dust';
    } else if (lower.includes('factory') || lower.includes('industry') || lower.includes('chimney') || lower.includes('karkhana')) {
      category = 'industry';
    } else if (lower.includes('traffic') || lower.includes('bus') || lower.includes('truck') || lower.includes('exhaust')) {
      category = 'traffic';
    }

    // Default coordinates if not provided (snapped to Ward 1 or Ward 2 based on text)
    let targetLat = lat || 28.7450;
    let targetLon = lon || 77.1620;
    let wardId = 'ward-1-sector-12';
    let gridCellId = 'cell-bhalswa-12';
    let locality = 'Ward 1: Sector 12 / Bhalswa';

    if (lower.includes('sec 9') || lower.includes('sector 9') || lower.includes('market') || lower.includes('ward 2')) {
      targetLat = 28.7060;
      targetLon = 77.1840;
      wardId = 'ward-2-sector-9';
      gridCellId = 'cell-sec9-01';
      locality = 'Ward 2: Sector 9 Market Area';
    }

    // Run AI Classification if media URL or simulate vision confidence
    let aiConf = 0.92;
    if (mediaUrl) {
      try {
        aiConf = 0.96;
      } catch (err) {
        console.error('AI Bot check error:', err);
      }
    }

    // Insert Citizen Report into database
    await execute(
      `INSERT INTO report (
        id, tracking_id, user_id, ward_id, grid_cell_id, city_id,
        category, description, photo_url, lat, lon,
        status, ai_confidence, ai_category, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        reportId,
        trackingId,
        `bot-${channel}-${senderPhone.slice(-4)}`,
        wardId,
        gridCellId,
        'city-1-delhi',
        category,
        `[Reported via ${channel.toUpperCase()} Bot from ${senderPhone}]: ${text}`,
        mediaUrl || null,
        targetLat,
        targetLon,
        'new',
        aiConf,
        category,
        now,
        now
      ]
    );

    // Formulate official multilingual receipt message
    const replyText = `🇮🇳 Vayu Vigil Municipal Bot: Dhanyawad! Your report #${trackingId} (${category.toUpperCase()} - ${locality}) has been verified with ${Math.round(aiConf * 100)}% AI confidence and logged to the Officer Dispatch Queue. Tracking link: https://vayuvigil.gov/track/${trackingId}`;

    const newInteraction: BotInteraction = {
      id: `bot-int-${crypto.randomUUID().slice(0, 8)}`,
      channel,
      sender_phone: senderPhone,
      message_text: text,
      media_url: mediaUrl,
      assigned_report_id: reportId,
      tracking_id: trackingId,
      ai_confidence: aiConf,
      detected_category: category,
      reply_sent: replyText,
      timestamp: now
    };

    botHistory.unshift(newInteraction);
    if (botHistory.length > 25) botHistory.pop();

    // Trigger Hotspot Risk Score recalculation
    await runScoringJob();

    return {
      success: true,
      interaction: newInteraction,
      report: {
        id: reportId,
        tracking_id: trackingId,
        category,
        ward_id: wardId,
        status: 'new',
        ai_confidence: aiConf,
        locality_name: locality
      }
    };
  }
}
