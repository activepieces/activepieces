const REDACTED_KEY = /authorization|bearer|secret|token|password/i;

export function logEvent(
  event: string,
  fields: Record<string, string | number | boolean | undefined>,
): void {
  const safe: Record<string, string | number | boolean> = { event };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || REDACTED_KEY.test(key)) {
      continue;
    }
    if (typeof value === 'string' && value.length > 300) {
      continue;
    }
    safe[key] = value;
  }
  console.info(JSON.stringify(safe));
}
