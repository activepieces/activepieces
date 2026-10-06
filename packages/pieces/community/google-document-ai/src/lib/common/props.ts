import { Property } from '@activepieces/pieces-framework';
import type { DropdownState } from '@activepieces/pieces-framework';

import { googleDocumentAiAuth } from '../auth';
import { GoogleDocumentAiApi } from './client';
import type { Processor } from './client';
import { resolveAuth } from './token';
import type { GoogleDocumentAiAuthValue } from './token';

export function processorTypeLabel(type: string | undefined): string {
  if (!type) return 'unknown type';
  const words = type.replace(/_PROCESSOR$/, '').toLowerCase().split('_');
  return words.map((w, i) => (w === 'ocr' ? 'OCR' : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
}

export function processorLabel(processor: Processor): string {
  const id = processor.name.split('/').pop() ?? processor.name;
  const state = processor.state && processor.state !== 'ENABLED' ? ` · ${processor.state.toLowerCase()}` : '';
  return `${processor.displayName ?? id} (${processorTypeLabel(processor.type)})${state} · ${id}`;
}

export async function processorOptions(auth: GoogleDocumentAiAuthValue | undefined): Promise<DropdownState<string>> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Please select an existing or create a new connection.' };
  }
  try {
    const resolved = await resolveAuth(auth);
    const processors = await GoogleDocumentAiApi.listProcessors(resolved);
    if (processors.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: `No processors in project ${resolved.projectId}, location ${resolved.location}. Create one in Document AI → Processors.`,
      };
    }
    const options = processors
      .map((p) => ({ label: processorLabel(p), value: p.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return { disabled: false, options };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { disabled: true, options: [], placeholder: `Could not list processors: ${detail.slice(0, 300)}` };
  }
}

export const processorProp = Property.Dropdown({
  displayName: 'Processor',
  description: 'Processor of the connection\'s project and location. The list comes from Document AI; a disabled dropdown shows why.',
  required: true,
  auth: googleDocumentAiAuth,
  refreshers: [],
  options: async ({ auth }) => processorOptions(auth),
});
