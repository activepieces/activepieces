import { createAction, Property } from '@activepieces/pieces-framework';
import dotenv from 'dotenv';
dotenv.config();

export const list = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'list',
  displayName: 'List Rows',
  description: 'Get list of rows from a selected table',
  props: {
    tableName: Property.Dropdown({
      displayName: 'Table Name',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth || typeof auth !== 'object' || !('orgId' in auth)) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Invalid Org ID',
          };
        }

        const orgId = auth.orgId;
        const baseUrl = `${process.env['AP_NODE_SERVICE_URL']}/node-service/api`;

        try {
          const res = await fetch(`${baseUrl}/dbBuilder/${orgId}/tableList`);
          if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
          const data = await res.json();
          const options = data.map((item: any) => ({
            label: item.name,
            value: item.name,
          }));
          return { options };
        } catch (err) {
          return {
            options: [],
            disabled: true,
            placeholder: `Error fetching tables: ${err}`,
          };
        }
      },
    }),
    returnAll: Property.Checkbox({
      displayName: 'Return All',
      required: true,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Row Limit (number only)',
      required: false,
      defaultValue: 50,
    }),
  },

  async run({ auth, propsValue }) {
    const orgId = (auth as { orgId: string }).orgId;
    const baseUrl = `${process.env['AP_NODE_SERVICE_URL']}/node-service/api`;
    const { tableName, returnAll, limit } = propsValue;

    try {
      let url = `${baseUrl}/dbBuilder/${orgId}/list/${tableName}`;
      if (!returnAll && limit) {
        url += `?limit=${limit}`;
      }

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`(${res.status}) ${errorText}`);
      }

      const data = await res.json();
      return { rows: data };
    } catch (err: any) {
      return {
        error: `Failed to fetch rows: ${err.message || err}`,
      };
    }
  },
});
