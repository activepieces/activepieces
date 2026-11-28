import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateWebLinkOutputSchema } from '../../../output-schemas';

export const createWebLinkAction = createAction({
  auth: boxAuth,
  name: 'box_create_web_link',
  outputSchema: boxCreateWebLinkOutputSchema,
  displayName: 'Create Web Link',
  description: 'Creates a web link (bookmark) in a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Saves a URL as a web link item inside a folder and returns it with its new ID.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({ displayName: 'URL', description: 'The link, starting with http:// or https://.', required: true }),
    parentFolderId: boxAiProps.folderId({
      required: true,
      displayName: 'Parent Folder ID',
      description: 'ID of the folder to put the link in. "0" is the root.',
    }),
    name: Property.ShortText({ displayName: 'Name', description: 'Name shown in Box. Defaults to the URL.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'Description of the link.', required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/web_links',
      body: {
        url: propsValue.url,
        parent: { id: propsValue.parentFolderId },
        ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
        ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      },
    });
  },
});
