import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxFindSharedItemOutputSchema } from '../../../output-schemas';

export const findSharedItemAction = createAction({
  auth: boxAuth,
  name: 'box_find_shared_item',
  outputSchema: boxFindSharedItemOutputSchema,
  displayName: 'Find Shared Item',
  description: 'Gets the file, folder or web link a Box shared link points to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Resolves a Box shared link URL to the file, folder or web link it points to, returning its type and ID even if it was not shared with the user directly. Give Password for password-protected links.',
    idempotent: true,
  },
  props: {
    sharedLink: Property.ShortText({
      displayName: 'Shared Link',
      description: 'The shared link URL, e.g. "https://app.box.com/s/abc123".',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'The shared link\'s password, if it has one.',
      required: false,
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const passwordPart = propsValue.password ? `&shared_link_password=${propsValue.password}` : '';
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/shared_items',
      query: { fields: propsValue.fields },
      headers: { boxapi: `shared_link=${propsValue.sharedLink}${passwordPart}` },
    });
  },
});
