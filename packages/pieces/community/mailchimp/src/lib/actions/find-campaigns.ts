import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

export const mailChimpFindCampaigns = createAction({
  auth: mailchimpAuth,
  name: 'find-campaigns',
  displayName: 'Find Campaigns',
  description: 'Searches for campaigns with optional status and time filters.',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Sent', value: 'sent' },
          { label: 'Save (Draft)', value: 'save' },
          { label: 'Paused', value: 'paused' },
          { label: 'Scheduled', value: 'schedule' },
        ],
      },
      defaultValue: 'any',
    }),
    since_create_time: Property.ShortText({
      displayName: 'Since create time (ISO8601)',
      description: 'e.g., 2025-01-01T00:00:00Z',
      required: false,
    }),
  },
  async run(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const url = new URL(`https://${server}.api.mailchimp.com/3.0/campaigns`);
    const status = (context.propsValue.status as string) || 'any';
    const since = (context.propsValue.since_create_time as string) || '';

    if (status !== 'any') url.searchParams.set('status', status);
    if (since) url.searchParams.set('since_create_time', since);

    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url.toString(),
      headers: { Authorization: `OAuth ${token}` },
    });

    return (resp.body as any)?.campaigns ?? [];
  },
});
