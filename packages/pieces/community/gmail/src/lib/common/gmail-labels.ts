function resolveId(label: unknown): string {
  if (typeof label === 'string' && label.trim() !== '') {
    return label.trim();
  }
  if (
    isRecord(label) &&
    typeof label.id === 'string' &&
    label.id.trim() !== ''
  ) {
    return label.id.trim();
  }
  throw new Error(
    'A Gmail label ID is required. Select a label or pass a label ID from List Labels.'
  );
}

function resolveName(label: unknown): string {
  if (
    isRecord(label) &&
    typeof label.name === 'string' &&
    label.name.trim() !== ''
  ) {
    return label.name;
  }
  if (typeof label === 'string' && label.trim() !== '') {
    return label;
  }
  return 'unknown';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const gmailLabels = {
  resolveId,
  resolveName,
};
