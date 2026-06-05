export function isAuthRoute() {
  const path = window.location.pathname;
  return path === '/login' || path === '/register' || path === '/marcar' || path === '/';
}

export function redirectToLogin() {
  window.location.href = '/login';
}
