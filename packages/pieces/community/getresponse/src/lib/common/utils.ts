export function requireString(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }
  return value;
}
