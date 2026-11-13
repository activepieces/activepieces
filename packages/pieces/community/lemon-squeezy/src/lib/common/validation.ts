export function countryCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    throw new Error('Country must be a 2-letter ISO 3166-1 alpha-2 code, for example US, GB or DE.');
  }
  return code;
}
