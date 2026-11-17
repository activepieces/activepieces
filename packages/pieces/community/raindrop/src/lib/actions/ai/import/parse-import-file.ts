import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropParseImportFileOutputSchema } from '../../../output-schemas';

export const raindropParseImportFileAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_parse_import_file',
  outputSchema: raindropParseImportFileOutputSchema,
  displayName: 'Parse Import File',
  description: 'Converts an HTML bookmarks export file into JSON folders and bookmarks.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Converts an HTML bookmarks file (Netscape browser export, Pocket or Instapaper format) into a JSON tree of folders and bookmarks. Nothing is saved: create the bookmarks afterwards with Create Bookmark.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'Bookmarks File',
      description: 'HTML bookmarks file in Netscape, Pocket or Instapaper export format.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append('import', new Blob([propsValue.file.data]), propsValue.file.filename);
    return await raindropClient.request<RaindropParseImportFileResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/import/file',
      body: form,
    });
  },
});

type RaindropParseImportFileResponse = {
  result: boolean;
  items: Record<string, unknown>[];
};
