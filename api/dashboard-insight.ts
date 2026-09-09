import type { VercelRequest, VercelResponse } from '@vercel/node'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(200).json({ insight: null })
    return
  }

  const { currentMonth, previousMonth } = req.body as {
    currentMonth?: Record<string, number>
    previousMonth?: Record<string, number>
  }

  if (!currentMonth || Object.keys(currentMonth).length === 0) {
    res.status(200).json({ insight: null })
    return
  }

  const prompt = `Voici les dépenses par catégorie d'un utilisateur, en Franc CFA (XOF).
Ce mois-ci : ${JSON.stringify(currentMonth)}
Le mois dernier : ${JSON.stringify(previousMonth ?? {})}
Identifie la tendance la plus intéressante (sans calculer de pourcentage exact, reste qualitatif : "a augmenté", "a beaucoup baissé", etc.) et donne un conseil ou une observation courte et utile, en français, maximum 20 mots.`

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          // gemini-3.6-flash spends part of the budget on internal reasoning
          // (and, for numeric prompts, visible scratch arithmetic) before the
          // final answer - structured output keeps it constrained to the
          // schema instead of writing out its working in plain text.
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: { insight: { type: 'STRING' } },
            required: ['insight'],
          },
        },
      }),
    })

    const rawText = await response.text()
    if (!response.ok) {
      res.status(200).json({ insight: null, debugStatus: response.status, debugBody: rawText.slice(0, 1000) })
      return
    }

    res.status(200).json({ debugRaw: rawText.slice(0, 2000) })
  } catch (err) {
    res.status(200).json({
      insight: null,
      debugCatch: err instanceof Error ? err.message : String(err),
    })
  }
}
