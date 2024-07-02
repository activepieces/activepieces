import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import {
  CAPTAIN_DATA_BASE_URL,
  captainDataAuth,
  CaptainDataAuthType,
} from '../..';
import { workflowProp } from '../common';

export const getJobResults = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getJobResults',
  displayName: 'Get job results',
  description: 'Get all results for a specific job',
  auth: captainDataAuth,
  props: {
    workflow: workflowProp,
    job: Property.Dropdown({
      displayName: 'Job',
      required: true,
      refreshers: ['workflow'],
      options: async ({ auth, workflow }) => {
        if (!auth || !workflow) {
          return {
            disabled: true,
            options: [],
          };
        }
        const response = await httpClient.sendRequest({
          url: `${CAPTAIN_DATA_BASE_URL}/workflows/${workflow}/jobs`,
          method: HttpMethod.GET,
          headers: {
            Authorization: `x-api-key ${(auth as CaptainDataAuthType).apiKey}`,
            'x-project-id': (auth as CaptainDataAuthType).projectId,
          },
        });
        return {
          disabled: false,
          options: response.body.map(
            (job: {
              uid: string;
              name: string;
              workflow_name: string;
              status: string;
              start_time: string;
            }) => {
              return {
                value: job.uid,
                label: job.start_time,
              };
            }
          ),
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    // We don't do pagination because Captain Data's API doc does provide details nor even examples :shrug:
    const response = await httpClient.sendRequest({
      url: `${CAPTAIN_DATA_BASE_URL}/jobs/${propsValue.job}/results`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `x-api-key ${(auth as CaptainDataAuthType).apiKey}`,
        'x-project-id': (auth as CaptainDataAuthType).projectId,
      },
    });
    return response.body;
  },
});
