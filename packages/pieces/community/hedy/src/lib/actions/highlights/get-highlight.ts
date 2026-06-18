import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { Highlight } from '../../common/types';
import { assertIdPrefix } from '../../common/validation';

export const getHighlight = createAction({
  auth: hedyAuth,
  name: 'get-highlight',
  displayName: 'Get Highlight',
  description: 'Retrieve a specific highlight by ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetch a single Hedy highlight by its ID (must be prefixed with "high_"). Use when you already have a highlight ID and need its content. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    highlightId: commonProps.highlightId,
  },
  async run(context) {
    const highlightId = assertIdPrefix(context.propsValue.highlightId as string, 'high_', 'Highlight ID');
    const client = createClient(context.auth);
    const response = await client.request<Highlight>({
      method: HttpMethod.GET,
      path: `/highlights/${highlightId}`,
    });

    return unwrapResource(response);
  },
});
