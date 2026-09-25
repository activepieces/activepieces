import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { getMediaActionOutputSchema } from '../output-schemas';

export const getMedia = createAction({
  name: 'get-media',
  outputSchema: getMediaActionOutputSchema,
  classification: 'READ',
  displayName: 'Get Media',
  description: 'Gets one photo or video of a location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one photo or video of a Google Business Profile location with its format, Google URL, thumbnail, category and view count. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    account_id: gmbApi.props.accountId(),
    location_id: gmbApi.props.locationId(),
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description: 'The media key: the last segment of the name field returned by List Media (list-media).',
      required: true,
    }),
  },
  async run(ctx) {
    const { account_id, location_id, media_id } = ctx.propsValue;
    const parent = gmbApi.resourceNames.v4Location({ account: account_id, location: location_id });
    const media = gmbApi.resourceNames.childId({ value: media_id, marker: 'media' });
    return gmbApi.request<Record<string, unknown>>({
      accessToken: ctx.auth.access_token,
      method: HttpMethod.GET,
      url: `${gmbApi.hosts.v4}/${parent}/media/${encodeURIComponent(media)}`,
    });
  },
});
