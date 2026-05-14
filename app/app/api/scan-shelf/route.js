const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function buildPrompt(products) {
  const list = products.map((p) => `${p.id} | ${p.name} | ${p.ml}`).join('\n');
  return `Du analysierst ein Foto eines Verkaufsregals mit dieNikolai Bio-Traubenkosmetik-Produkten aus Oesterreich.

Erkenne sichtbare Produkte und schaetze die vorhandene Stueckzahl so realistisch wie moeglich.

Produktkatalog (ID | Name | Groesse):
${list}

Antworte NUR mit einem validen JSON-Objekt, ohne Backticks oder Markdown:
{
  "erkannt": [
    {"id": "FG00005", "menge": 4, "konfidenz": "hoch", "notiz": "Begruendung"}
  ],
  "nicht_erkannt": ["FG00001"],
  "beobachtung": "Gesamteindruck des Regals in 1-2 Saetzen"
}

Sei konservativ bei den Mengen. Lass Produkte weg, die du nicht mit ausreichender Sicherheit erkennst.`;
}

function jsonResponse(status, body) {
  return Response.json(body, { status });
}

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonResponse(500, { error: 'ANTHROPIC_API_KEY fehlt in Vercel.' });

  const body = await req.json().catch(() => null);
  if (!body?.image || !body?.mediaType || !Array.isArray(body.products)) {
    return jsonResponse(400, { error: 'Ungueltige Scan-Anfrage.' });
  }

  if (!SUPPORTED_IMAGE_TYPES.has(body.mediaType)) {
    return jsonResponse(400, { error: 'Bitte JPG, PNG, GIF oder WebP verwenden.' });
  }

  const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.image } },
            { type: 'text', text: buildPrompt(body.products) },
          ],
        },
      ],
    }),
  });

  const data = await anthropicResponse.json().catch(() => ({}));
  if (!anthropicResponse.ok) {
    return jsonResponse(anthropicResponse.status, {
      error: data?.error?.message || 'Anthropic-Scan fehlgeschlagen.',
    });
  }

  const text = (data.content || []).map((block) => block.text || '').join('');
  try {
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    return jsonResponse(200, { result });
  } catch {
    return jsonResponse(502, { error: 'KI-Antwort konnte nicht als JSON gelesen werden.', raw: text });
  }
}
