import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { whatConvertsAuth } from '../common/auth';

const WHATCONVERTS_API_URL = 'https://app.whatconverts.com/api/v1';

export const updateLeadAction = createAction({
  auth: whatConvertsAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: "Update an existing lead's attributes by its ID.",
  props: {
    lead_id: Property.Number({
      displayName: 'Lead ID',
      description: 'The unique identifier of the lead to update.',
      required: true,
    }),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'The type of the lead.',
      required: false,
      options: {
        options: [
          { label: 'Phone Call', value: 'Phone Call' },
          { label: 'Web Form', value: 'Web Form' },
          { label: 'Chat', value: 'Chat' },
          { label: 'Transaction', value: 'Transaction' },
          { label: 'Event', value: 'Event' },
        ],
      },
    }),
    quotable: Property.StaticDropdown({
      displayName: 'Quotable',
      description: 'Mark the lead as quotable.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' },
        ],
      },
    }),
    sales_value: Property.ShortText({
      displayName: 'Sales Value',
      description: 'The monetary value of the lead (e.g., "150.00").',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    referring_source: Property.ShortText({
      displayName: 'Referring Source',
      required: false,
    }),
    referring_medium: Property.ShortText({
      displayName: 'Referring Medium',
      required: false,
    }),
    referring_campaign: Property.ShortText({
      displayName: 'Referring Campaign',
      required: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const body: { [key: string]: unknown } = {};
    const leadDetails: { [key: string]: string | undefined } = {};

    const addIfExists = (
      obj: { [key: string]: unknown },
      key: string,
      value: unknown
    ) => {
      if (value !== undefined && value !== null && value !== '') {
        obj[key] = value;
      }
    };

    addIfExists(body, 'lead_type', propsValue.lead_type);
    addIfExists(body, 'quotable', propsValue.quotable);
    addIfExists(body, 'sales_value', propsValue.sales_value);
    addIfExists(body, 'referring_source', propsValue.referring_source);
    addIfExists(body, 'referring_medium', propsValue.referring_medium);
    addIfExists(body, 'referring_campaign', propsValue.referring_campaign);

    addIfExists(leadDetails, 'first_name', propsValue.first_name);
    addIfExists(leadDetails, 'last_name', propsValue.last_name);
    addIfExists(leadDetails, 'email', propsValue.email);
    addIfExists(leadDetails, 'phone_number', propsValue.phone_number);
    addIfExists(leadDetails, 'notes', propsValue.notes);

    if (Object.keys(leadDetails).length > 0) {
      body['lead_details'] = leadDetails;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${WHATCONVERTS_API_URL}/leads/${propsValue.lead_id}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret as string,
      },
      body: body,
    });

    return response.body;
  },
});
