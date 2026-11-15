import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { duplicateDocActionOutputSchema } from '../../../output-schemas';

export const duplicateDocAction = createAction({
  auth: mondayAuth,
  name: 'monday_duplicate_doc',
  classification: 'WRITE',
  displayName: 'Duplicate Doc',
  description: 'Creates a copy of a monday doc.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create an exact copy of an existing monday.com doc, with its content and optionally its updates, and return the new doc ID. Use to start from an existing doc as a template. Each call creates another copy.',
    idempotent: false,
  },
  outputSchema: duplicateDocActionOutputSchema,
  props: {
    doc_id: mondayAiProps.docId(),
    duplicate_type: Property.StaticDropdown({
      displayName: 'Duplicate Type',
      required: false,
      defaultValue: 'duplicate_doc_with_content',
      options: {
        options: [
          { label: 'Content only', value: 'duplicate_doc_with_content' },
          { label: 'Content and updates', value: 'duplicate_doc_with_content_and_updates' },
        ],
      },
    }),
  },
  async run(context) {
    const { doc_id, duplicate_type } = context.propsValue;
    const data = await makeClient(context.auth).query<{ duplicate_doc: unknown }>({
      query: `mutation ($docId: ID!, $duplicateType: DuplicateType) {
        duplicate_doc(docId: $docId, duplicateType: $duplicateType)
      }`,
      variables: {
        docId: doc_id,
        duplicateType: duplicate_type ?? undefined,
      },
    });

    return {
      source_doc_id: doc_id,
      new_doc_id: extractDocId(data.duplicate_doc),
      result: mondayApi.toJsonString(data.duplicate_doc),
    };
  },
});

function extractDocId(result: unknown): string | null {
  const parsed = typeof result === 'string' ? safeParse(result) : result;
  if (typeof parsed === 'object' && parsed !== null) {
    const record: Record<string, unknown> = { ...parsed };
    const id = record['doc_id'] ?? record['id'];
    return id === undefined || id === null ? null : String(id);
  }
  if (typeof parsed === 'number' || typeof parsed === 'string') {
    return String(parsed);
  }
  return null;
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
