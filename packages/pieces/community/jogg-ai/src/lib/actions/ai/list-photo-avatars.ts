import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiListPhotoAvatars = createAction({
  auth: joggAiAuth,
  name: 'ai_list_photo_avatars',
  displayName: 'List Photo Avatars',
  description: 'Lists your photo avatars with optional filters.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: joggAiOutputSchemas.aiListPhotoAvatars,
  aiMetadata: {
    description:
      'Lists the account photo avatars (avatars made from photos), one page at a time, optionally filtered by name or status. Use it to check which photo avatars exist and whether they finished processing. Read-only.',
    idempotent: true,
  },
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Items per page (1-100). Defaults to 20.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Only avatars whose name matches.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Processing', value: 'processing' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
        ],
      },
    }),
  },
  async run(context) {
    const { page, page_size, name, status } = context.propsValue;
    const data = await joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/avatars/photo_avatars',
      op: 'list photo avatars',
      queryParams: {
        ...joggAiClient.pageParams({ page, pageSize: page_size }),
        ...joggAiClient.compact({ name, status }),
      },
    });
    return { avatars: joggAiClient.listOf({ value: data, key: 'avatars' }) };
  },
});
