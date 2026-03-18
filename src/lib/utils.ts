export function isProduction(): boolean {
  return process.env.APP_ENVIRONMENT === "production";
}

export const URL_REGEX =
  /\b(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|app|co|uk|de|fr|ca|au|me|tv|ai|gg|ly|sh|to|info|edu|gov|rs|us|eu|it|es|nl|pl|ru|br|jp|cn|in|mx|se|no|dk|fi|ch|at|be|pt|cz|hu|ro|gr|tr|il|nz|za|sg|hk|tw|kr|ar|cl|ph|my|th|vn|ua|by|sk|hr|bg|lt|lv|ee|si)(?:\/[^\s]*)?)\b/g;

export function getHref(part: string): string {
  return part.startsWith("http") ? part : `https://${part}`;
}

export function isUrl(part: string): boolean {
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(part);
}
