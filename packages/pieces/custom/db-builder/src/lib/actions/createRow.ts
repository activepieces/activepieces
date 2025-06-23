import { createAction, Property } from '@activepieces/pieces-framework';
import dotenv from 'dotenv';
dotenv.config();

export const createRow = createAction({
  name: 'create_row',
  displayName: 'Create Row',
  description: 'Insert a new row into the selected table',
  props: {
    tableName: Property.Dropdown({
      displayName: 'Table Name',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const orgId = (auth as { orgId: string })['orgId'];
        const baseUrl = `${process.env['AP_NODE_SERVICE_URL']}/node-service/api`;
        const res = await fetch(`${baseUrl}/dbBuilder/${orgId}/tableList`);
        const data = await res.json();
        return {
          options: data.map((item: any) => ({
            label: item.name,
            value: item.name,
          })),
        };
      },
    }),

    rowData: Property.DynamicProperties({
      displayName: 'Fields',
      required: true,
      refreshers: ['tableName'],
      props: async ({ auth, tableName }) => {
        if (!auth || !tableName) return {};
        const orgId = (auth as { orgId: string })['orgId'];
        const baseUrl = `${process.env['AP_NODE_SERVICE_URL']}/node-service/api`;
        const res = await fetch(`${baseUrl}/dbBuilder/${orgId}/tableList`);
        const data = await res.json();
        const table = data.find((t: any) => t.name === tableName);
        if (!table || !table.schema) return {};

        const fields: Record<string, any> = {};
        for (const colName of Object.keys(table.schema)) {
          fields[colName] = Property.ShortText({
            displayName: colName,
            required: false,
          });
        }
        return fields;
      },
    }),
  },

  async run({ auth, propsValue }) {
    const orgId = (auth as { orgId: string })['orgId'];
    const baseUrl = `${process.env['AP_NODE_SERVICE_URL']}/node-service/api`;
    const { tableName, rowData } = propsValue;

    const res = await fetch(`${baseUrl}/dbBuilder/${orgId}/newRow/${tableName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowData),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`(${res.status}) ${text}`);
    }

    const responseData = await res.json();
    return { success: true, data: responseData };
  },
});
