import { Property } from '@activepieces/pieces-framework';

function buildStartOptionsProp() {
  return Property.Object({
    displayName: 'Start options',
    description:
      'Optional slicer/print-time metadata (nozzle, filament_material, print_speed, layer_height, infill, quality). Arbitrary keys allowed.',
    required: false,
  });
}

// CreateJob expects start_options as a JSON string. Returning null lets callers
// omit the field entirely instead of shipping `"null"` as the value.
function normalizeStartOptions(
  raw: Record<string, unknown> | null | undefined,
): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null || v === '') continue;
    cleaned[k] = v;
  }
  if (Object.keys(cleaned).length === 0) return null;
  return JSON.stringify(cleaned);
}

export const simplyprintStartOptions = {
  buildStartOptionsProp,
  normalizeStartOptions,
};

export interface StartOptions {
  nozzle?: string;
  filament_material?: string;
  print_speed?: string;
  layer_height?: string;
  infill?: string;
  quality?: string;
  [k: string]: unknown;
}
