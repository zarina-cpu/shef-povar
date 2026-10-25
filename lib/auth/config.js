export function isTursoCloudReady() {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export function isAuthSecretReady() {
  return Boolean(process.env.AUTH_SECRET);
}

export function isGoogleAuthReady() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export function isCloudAuthConfigured() {
  return isAuthSecretReady() && isTursoCloudReady();
}
