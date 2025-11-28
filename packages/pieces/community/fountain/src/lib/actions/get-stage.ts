import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders } from '../common/auth';
import { getFunnelsDropdown, getStagesForFunnelDropdown } from '../common/dropdowns';

export const fountainGetStage = createAction({
  name: 'get_stage',
  auth: fountainAuth,
  displayName: 'Get Stage',
  description: 'Retrieves a specific Stage',
  props: {
    funnel_id: Property.Dropdown({
      displayName: 'Opening',
      description: 'The opening that contains the stage',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getFunnelsDropdown(auth as any) };
      },
    }),
    id: Property.Dropdown({
      displayName: 'Stage',
      description: 'The stage to retrieve details for',
      required: true,
      refreshers: ['funnel_id'],
      options: async ({ auth, funnel_id }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        if (!funnel_id) return { disabled: true, options: [], placeholder: 'Select opening first' };
        return { disabled: false, options: await getStagesForFunnelDropdown(auth as any, funnel_id as string) };
      },
    }),
  },
  async run(context) {
    const stageId = context.propsValue.id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.fountain.com/v2/stages/${stageId}`,
      headers: getAuthHeaders(context.auth),
    });

    return response.body;
  },
});
