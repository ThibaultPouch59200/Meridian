import { useDb } from '../db'
import { googleAccounts } from '../db/schema'
import { eq } from 'drizzle-orm'

const TOKEN_REFRESH_BUFFER_MS = 60_000

export async function getValidAccessToken(): Promise<{ token: string; accountId: string } | null> {
  const db = useDb()
  const account = db.select().from(googleAccounts).limit(1).all()[0]
  if (!account) return null

  if (Date.now() > account.tokenExpiry - TOKEN_REFRESH_BUFFER_MS) {
    const config = useRuntimeConfig()
    try {
      const resp = await $fetch<{ access_token?: string; expires_in?: number }>(
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
      if (!resp.access_token || !resp.expires_in) return null
      const newExpiry = Date.now() + resp.expires_in * 1000
      db.update(googleAccounts)
        .set({ accessToken: resp.access_token, tokenExpiry: newExpiry })
        .where(eq(googleAccounts.id, account.id))
        .run()
      return { token: resp.access_token, accountId: account.id }
    } catch {
      return null
    }
  }

  return { token: account.accessToken, accountId: account.id }
}

export async function callGoogleApi<T>(
  method: string,
  url: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const response = await globalThis.fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  console.log(`[callGoogleApi] ${method} ${url} → ${response.status} (${response.headers.get('content-type')})`)
  if (!response.ok) {
    console.error(`[callGoogleApi] response body (first 500 chars):`, text.slice(0, 500))
    throw createError({ statusCode: response.status, message: `Google API ${response.status}: ${text.slice(0, 200)}` })
  }
  return JSON.parse(text) as T
}
