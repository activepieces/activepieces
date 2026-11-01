import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropExpandCollectionsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_expand_collections',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Expand Collections',
  description: 'Expands or collapses all collections.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Expands or collapses the sub-collections of every collection at once. To change a single collection use Update Collection with Expanded.',
    idempotent: true,
  },
  props: {
    expanded: raindropAiProps.booleanChoice({
      required: true,
      displayName: 'Expanded',
      description: 'Yes expands all collections, No collapses all.',
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropExpandCollectionsResponse>({
      auth,
      method: HttpMethod.PUT,
      path: '/collections',
      body: {
        expanded: raindropUtils.toBoolean({ value: propsValue.expanded }),
      },
    });
  },
});

type RaindropExpandCollectionsResponse = {
  result: boolean;
};
