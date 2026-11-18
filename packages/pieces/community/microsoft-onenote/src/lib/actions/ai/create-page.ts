import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteCreatePageOutputSchema } from '../../output-schemas';

import type { OnenotePage } from '../../common/types';

export const createPageAiAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_page',
  outputSchema: microsoftOnenoteCreatePageOutputSchema,
  displayName: 'Create Page',
  description: 'Creates a OneNote page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a OneNote page with a title and an HTML body and returns it with its ID. Set Section ID (from List Sections) to choose the section; without it the page goes to the default section of your default notebook. Use Update Page Content to change an existing page.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Page title.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        'Page body as HTML, for example <p>Text</p>, <h1>, <ul><li>, <table>, <img src="https://...">. Only the body: the title and HTML wrapper are added for you.',
      required: false,
    }),
    sectionId: microsoftOneNoteAiProps.sectionId({ required: false }),
  },
  async run({ auth, propsValue }) {
    const parent = propsValue.sectionId
      ? `/sections/${encodeURIComponent(propsValue.sectionId)}`
      : '';
    const html = `<!DOCTYPE html><html><head><title>${escapeHtml({
      text: propsValue.title,
    })}</title></head><body>${propsValue.content ?? ''}</body></html>`;
    const response: OnenotePage = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote${parent}/pages`)
      .header('Content-Type', 'application/xhtml+xml')
      .post(html);
    return response;
  },
});

function escapeHtml({ text }: { text: string }): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
