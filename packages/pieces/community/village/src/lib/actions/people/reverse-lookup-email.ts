import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, VILLAGE_ENRICH_MODE_OPTIONS } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const reverseLookupEmail = createAction({
  auth: villageAuth,
  name: 'reverse_lookup_email',
  classification: 'READ',
  displayName: 'Find Person by Email',
  description:
    'Find out who an email address belongs to and get their profile. Costs 1 Village credit when a match is found. Unknown addresses are sent to Village partners (Apollo.io, HarvestAPI) to identify the owner.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reverse email lookup: returns the profile (name, headline, current role, LinkedIn URL) of the person who owns an email address. Costs 1 credit per match; "cached_only" mode never charges and returns not-found (404) on a cache miss. Village may send unknown addresses to third-party providers. Read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.enrichPerson,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to look up.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'cached_first (default) charges only on a live lookup; cached_only never charges; realtime_only always looks up live.',
      required: false,
      options: { options: VILLAGE_ENRICH_MODE_OPTIONS },
    }),
  },
  async run(context) {
    const { email, mode } = context.propsValue;
    const body: Record<string, unknown> = {
      email: villageApi.requireText({ value: email, field: 'Email' }),
    };
    if (mode) {
      body['mode'] = mode;
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/people/enrich/by-email',
      body,
    });
  },
});
