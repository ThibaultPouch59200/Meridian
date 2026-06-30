import { getValidAccessToken, pushMeridianEventsToGoogle } from '../../utils/google'

export default defineEventHandler(async () => {
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  const pushed = await pushMeridianEventsToGoogle(tokenData.token, tokenData.accountId)
  return { ok: true, pushed }
})
