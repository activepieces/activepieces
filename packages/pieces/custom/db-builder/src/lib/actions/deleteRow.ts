import { createAction, Property } from '@activepieces/pieces-framework';
import dotenv from 'dotenv';
dotenv.config();

export const deleteRow = createAction({
  name: 'delete_row',
  displayName: 'Delete Row',
  description: 'Delete a row from the selected table',
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
      displayName: 'Row ID to Delete',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const orgId = (auth as { orgId: string })['orgId'];
    const baseUrl = `${process.env['AP_NODE_SERVICE_URL']}/node-service/api`;
    const { tableName, id } = propsValue;

    const res = await fetch(`${baseUrl}/dbBuilder/${orgId}/deleteRow/${tableName}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`(${res.status}) ${text}`);
    }

    const responseData = await res.json();
    return { success: true, data: responseData };
  },
});
