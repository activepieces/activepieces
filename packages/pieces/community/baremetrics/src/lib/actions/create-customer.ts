import { 
  createAction, 
  Property,
} from '@activepieces/pieces-framework';
import { baremetricsApiCall, BaremetricsAuth } from '../common/client';
import { baremetricsAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCustomer = createAction({
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer record',
  auth: baremetricsAuth,
  props: {
    source_id: Property.Dropdown({
      auth: baremetricsAuth,
      displayName: 'Source',
      description: 'Select the data source (Payment Provider or API)',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const response = await baremetricsApiCall<{ sources: Array<{ id: string; provider: string; provider_id: string }> }>({
            method: HttpMethod.GET,
            path: '/sources',
            auth: auth as BaremetricsAuth,
          });
          
          return {
            disabled: false,
            options: response.sources.map(source => ({
              label: `${source.provider} (${source.id})`,
              value: source.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load sources',
          };
        }
      },
    }),
    oid: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Your unique ID for this customer',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Customer name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address for profile information lookup',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Your own notes for this customer',
      required: false,
    }),
    created: Property.DateTime({
      displayName: 'Created Date',
      description: 'When this customer was created (defaults to now)',
      required: false,
    }),
  },
  async run(context) {
    const { source_id, oid, name, email, notes, created } = context.propsValue;

    const body: Record<string, string | undefined> = { oid };
    
    if (name) body['name'] = name;
    if (email) body['email'] = email;
    if (notes) body['notes'] = notes;
    if (created) body['created'] = created;

    const response = await baremetricsApiCall({
      method: HttpMethod.POST,
      path: `/${source_id}/customers`,
      auth: context.auth as BaremetricsAuth,
      body,
    });

    return response;
  },
});
