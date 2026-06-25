import { useDb } from '../db'
import { googleAccounts } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function getValidAccessToken(): Promise<{ token: string; accountId: string } | null> {
  const db = useDb()
  const account = db.select().from(googleAccounts).limit(1).all()[0]
  if (!account) return null

  if (Date.now() > account.tokenExpiry - 60_000) {
    const config = useRuntimeConfig()
    const resp = await $fetch<{ access_token: string; expires_in: number }>(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refreshToken,
          client_id: config.googleClientId,
          client_secret: config.googleClientSecret,
        }).toString(),
      },
    )
    const newExpiry = Date.now() + resp.expires_in * 1000
    db.update(googleAccounts)
      .set({ accessToken: resp.access_token, tokenExpiry: newExpiry })
      .where(eq(googleAccounts.id, account.id))
      .run()
    return { token: resp.access_token, accountId: account.id }
  }

  return { token: account.accessToken, accountId: account.id }
}

export async function callGoogleApi<T>(
  method: string,
  url: string,
  token: string,
  body?: unknown,
): Promise<T> {
  return $fetch<T>(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
