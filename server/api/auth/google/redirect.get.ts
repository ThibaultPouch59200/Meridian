export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar',
      'email',
      'profile',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })
  return sendRedirect(event, `https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})
