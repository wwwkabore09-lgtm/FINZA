const KNOWN_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email not confirmed': 'Confirme ton email avant de te connecter (vérifie ta boîte mail).',
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Unable to validate email address: invalid format': "Le format de l'email est invalide.",
  'signup disabled': "Les inscriptions sont désactivées pour l'instant.",
  'Email rate limit exceeded': "Trop de tentatives. Réessaie dans quelques minutes.",
  'Network request failed': 'Impossible de contacter le serveur. Vérifie ta connexion internet.',
}

export function translateAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  for (const [key, translation] of Object.entries(KNOWN_MESSAGES)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation
    }
  }
  return 'Une erreur est survenue. Réessaie dans un instant.'
}
