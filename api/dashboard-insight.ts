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
Donne une seule observation courte (une phrase, maximum 25 mots), utile et concrète, en français, sur une tendance ou un conseil budgétaire. Pas de markdown, pas de guillemets, juste la phrase.`

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // gemini-3.6-flash spends part of the token budget on internal
        // reasoning before the visible answer (see suggest-category.ts).
        generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
      }),
    })

    if (!response.ok) {
      res.status(200).json({ insight: null })
      return
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    res.status(200).json({ insight: text || null })
  } catch {
    res.status(200).json({ insight: null })
  }
}
