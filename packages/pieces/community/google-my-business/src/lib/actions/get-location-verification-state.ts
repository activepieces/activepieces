import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { getLocationVerificationStateActionOutputSchema } from '../output-schemas';

export const getLocationVerificationState = createAction({
  name: 'get-location-verification-state',
  outputSchema: getLocationVerificationStateActionOutputSchema,
  classification: 'READ',
  displayName: 'Get Location Verification State',
  description: 'Gets whether a location is verified and can publish changes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the Voice of Merchant state of a Google Business Profile location: whether the owner has control (hasVoiceOfMerchant), whether a verification is pending, and what to do otherwise. Use to explain why edits, posts or metrics fail on an unverified location. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    location_id: gmbApi.props.locationId(),
  },
  async run(ctx) {
    const location = gmbApi.resourceNames.v1Location(ctx.propsValue.location_id);
    return gmbApi.request<Record<string, unknown>>({
      accessToken: ctx.auth.access_token,
      method: HttpMethod.GET,
      url: `${gmbApi.hosts.verifications}/${location}/VoiceOfMerchantState`,
    });
  },
});
