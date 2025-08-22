import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

export const mailChimpFindTag = createAction({
  auth: mailchimpAuth,
  name: 'find-tag',
  displayName: 'Find Tag',
  description: 'Finds a tag/segment in an audience by name.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    name: Property.ShortText({
      displayName: 'Tag (Segment) Name',
      required: true,
    }),
  },
  async run(ctx) {
    const token = getAccessTokenOrThrow(ctx.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${server}.api.mailchimp.com/3.0/lists/${ctx.propsValue.list_id}/segments?count=1000`,
      headers: { Authorization: `OAuth ${token}` },
    });

    const segments = (resp.body as any)?.segments ?? [];
    const needle = ctx.propsValue.name!.trim().toLowerCase();

    const found = segments.find(
      (s: any) => (s?.name ?? '').toLowerCase() === needle
    );
    return found ?? null;
  },
});
