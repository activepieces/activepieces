import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { apitemplateAuth } from '../../index';

export const apitemplateListObjectsAction = createAction({
  auth: apitemplateAuth,
  name: 'list_objects',
  displayName: 'List Objects',
  description: 'List previously generated images or PDFs',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Retrieve only the number of records specified. Default to 300',
      required: false,
      defaultValue: 300,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Offset is used to skip the number of records from the results. Default to 0',
      required: false,
      defaultValue: 0,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Filtered by template id',
      required: false,
    }),
    transaction_type: Property.StaticDropdown({
      displayName: 'Transaction Type',
      description: 'Filtered by transaction type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'PDF', value: 'PDF' },
          { label: 'JPEG', value: 'JPEG' },
          { label: 'MERGE', value: 'MERGE' },
        ],
      },
    }),
    transaction_ref: Property.ShortText({
      displayName: 'Transaction Reference',
      description: 'Transaction reference to filter by',
      required: false,
    }),
  },
  async run(context) {
    const { auth } = context;
    const {
      limit,
      offset,
      template_id,
      transaction_type,
      transaction_ref,
    } = context.propsValue;

    const queryParams: Record<string, string | number> = {};

    // Add optional query parameters
    if (limit !== undefined) queryParams['limit'] = limit;
    if (offset !== undefined) queryParams['offset'] = offset;
    if (template_id) queryParams['template_id'] = template_id;
    if (transaction_type) queryParams['transaction_type'] = transaction_type;
    if (transaction_ref) queryParams['transaction_ref'] = transaction_ref;

    const response = await httpClient.sendRequest<{
      status: string;
      objects: Array<any>;
    }>({
      method: HttpMethod.GET,
      url: 'https://rest.apitemplate.io/v2/list-objects',
      headers: {
        'X-API-KEY': auth as string,
        'Content-Type': 'application/json',
      },
      queryParams: queryParams as Record<string, string>,
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to list objects: ${response.status}`);
  },
}); 