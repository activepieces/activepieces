import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { autocallsAuth, baseApiUrl } from '../..';

export const deleteLead = createAction({
  auth:autocallsAuth,
  name: 'deleteLead',
  displayName: 'Delete Lead',
  description: "Delete a lead from a campaign.",
  props: {
    lead: Property.Dropdown({
      displayName: 'Lead',
      description: 'Select a lead to delete',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const res = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: baseApiUrl + 'api/user/leads',
          headers: {
            Authorization: "Bearer " + auth,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        if (res.status !== 200) {
          return {
            disabled: true,
            placeholder: 'Error fetching leads',
            options: [],
          };
        } else if (res.body.length === 0) {
          return {
            disabled: true,
            placeholder: 'No leads found.',
            options: [],
          };
        }

        return {
          options: res.body.map((lead: any) => ({
            value: lead.id,
            label: `${lead.phone_number} - ${lead.campaign.name}`,
          })),
        };
      }
    })
  },
  async run(context) {
    const leadId = context.propsValue['lead'];
    
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.DELETE,
      url: baseApiUrl + 'api/user/leads/' + leadId,
      headers: {
        Authorization: "Bearer " + context.auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });
    return res.body;
  },
});