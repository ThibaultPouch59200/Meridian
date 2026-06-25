import { useDb } from '../../../db'
import { googleAccounts, googleCalendars, events } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  if (!code || typeof code !== 'string') {
    throw createError({ statusCode: 400, message: 'Missing OAuth code' })
  }

  const config = useRuntimeConfig()

  let tokens: { access_token: string; refresh_token?: string; expires_in: number }
  try {
    tokens = await $fetch<{ access_token: string; refresh_token?: string; expires_in: number }>(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.googleClientId,
          client_secret: config.googleClientSecret,
          redirect_uri: config.googleRedirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      },
    )
  } catch {
    throw createError({ statusCode: 502, message: 'Google token exchange failed' })
  }

  if (!tokens.refresh_token) {
    throw createError({
      statusCode: 400,
      message: 'Google did not return a refresh token — re-authorize the app with offline access',
    })
  }

  let userInfo: { email?: string }
  try {
    userInfo = await $fetch<{ email?: string }>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    )
  } catch {
    throw createError({ statusCode: 502, message: 'Failed to fetch Google user info' })
  }

  if (!userInfo.email) {
    throw createError({ statusCode: 502, message: 'Google user info missing email' })
  }

  const db = useDb()
  const existing = db.select({ id: googleAccounts.id }).from(googleAccounts).limit(1).all()[0]
  if (existing) {
    db.delete(googleCalendars).where(eq(googleCalendars.googleAccountId, existing.id)).run()
    db.delete(events).where(eq(events.source, 'google')).run()
    db.delete(googleAccounts).where(eq(googleAccounts.id, existing.id)).run()
  }

  db.insert(googleAccounts).values({
    id: Date.now().toString(),
    googleEmail: userInfo.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiry: Date.now() + tokens.expires_in * 1000,
    meridianCalendarId: null,
    createdAt: Date.now(),
  }).run()

  return sendRedirect(event, '/settings?step=calendars')
})
