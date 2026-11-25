import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropUpdateUserOutputSchema } from '../../../output-schemas';

export const raindropUpdateUserAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_update_user',
  outputSchema: raindropUpdateUserOutputSchema,
  displayName: 'Update User',
  description: "Updates the connected account's name, email, settings or collection groups.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Changes the connected account's full name, email, settings (config) or sidebar collection groups; only the inputs you set are sent. Groups replaces the whole list, so read the current groups with Get Current User first and send the full edited list; there is no revision check, so a concurrent edit can be overwritten. Password changes are not supported.",
    idempotent: true,
  },
  props: {
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'New display name.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New account email address.',
      required: false,
    }),
    config: Property.Json({
      displayName: 'Settings',
      description:
        'Settings keys to change, e.g. {"raindrops_sort": "-created", "raindrops_view": "grid", "lang": "en_US"}. Keys as returned in "config" by Get Current User.',
      required: false,
    }),
    groups: Property.Json({
      displayName: 'Collection Groups',
      description:
        'Full list of sidebar groups, replacing the current one, e.g. [{"title": "My Collections", "hidden": false, "sort": 0, "collections": [8364483, 8364403]}]. Collection IDs from List Collections.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { fullName, email, config, groups } = propsValue;
    if (groups !== undefined && !Array.isArray(groups)) {
      throw new Error('groups must be a JSON array of group objects.');
    }
    return await raindropClient.request<RaindropUpdateUserResponse>({
      auth,
      method: HttpMethod.PUT,
      path: '/user',
      body: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(config !== undefined ? { config } : {}),
        ...(groups !== undefined ? { groups } : {}),
      },
    });
  },
});

type RaindropUpdateUserResponse = {
  result: boolean;
  user: Record<string, unknown>;
};
