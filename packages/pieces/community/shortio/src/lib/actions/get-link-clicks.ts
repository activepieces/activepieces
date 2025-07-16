import { createAction, Property } from '@activepieces/pieces-framework';
import { shortioAuth, shortioCommon, shortioApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getLinkClicks = createAction({
  auth: shortioAuth,
  name: 'get_link_clicks',
  displayName: 'Get Link Clicks',
  description: 'Retrieve click analytics for a specific link within a time window.',
  props: {
    domain_id: shortioCommon.domain_id,
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Returns statistics for clicks after given date (required if period is custom)',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Returns statistics for clicks before given date (required if period is custom)',
      required: false,
    }),
    linkPaths: Property.Array({
      displayName: 'Link Paths',
      description: 'The full URLs of the short links to get clicks for (e.g., "https://short.io/mylink" or "https://short.io/custom/path")',
      required: true,
      properties: {
        path: Property.ShortText({
          displayName: 'Full URL',
          description: 'The full URL of the short link',
          required: true
        }),
        createdAt: Property.DateTime({
          displayName: 'Created At',
          description: 'The creation date of this link',
          required: true
        })
      }
    }),
  },
  async run({ auth, propsValue }) {
    const props = propsValue as any;
    
    const queryParams: Record<string, any> = {};

    const { startDate, endDate } = props;

    Object.assign(queryParams, {
      ...(startDate && { 
        startDate: new Date(startDate).toISOString().split('T')[0] 
      }),
      ...(endDate && {
        endDate: new Date(endDate).toISOString().split('T')[0]
      })
    });

    const pathsDatesBody = props['linkPaths'].map((path: any) => ({
      path: path.path,
      createdAt: path.createdAt,
    }));

    const response = await shortioApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      resourceUri: `/statistics/domain/${props['domain_id']}/link_clicks`,
      query: queryParams,
      body: {
        pathsDates: pathsDatesBody,
      },
      hostName: "https://statistics.short.io",
    });

    return response;
  },
});
