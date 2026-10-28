function sanitizeHeaderKey(key: string): string {
  return key.trim().replace(INVALID_HEADER_TOKEN_CHARS, '');
}

function sanitizeHeaders(headers: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!headers) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(headers)
      .map(([key, value]) => [sanitizeHeaderKey(key), value])
      .filter(([key]) => key !== '')
  );
}

const INVALID_HEADER_TOKEN_CHARS = /[^!#$%&'*+\-.^_`|~0-9A-Za-z]/g;

export const webhookHeaderUtils = {
  sanitizeHeaderKey,
  sanitizeHeaders,
};
