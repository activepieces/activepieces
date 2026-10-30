import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const getPerson = createAction({
  auth: posthogAuth,
  name: 'get_person',
  classification: 'READ',
  displayName: 'Get Person',
  description: 'Look up one person by their exact distinct ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Looks up the PostHog person who owns an exact distinct_id (the user ID or email your app sends with events) and returns id (person UUID), name, email, all distinctIds and all person properties. found=false (not an error) when no person has that distinct ID. To search by partial email or name, use List Persons. Read-only.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.person,
  props: {
    distinctId: Property.ShortText({ displayName: 'Distinct ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const distinctId = posthogClient.requiredText({ value: propsValue.distinctId, label: 'Distinct ID' });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['persons'] }),
      query: { distinct_id: distinctId },
    });
    const match = posthogClient
      .arrayOf(posthogClient.recordOf(body)['results'])
      .find((p) => posthogClient.arrayOf(posthogClient.recordOf(p)['distinct_ids']).includes(distinctId));
    if (match === undefined) {
      return { found: false, id: null, name: null, email: null, distinctIds: [], properties: {}, createdAt: null };
    }
    return { found: true, ...posthogMappers.person(match) };
  },
});
