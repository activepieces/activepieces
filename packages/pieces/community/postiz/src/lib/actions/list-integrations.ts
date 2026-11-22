import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall } from '../common';

export const listIntegrations = createAction({
  auth: postizAuth,
  name: 'list_integrations',
  classification: 'SEARCH',
  displayName: 'List Channels',
  description: 'List all connected social media channels in your organization',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every social media channel connected to the organization, returning each channel id, name, and provider. Use to discover which channels are available and to resolve the integration id required by the create actions, Get Channel Settings, Find Available Slot, and Get Platform Analytics. Idempotent — a read-only lookup.',
    idempotent: true,
  },
  outputSchema: {
    itemLabel: '{name} ({provider})',
    fields: [
      {
        key: 'channels',
        label: 'Channels',
        value: '',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Channel ID' },
          { key: 'name', label: 'Name' },
          { key: 'provider', label: 'Provider' },
          { key: 'picture', label: 'Picture', format: 'image' },
          { key: 'disabled', label: 'Disabled', format: 'boolean' },
          { key: 'profile', label: 'Profile' },
          { key: 'customer_id', label: 'Customer ID' },
          { key: 'customer_name', label: 'Customer Name' },
        ],
      },
    ],
  },
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

    return (Array.isArray(response.body) ? response.body : []).map((integration) => ({
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
