export function isProduction(): boolean {
  return process.env.APP_ENVIRONMENT === "production";
}
