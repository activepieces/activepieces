import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformListLabelsOutputSchema } from '../../output-schemas';

export const listLabels = createAction({
  auth: jotformAuth,
  name: 'jotform_list_labels',
  outputSchema: jotformListLabelsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Labels',
  description: 'List labels on the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the labels on the connected account, each with its ID, name, color and parent label. Idempotent — a repeated call returns the same list.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: '/user/labels',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
