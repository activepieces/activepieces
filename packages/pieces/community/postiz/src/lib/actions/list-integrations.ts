import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, PostizAuth } from '../common';

export const listIntegrations = createAction({
  auth: postizAuth,
  name: 'list_integrations',
  displayName: 'List Channels',
  description: 'List all connected social media channels in your organization',
  props: {},
  async run(context) {
    const auth = context.auth;

    const response = await postizApiCall<
      {
        id: string;
        name: string;
        identifier: string;
        picture: string;
        disabled: boolean;
        profile: string;
        customer: { id: string; name: string } | null;
      }[]
    >({
      auth,
      method: HttpMethod.GET,
      path: '/integrations',
    });

    return response.body.map((integration) => ({
      id: integration.id,
      name: integration.name,
      provider: integration.identifier,
      picture: integration.picture ?? null,
      disabled: integration.disabled,
      profile: integration.profile ?? null,
      customer_id: integration.customer?.id ?? null,
      customer_name: integration.customer?.name ?? null,
    }));
  },
});
