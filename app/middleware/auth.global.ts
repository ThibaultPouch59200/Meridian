export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return

  const isAuthenticated = import.meta.client
    ? localStorage.getItem('meridian_auth') === 'true'
    : false

  if (!isAuthenticated) {
    return navigateTo('/login')
  }
})
