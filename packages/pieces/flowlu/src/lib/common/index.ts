import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../..';
import { FlowluClient } from './client';

export function makeClient(
  auth: PiecePropValueSchema<typeof flowluAuth>
): FlowluClient {
  const client = new FlowluClient(auth.domain, auth.apiKey);
  return client;
}

export const flowluCommon = {
  task_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Task ID',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth as PiecePropValueSchema<typeof flowluAuth>
        );
        const res = await client.listAllTasks();
        return {
          disabled: false,
          options: res.response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
};
