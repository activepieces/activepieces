import { createAction, Property } from '@activepieces/pieces-framework';

export const updateRow = createAction({
  name: 'update_row',
  displayName: 'Update Row',
  description: 'Update an existing row in the selected table',
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

    id: Property.ShortText({
      displayName: 'Row ID to update',
      required: true,
    }),

    rowData: Property.DynamicProperties({
      displayName: 'Fields to Update',
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
    const { tableName, id, rowData } = propsValue;

    const res = await fetch(`${baseUrl}/dbBuilder/${orgId}/updateRow/${tableName}/${id}`, {
      method: 'PATCH',
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
