import { createAction, Property } from '@activepieces/pieces-framework';
import { tablesCommon, tablesUtils } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { FieldType } from '@activepieces/shared';

export const createColumn = createAction({
  name: 'tables-create-column',
  displayName: 'Create Column',
  description: 'Create a new column to a table.',
  props: {
    table_id: tablesCommon.table_id,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the column.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Data Type',
      description: 'The type of the column.',
      required: true,
      options: {
        disabled: false,
        options: Object.values(FieldType).map((type) => ({
          label: tablesUtils.getFieldTypeText(type),
          value: type,
        })),
      },
    }),
  },
  async run(context) {
    const tableId = await tablesCommon.convertTableExternalIdToId(context.propsValue['table_id'], context);
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/fields`,
      body: {
        name: context.propsValue['name'],
        type: context.propsValue['type'],
        tableId,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });    
    return response.body;
  },
});
