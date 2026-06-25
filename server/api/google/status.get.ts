import { useDb } from '../../db'
import { googleAccounts, googleCalendars } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(() => {
  const db = useDb()
  const account = db.select().from(googleAccounts).limit(1).all()[0] ?? null
  const calendars = account
    ? db.select().from(googleCalendars)
        .where(eq(googleCalendars.googleAccountId, account.id))
        .all()
    : []

  return {
    account: account
      ? {
          id: account.id,
          googleEmail: account.googleEmail,
          meridianCalendarId: account.meridianCalendarId,
          createdAt: account.createdAt,
        }
      : null,
    calendars,
  }
})
