import { useDb } from '../../../db'
import { googleAccounts, googleCalendars, events } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken } from '../../../utils/google'

export default defineEventHandler(async () => {
  const tokenData = await getValidAccessToken()

  if (tokenData) {
    try {
      await $fetch(
        `https://oauth2.googleapis.com/revoke?token=${tokenData.token}`,
        { method: 'POST' },
      )
    } catch {}
  }

  const db = useDb()
  const account = db.select({ id: googleAccounts.id }).from(googleAccounts).limit(1).all()[0]
  if (account) {
    db.delete(events).where(eq(events.source, 'google')).run()
    db.delete(googleCalendars).where(eq(googleCalendars.googleAccountId, account.id)).run()
    db.delete(googleAccounts).where(eq(googleAccounts.id, account.id)).run()
  }

  return { ok: true }
})
