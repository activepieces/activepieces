import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxGetTagOutputSchema } from '../../../output-schemas';

export const getTagAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_get_tag',
  outputSchema: sendfoxGetTagOutputSchema,
  displayName: 'Get Tag',
  description: 'Get one SendFox contact tag',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one contact tag by ID with its name, color and contact count. Tag IDs come from List Tags.',
    idempotent: true,
  },
  props: {
    tagId: sendfoxAiProps.tagId({ required: true }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contact-tags/${encodeURIComponent(propsValue.tagId)}`,
    });
  },
});
