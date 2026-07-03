import dotenv from 'dotenv';

dotenv.config();

export interface AIClassificationResult {
  predicted_category: 'smoke' | 'dust' | 'industry' | 'traffic' | 'other' | 'non-pollution';
  confidence: number;
  description_summary: string;
  is_mock: boolean;
}

/**
 * AI Photo Classification & Auto-Summarization Service
 * 
 * Takes an uploaded photo buffer and sends it to Gemini / Vertex AI multimodal vision endpoint
 * to classify into pollution categories with a confidence score.
 * 
 * // TODO(post-hackathon): replace with Vertex AI / Gemini Vision call — interface unchanged
 */
export async function classifyImage(
  fileBuffer: Buffer,
  fileName: string = 'upload.jpg',
  mimeType: string = 'image/jpeg',
  userDescription: string = ''
): Promise<AIClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If GEMINI_API_KEY is provided and not empty, attempt real LLM API call
  if (apiKey && apiKey.trim() !== '' && process.env.MOCK_MODE !== 'true') {
    try {
      console.log('Calling Gemini Multimodal Vision API for image classification...');
      const base64Image = fileBuffer.toString('base64');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are an AI environmental analyst for municipal air quality monitoring.
Analyze this image and the user description: "${userDescription}".
Classify the primary pollution category into EXACTLY ONE of these strings: "smoke", "dust", "industry", "traffic", "other", or "non-pollution".
Also provide a confidence score between 0.0 and 1.0, and a concise 1-sentence description summary for municipal dispatch.
Return ONLY a valid JSON object in this format: {"predicted_category": "...", "confidence": 0.95, "description_summary": "..."}`
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
            response_mime_type: "application/json"
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
          return {
            predicted_category: cat as any,
            confidence: Math.min(Math.max(Number(parsed.confidence) || 0.88, 0.1), 0.99),
            description_summary: parsed.description_summary || 'Pollution anomaly detected by AI vision model.',
            is_mock: false
          };
        }
      } else {
        console.warn(`Gemini API call returned status ${response.status}. Falling back to MOCK MODE.`);
      }
    } catch (error) {
      console.warn('Gemini API call failed or timed out. Falling back to MOCK MODE:', error);
    }
  }

  // MOCK MODE FALLBACK
  // Demonstrates the exact architecture with deterministic, realistic responses based on filename/text keywords
  console.log('Running Vision Classification in MOCK MODE (Zero API Key / Demo Safe Mode)');
  const lowerName = fileName.toLowerCase();
  const lowerDesc = userDescription.toLowerCase();

  let predicted_category: AIClassificationResult['predicted_category'] = 'smoke';
  let confidence = 0.92;
  let description_summary = 'Dense black smoke plume observed rising from open municipal waste combustion.';

  if (lowerName.includes('dust') || lowerDesc.includes('dust') || lowerDesc.includes('construction') || lowerDesc.includes('sand') || lowerDesc.includes('dhul')) {
    predicted_category = 'dust';
    confidence = 0.89;
    description_summary = 'Severe particulate dust generation from unpaved road or active construction site without water sprinkling.';
  } else if (lowerName.includes('factory') || lowerDesc.includes('industry') || lowerDesc.includes('chimney') || lowerDesc.includes('chemical') || lowerDesc.includes('exhaust')) {
    predicted_category = 'industry';
    confidence = 0.94;
    description_summary = 'Unregulated industrial stack emissions emitting high-opacity effluent above permissible standards.';
  } else if (lowerName.includes('traffic') || lowerDesc.includes('jam') || lowerDesc.includes('vehicle') || lowerDesc.includes('truck') || lowerDesc.includes('bus')) {
    predicted_category = 'traffic';
    confidence = 0.87;
    description_summary = 'Heavy vehicular congestion with diesel exhaust stagnation at major traffic intersection.';
  } else if (lowerName.includes('clean') || lowerDesc.includes('clear') || lowerDesc.includes('test') || lowerDesc.includes('normal')) {
    predicted_category = 'non-pollution';
    confidence = 0.95;
    description_summary = 'Ambient environment appears normal without acute visible pollution plumes.';
  } else if (lowerName.includes('other') || lowerDesc.includes('garbage') || lowerDesc.includes('smell') || lowerDesc.includes('odor')) {
    predicted_category = 'other';
    confidence = 0.83;
    description_summary = 'Localized municipal nuisance or unclassified pollutant emission requiring site inspection.';
  } else if (lowerName.includes('smoke') || lowerDesc.includes('fire') || lowerDesc.includes('burning') || lowerDesc.includes('dump')) {
    predicted_category = 'smoke';
    confidence = 0.96;
    description_summary = 'Acute open-air landfill/waste combustion producing hazardous PM2.5 smoke plume.';
  }

  return {
    predicted_category,
    confidence,
    description_summary,
    is_mock: true
  };
}
