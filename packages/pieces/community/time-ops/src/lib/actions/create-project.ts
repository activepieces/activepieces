import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { timeOpsAuth } from '../..';
import { BASE_URL, timeOpsClient } from '../common';

export const createProject = createAction({
  auth: timeOpsAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a project.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the project.',
      required: true,
    }),
    customerId: Property.Dropdown({
      displayName: 'Customer',
      description: 'The customer this project belongs to.',
      auth: timeOpsAuth,
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account.',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<
          { id: number; name: string }[]
        >({
          method: HttpMethod.GET,
          url: `${BASE_URL}/Customers`,
          headers: {
            'x-api-key': (auth as { secret_text: string }).secret_text,
          },
        });

        return {
          disabled: false,
          options: response.body.map((customer) => ({
            label: customer.name ?? `Customer ${customer.id}`,
            value: customer.id,
          })),
        };
      },
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the project is billable.',
      required: false,
      defaultValue: false,
    }),
    rate: Property.Number({
      displayName: 'Rate',
      description: 'The hourly rate for this project.',
      required: false,
    }),
    finishedAt: Property.DateTime({
      displayName: 'Finished At',
      description: 'The date and time when the project was finished.',
      required: false,
    }),
  },
  async run(context) {
    const { name, customerId, billable, rate, finishedAt } = context.propsValue;

    return await timeOpsClient.makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/Projects',
      {
        name,
        customerId,
        billable: billable ?? false,
        rate: rate ?? null,
        finishedAt: finishedAt ?? null,
      }
    );
  },
});
