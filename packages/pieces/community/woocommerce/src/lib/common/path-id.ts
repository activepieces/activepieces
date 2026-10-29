function encode({ id, label }: { id: unknown; label: string }): string {
  const value = String(id).trim();
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new Error(`${label} must be a whole number, for example 123.`);
  }
  return value;
}

export const wooPathId = {
  encode,
};
