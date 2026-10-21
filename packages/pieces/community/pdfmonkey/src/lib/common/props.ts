import { DropdownState, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from './auth';
import { pdfmonkeyOperations } from './operations';

async function dropdown({
  auth,
  load,
}: {
  auth: unknown;
  load: () => Promise<{ options: { label: string; value: string }[]; truncated: boolean }>;
}): Promise<DropdownState<string>> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your PDFMonkey account first.' };
  }
  try {
    const { options, truncated } = await load();
    return {
      disabled: false,
      options,
      placeholder: options.length === 0 ? 'Nothing found in this account.' : truncated ? `Showing the first ${options.length}; map an ID instead.` : 'Select one',
    };
  } catch (error) {
    return { disabled: true, options: [], placeholder: `Could not load the list: ${error instanceof Error ? error.message : 'unknown error'}` };
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export const templateIdDropdown = Property.Dropdown({
  displayName: 'Template ID',
  auth: pdfmonkeyAuth,
  required: true,
  refreshers: [],
  options: async ({ auth }) =>
    dropdown({
      auth,
      load: async () => {
        const { templates, truncated } = await pdfmonkeyOperations.listTemplates({ auth });
        return {
          truncated,
          options: templates
            .filter((template) => typeof template['id'] === 'string')
            .map((template) => ({ label: text(template['identifier']) || text(template['id']), value: text(template['id']) })),
        };
      },
    }),
});

export const documentIdDropdown = Property.Dropdown({
  displayName: 'Document ID',
  required: true,
  refreshers: [],
  auth: pdfmonkeyAuth,
  options: async ({ auth }) =>
    dropdown({
      auth,
      load: async () => {
        const { items, truncated } = await pdfmonkeyOperations.listAllDocumentCards({ auth, query: {} });
        return {
          truncated,
          options: items
            .filter((document) => typeof document['id'] === 'string')
            .map((document) => ({
              label: `${text(document['filename']) || text(document['document_template_identifier']) || 'Untitled'} (${text(document['status'])}, ${text(document['id']).slice(0, 8)})`,
              value: text(document['id']),
            })),
        };
      },
    }),
});

export const documentIdText = Property.ShortText({
  displayName: 'Document ID',
  description: 'The document ID (a UUID), e.g. from Generate Document or List Documents.',
  required: true,
});

export const templateIdText = Property.ShortText({
  displayName: 'Template ID',
  description: 'The template ID (a UUID). Use List Templates to find it.',
  required: true,
});

export const payloadProp = Property.Json({
  displayName: 'Payload',
  description: 'The data merged into the template, as a JSON object, e.g. {"clientName": "Jane Doe", "total": 120}.',
  required: true,
});

export const metaProp = Property.Json({
  displayName: 'Meta',
  description: 'Optional metadata to keep with the document, as a JSON object. It is returned with the document and in triggers.',
  required: false,
});

export const fileNameProp = Property.ShortText({
  displayName: 'Custom File Name',
  description: 'Name of the generated file, e.g. "Invoice 2026-001.pdf". Stored as the _filename meta key.',
  required: false,
});
