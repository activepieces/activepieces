import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetWebLinkOutputSchema } from '../../../output-schemas';

const CLEARABLE = ['description'];

export const updateWebLinkAction = createAction({
  auth: boxAuth,
  name: 'box_update_web_link',
  outputSchema: boxGetWebLinkOutputSchema,
  displayName: 'Update Web Link',
  description: 'Changes the URL, name, description or folder of a Box web link.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a web link\'s URL, name, description or parent folder (a move); only the fields given change. Use Set Web Link Shared Link for its shared link. Get the ID from List Folder Items, Search or Create Web Link.',
    idempotent: true,
  },
  props: {
    webLinkId: boxAiProps.webLinkId({ required: true }),
    url: Property.ShortText({ displayName: 'URL', description: 'New link, starting with http:// or https://.', required: false }),
    name: Property.ShortText({ displayName: 'Name', description: 'New name shown in Box.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New description.', required: false }),
    parentFolderId: boxAiProps.folderId({
      required: false,
      displayName: 'Parent Folder ID',
      description: 'ID of the folder to move the web link into.',
    }),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty: "description". Do not also give a value for a field you clear.',
      required: false,
      options: { options: CLEARABLE.map((field) => ({ label: field, value: field })) },
    }),
  },
  async run({ auth, propsValue }) {
    const clear = propsValue.clearFields ?? [];
    if (clear.includes('description') && propsValue.description !== undefined) {
      throw new Error('Give either Description or "description" in Clear Fields, not both.');
    }
    const body = {
      ...(propsValue.url !== undefined ? { url: propsValue.url } : {}),
      ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      ...(clear.includes('description') ? { description: '' } : {}),
      ...(propsValue.parentFolderId !== undefined ? { parent: { id: propsValue.parentFolderId } } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/web_links/${encodeURIComponent(propsValue.webLinkId)}`,
      body,
    });
  },
});
