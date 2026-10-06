import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { saveUrlLaunchOutputSchema } from '../output-schemas';

export const dropboxSaveUrl = createAction({
  auth: dropboxAuth,
  name: 'save_url_to_dropbox',
  classification: 'WRITE',
  displayName: 'Save URL to Dropbox',
  description: 'Download a URL into Dropbox',
  audience: 'ai',
  aiMetadata: {
    description:
      'Tells Dropbox to fetch a public URL server-side and save it as a file. Small downloads finish immediately and return the file metadata; larger ones return an async job id that Get Save URL Status polls. Not idempotent: each call starts another download and writes another file.',
    idempotent: false,
  },
  outputSchema: saveUrlLaunchOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Destination Path',
      description:
        'Where to save the file, as a path (/folder/file.pdf). This endpoint does not accept id: or ns: values.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The publicly reachable URL for Dropbox to download.',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/save_url',
      body: {
        path: context.propsValue.path,
        url: context.propsValue.url,
      },
    });
  },
});
