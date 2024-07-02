import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CAPTAIN_DATA_BASE_URL, CaptainDataAuthType } from '..';

export const workflowProp = Property.Dropdown({
  displayName: 'Workflow',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
      };
    }
    const response = await httpClient.sendRequest({
      url: `${CAPTAIN_DATA_BASE_URL}/workflows`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `x-api-key ${(auth as CaptainDataAuthType).apiKey}`,
        'x-project-id': (auth as CaptainDataAuthType).projectId,
      },
    });
    return {
      disabled: false,
      options: response.body.map((workflow: { uid: string; name: string }) => {
        return { label: workflow.name, value: workflow.uid };
      }),
    };
  },
});
