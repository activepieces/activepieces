import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../common/auth';
import { klaviyoApi, pathFor, resourceOf } from '../../common/client';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const getProfileAi = createAction({
  auth: klaviyoAuth,
  name: 'get_profile_ai',
  classification: 'READ',
  displayName: 'Get Profile',
  description: 'Get one Klaviyo profile by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Klaviyo profile by profile ID: identity, location, custom properties and, on request, marketing consent and the IDs of the lists and segments it belongs to. Find the ID with Find Profile by Email/Phone or List Profiles. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiProfile,
  props: {
    profile_id: klaviyoInputs.idProp({
      displayName: 'Profile ID',
      description: 'The Klaviyo profile ID. Get it from Find Profile by Email/Phone or List Profiles.',
      required: true,
    }),
    include_subscriptions: klaviyoInputs.yesNoProp({
      displayName: 'Include Subscriptions',
      description: '"yes" adds the email/SMS marketing consent block. Omit for no.',
    }),
    include_memberships: klaviyoInputs.yesNoProp({
      displayName: 'Include Memberships',
      description: '"yes" adds list_ids and segment_ids (up to 1000 each). Omit for no.',
    }),
  },
  async run({ auth, propsValue }) {
    const profileId = klaviyoInputs.requireText({ value: propsValue.profile_id, label: 'Profile ID' });
    const includeSubscriptions = klaviyoInputs.yesNo({ value: propsValue.include_subscriptions, label: 'Include Subscriptions' });
    const includeMemberships = klaviyoInputs.yesNo({ value: propsValue.include_memberships, label: 'Include Memberships' });
    const path = pathFor(['profiles', profileId]);
    const response = await klaviyoApi.send({
      auth,
      method: HttpMethod.GET,
      path,
      query: { 'additional-fields[profile]': includeSubscriptions ? 'subscriptions' : undefined },
    });
    const profile = resourceOf(response.body);
    if (profile === undefined) {
      throw new Error(`Klaviyo returned no profile for ID ${profileId}.`);
    }
    const output = klaviyoInputs.flatProfile(profile);
    if (includeMemberships) {
      const lists = await klaviyoApi.listAll({ auth, path: `${path}/relationships/lists`, maxItems: 1000, what: 'list memberships' });
      const segments = await klaviyoApi.listAll({ auth, path: `${path}/relationships/segments`, maxItems: 1000, what: 'segment memberships' });
      output['list_ids'] = lists.items.map((item) => item.id);
      output['segment_ids'] = segments.items.map((item) => item.id);
    }
    return output;
  },
});
