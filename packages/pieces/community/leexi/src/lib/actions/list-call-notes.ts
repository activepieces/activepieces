import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { leexiAuth } from '../common/auth';
import { leexiApi } from '../common/client';
import { LeexiCallNote, LeexiListResponse } from '../common/types';
import { leexiOutputFields } from '../common/constants';

export const listCallNotesAction = createAction({
  name: 'list_call_notes',
  classification: 'READ',
  auth: leexiAuth,
  displayName: 'List Call Notes',
  description: 'List the AI notes written for a Leexi call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the AI-generated notes of one Leexi call (summary and text prompts such as CRM notes), flattened to uuid, prompt title, prompt category, text and locale. Text, original text and locale come from the first locale of each note only; other translations are not returned. Returns one page with pagination; pass page (and items, 1-100) to read further pages. Optionally restrict to one prompt UUID; prompts whose category is not summary or text are rejected by Leexi (422). Get the call UUID from Query Calls. Read-only.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      {
        key: 'notes',
        label: 'Notes',
        labelKey: 'prompt_title',
        listItems: [
          { key: 'uuid', label: 'Note UUID' },
          { key: 'prompt_uuid', label: 'Prompt UUID' },
          { key: 'prompt_title', label: 'Prompt Title' },
          { key: 'prompt_category', label: 'Prompt Category' },
          { key: 'text', label: 'Text' },
          { key: 'original_text', label: 'Original Text' },
          { key: 'locale', label: 'Locale' },
          { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        ],
      },
      {
        key: 'pagination',
        label: 'Pagination',
        children: leexiOutputFields.pagination.map((field) => ({ key: field.key, label: field.label })),
      },
    ],
  },
  props: {
    call_uuid: Property.ShortText({
      displayName: 'Call UUID',
      description: 'UUID of the call. Get it from Query Calls.',
      required: true,
    }),
    prompt_uuid: Property.ShortText({
      displayName: 'Prompt UUID',
      description: 'Only return the note of this prompt.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, from 1. Stop at pagination.pages.',
      required: false,
      defaultValue: 1,
    }),
    items: Property.Number({
      displayName: 'Results per Page',
      description: 'Number of notes per page, 1-100. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const response = await leexiApi.request<LeexiListResponse<LeexiCallNote>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: ['call_notes'],
      query: {
        call_uuid: context.propsValue.call_uuid.trim(),
        prompt_uuid: context.propsValue.prompt_uuid?.trim(),
        page: Math.max(1, Math.floor(context.propsValue.page ?? 1)),
        items: Math.min(100, Math.max(1, Math.floor(context.propsValue.items ?? 100))),
      },
    });
    return {
      notes: (response.data ?? []).map((note) => {
        const translation = note.translations?.[0];
        return {
          uuid: note.uuid,
          prompt_uuid: note.prompt?.uuid ?? null,
          prompt_title: note.prompt?.title ?? null,
          prompt_category: note.prompt?.category ?? null,
          text: translation?.text ?? null,
          original_text: translation?.original_text ?? null,
          locale: translation?.locale ?? null,
          updated_at: note.updated_at,
        };
      }),
      pagination: response.pagination,
    };
  },
});
