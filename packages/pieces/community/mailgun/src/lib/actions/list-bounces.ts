import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../..';
import { mailgunCommon, mailgunApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const listBounces = createAction({
  auth: mailgunAuth,
  name: 'list_bounces',
  displayName: 'List Bounces',
  description:
    'Retrieve the list of bounced email addresses for a Mailgun domain. Useful for cleanup after delivery issues or spam attacks.',
  props: {
    domain: mailgunCommon.domainDropdown,
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of bounces to return (1-1000). Default is 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { domain, limit } = context.propsValue;
    const auth = context.auth;

    const response = await mailgunApiCall<{
      items: {
        address: string;
        code: string;
        error: string;
        created_at: string;
      }[];
      paging: { next: string };
    }>({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      method: HttpMethod.GET,
      path: `/v3/${domain}/bounces`,
      queryParams: {
        limit: String(Math.min(Math.max(limit ?? 100, 1), 1000)),
      },
    });

    const bounces = response.body.items.map((item) => ({
      address: item.address,
      code: item.code,
      error: item.error,
      created_at: item.created_at,
    }));

    return {
      total_count: bounces.length,
      bounces,
    };
  },
});
