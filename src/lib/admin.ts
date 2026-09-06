const ADMIN_EMAILS = ['www.kabore09@gmail.com']

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}
