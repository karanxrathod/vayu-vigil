import dotenv from 'dotenv';

dotenv.config();

// Discovered via ListModels: supported models for this API key
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface AIClassificationResult {
  predicted_category: 'smoke' | 'dust' | 'industry' | 'traffic' | 'other' | 'non-pollution';
  confidence: number;
  description_summary: string;
  is_mock: boolean;
}

export interface AITranslationResult {
  translated_text: string;
  detected_language: string;
  is_mock: boolean;
}

/**
 * Gemini Vision Image Classification
 * Sends the uploaded photo + citizen description to Gemini 2.0 Flash multimodal
 * and returns a structured pollution category + confidence score.
 */
export async function classifyImage(
  fileBuffer: Buffer,
  fileName: string = 'upload.jpg',
  mimeType: string = 'image/jpeg',
  userDescription: string = ''
): Promise<AIClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && process.env.MOCK_MODE !== 'true') {
    try {
      console.log(`[Gemini Vision] Classifying image via ${GEMINI_MODEL}...`);
      const base64Image = fileBuffer.toString('base64');

      const response = await fetch(`${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are an AI environmental analyst for the Vayu Vigil municipal air quality platform in India.
Analyze this image and the citizen description: "${userDescription}".

Task: Classify the primary pollution type visible in the image and described by the citizen.

Respond ONLY with a valid JSON object using EXACTLY this schema:
{
  "predicted_category": "<one of: smoke | dust | industry | traffic | other | non-pollution>",
  "confidence": <number between 0.0 and 1.0>,
  "description_summary": "<one concise English sentence suitable for a municipal dispatch officer>"
}

Pollution category definitions:
- smoke: Open burning — garbage dumps, crop burning, bonfires
- dust: Construction dust, unpaved road PM, demolition
- industry: Factory chimney emissions, chemical plants, industrial haze  
- traffic: Diesel exhaust, congestion, vehicle pollution
- other: Unclassified odor, liquid waste, sewage
- non-pollution: Clean environment, no visible pollutant`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          const validCategories = ['smoke', 'dust', 'industry', 'traffic', 'other', 'non-pollution'];
          const cat = validCategories.includes(parsed.predicted_category) ? parsed.predicted_category : 'other';
          console.log(`[Gemini Vision] LIVE RESULT: ${cat} (${(Number(parsed.confidence) * 100).toFixed(1)}%)`);
          return {
            predicted_category: cat as AIClassificationResult['predicted_category'],
            confidence: Math.min(Math.max(Number(parsed.confidence) || 0.88, 0.1), 0.99),
            description_summary: parsed.description_summary || 'Pollution anomaly detected by Gemini AI vision.',
            is_mock: false
          };
        }
      } else {
        const errBody = await response.text();
        // 429 = rate limit, log but fall through gracefully
        if (response.status === 429) {
          console.warn('[Gemini Vision] Free-tier quota exceeded — falling back to deterministic mock mode. Set billing on your GCP project to restore live inference.');
        } else {
          console.warn(`[Gemini Vision] API error ${response.status}: ${errBody.slice(0, 200)}`);
        }
      }
    } catch (error) {
      console.warn('[Gemini Vision] Network or parse error, falling back to mock:', error);
    }
  }

  // DETERMINISTIC MOCK FALLBACK
  // Demonstrates the exact architecture with realistic keyword-based responses.
  // is_mock: true lets the UI show "AI Demo Mode" badge instead of silently lying.
  console.log('[Gemini Vision] Running in DEMO MOCK MODE — configure GEMINI_API_KEY + billing to enable live inference');
  const lowerName = fileName.toLowerCase();
  const lowerDesc = userDescription.toLowerCase();

  let predicted_category: AIClassificationResult['predicted_category'] = 'smoke';
  let confidence = 0.92;
  let description_summary = 'Dense black smoke plume observed rising from open municipal waste combustion.';

  if (lowerDesc.includes('dust') || lowerDesc.includes('construction') || lowerDesc.includes('sand') || lowerDesc.includes('dhul') || lowerName.includes('dust')) {
    predicted_category = 'dust'; confidence = 0.89;
    description_summary = 'Severe particulate dust generation from unpaved road or active construction site.';
  } else if (lowerDesc.includes('industry') || lowerDesc.includes('factory') || lowerDesc.includes('chimney') || lowerDesc.includes('chemical') || lowerName.includes('factory')) {
    predicted_category = 'industry'; confidence = 0.94;
    description_summary = 'Unregulated industrial stack emissions above permissible standards.';
  } else if (lowerDesc.includes('jam') || lowerDesc.includes('vehicle') || lowerDesc.includes('truck') || lowerDesc.includes('traffic') || lowerName.includes('traffic')) {
    predicted_category = 'traffic'; confidence = 0.87;
    description_summary = 'Heavy vehicular congestion with diesel exhaust stagnation at intersection.';
  } else if (lowerDesc.includes('clean') || lowerDesc.includes('normal') || lowerName.includes('clean')) {
    predicted_category = 'non-pollution'; confidence = 0.95;
    description_summary = 'Ambient environment appears normal — no acute visible pollution detected.';
  } else if (lowerDesc.includes('garbage') || lowerDesc.includes('smell') || lowerDesc.includes('odor') || lowerName.includes('other')) {
    predicted_category = 'other'; confidence = 0.83;
    description_summary = 'Unclassified pollutant or municipal nuisance requiring on-site inspection.';
  } else if (lowerDesc.includes('fire') || lowerDesc.includes('burning') || lowerDesc.includes('dump') || lowerName.includes('smoke')) {
    predicted_category = 'smoke'; confidence = 0.96;
    description_summary = 'Acute open-air landfill/waste combustion producing hazardous PM2.5 smoke plume.';
  }

  return { predicted_category, confidence, description_summary, is_mock: true };
}

/**
 * Gemini Text Translation
 * Translates citizen descriptions from Hindi/Marathi into English for officer dashboards.
 * Uses Gemini 2.0 Flash text endpoint — no separate Translation API key needed.
 */
export async function translateToEnglish(
  text: string,
  sourceLang: string = 'auto'
): Promise<AITranslationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && process.env.MOCK_MODE !== 'true') {
    try {
      console.log(`[Gemini Translate] Translating from ${sourceLang}...`);
      const response = await fetch(`${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following citizen pollution report text to English. The source language is ${sourceLang === 'auto' ? 'Hindi or Marathi' : sourceLang}.
Keep technical pollution terms (PM2.5, AQI) as-is. Be concise and preserve meaning.
Respond ONLY with this JSON: {"translated_text": "<English translation>", "detected_language": "<hi|mr|en>"}

Text to translate: "${text}"`
            }]
          }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          return {
            translated_text: parsed.translated_text || text,
            detected_language: parsed.detected_language || sourceLang,
            is_mock: false
          };
        }
      } else if (response.status === 429) {
        console.warn('[Gemini Translate] Quota exceeded — returning original text');
      }
    } catch (err) {
      console.warn('[Gemini Translate] Error:', err);
    }
  }

  // Fallback: return original text unchanged
  return { translated_text: text, detected_language: sourceLang, is_mock: true };
}

/**
 * Gemini Audio Transcription (Voice Note → Text)
 * Transcribes a citizen voice note (webm/wav/mp3) into text.
 * Uses Gemini 2.0 Flash multimodal audio capability.
 */
export async function transcribeAudioNote(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm',
  language: string = 'hi'
): Promise<{ transcript: string; is_mock: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && process.env.MOCK_MODE !== 'true') {
    try {
      console.log(`[Gemini Audio] Transcribing voice note (${mimeType})...`);
      const base64Audio = audioBuffer.toString('base64');
      const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';

      const response = await fetch(`${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Transcribe this citizen voice note in ${langName}. Output only the transcription text with no formatting, quotes, or labels.` },
              { inline_data: { mime_type: mimeType, data: base64Audio } }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (transcript) {
          console.log(`[Gemini Audio] Transcript: "${transcript.slice(0, 80)}..."`);
          return { transcript, is_mock: false };
        }
      } else if (response.status === 429) {
        console.warn('[Gemini Audio] Quota exceeded — using placeholder');
      }
    } catch (err) {
      console.warn('[Gemini Audio] Error:', err);
    }
  }

  return { transcript: '[Voice note received — transcription requires active Gemini API quota]', is_mock: true };
}
