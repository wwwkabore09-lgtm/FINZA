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
    res.status(500).json({ error: 'Clé API Gemini manquante' })
    return
  }

  const { description, categories } = req.body as {
    description?: string
    categories?: string[]
  }
  if (!description || !categories || categories.length === 0) {
    res.status(400).json({ error: 'Requête invalide' })
    return
  }

  const prompt = `Voici la description d'une transaction financière : "${description}".
Choisis la catégorie la plus adaptée parmi cette liste exacte : ${categories.join(', ')}.
Réponds uniquement avec le nom exact de la catégorie choisie, sans rien ajouter d'autre. Si aucune catégorie ne convient, réponds "AUCUNE".`

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // gemini-3.6-flash spends tokens on internal reasoning before the visible
        // answer, so the budget must cover that overhead or the response truncates empty.
        generationConfig: { temperature: 0, maxOutputTokens: 300 },
      }),
    })

    if (!response.ok) {
      res.status(502).json({ error: 'Erreur du service IA' })
      return
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
    const match = categories.find((c) => c.toLowerCase() === text.toLowerCase())
    res.status(200).json({ category: match ?? null })
  } catch {
    res.status(502).json({ error: 'Erreur du service IA' })
  }
}
