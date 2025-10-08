import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { HedyApiClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { Highlight } from '../../common/types';

export const getHighlight = createAction({
  auth: hedyAuth,
  name: 'get-highlight',
  displayName: 'Get Highlight',
  description: 'Retrieve a specific highlight by ID.',
  props: {
    highlightId: commonProps.highlightId,
  },
  async run(context) {
    const highlightId = context.propsValue.highlightId as string;
    const client = new HedyApiClient(context.auth as string);
    const response = await client.request<Highlight>({
      method: HttpMethod.GET,
      path: `/highlights/${highlightId}`,
    });

    return unwrapResource(response);
  },
});
