import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { getLocationActionOutputSchema } from '../output-schemas';

export const getLocation = createAction({
  name: 'get-location',
  outputSchema: getLocationActionOutputSchema,
  classification: 'READ',
  displayName: 'Get Location',
  description: 'Gets the details of a business location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Google Business Profile location: title, store code, address, phone numbers, website, regular and special hours, categories, labels, description and metadata (placeId, Maps URL). Use to read the current listing before editing it. Read-only and safe to repeat.',
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
      url: `${gmbApi.hosts.businessInformation}/${location}`,
      query: new URLSearchParams({ readMask: gmbApi.locationReadMask }),
    });
  },
});
