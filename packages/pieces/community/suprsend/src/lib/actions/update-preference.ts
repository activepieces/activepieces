import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { suprsendAuth } from '../auth';
import { suprsendApiCall } from '../common/client';

export const updatePreference = createAction({
  auth: suprsendAuth,
  name: 'update_category_preference',
  classification: 'WRITE',
  displayName: 'Update User Preference',
  description: 'Opt a user in or out of a notification category.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets one user\'s preference for a SuprSend notification category to opt-in or opt-out, optionally for a single tenant. Use this when a user subscribes to or unsubscribes from a type of notification. Safe to retry; it always sets the same state.',
    idempotent: true,
  },
  props: {
    distinctId: Property.ShortText({
      displayName: 'User Distinct ID',
      description: 'The unique ID of the user in your system.',
      required: true,
    }),
    category: Property.ShortText({
      displayName: 'Category Slug',
      description:
        'In the SuprSend dashboard, open **Notification Categories** and copy the category slug (for example `product-updates`).',
      required: true,
    }),
    preference: Property.StaticDropdown({
      displayName: 'Preference',
      required: true,
      defaultValue: 'opt_in',
      options: {
        options: [
          { label: 'Opt In', value: 'opt_in' },
          { label: 'Opt Out', value: 'opt_out' },
        ],
      },
    }),
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description: 'Set the preference for this tenant only.',
      required: false,
    }),
  },
  async run(context) {
    const { distinctId, category, preference, tenantId } = context.propsValue;

    return suprsendApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/v1/user/${encodeURIComponent(distinctId)}/preference/category/${encodeURIComponent(category)}/`,
      body: { preference },
      query: tenantId ? { tenant_id: tenantId } : undefined,
    });
  },
});
