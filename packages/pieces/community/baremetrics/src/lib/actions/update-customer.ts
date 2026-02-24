import { 
  createAction, 
  Property,
} from '@activepieces/pieces-framework';
import { baremetricsApiCall, BaremetricsAuth } from '../common/client';
import { baremetricsAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCustomer = createAction({
  name: 'update_customer',
  displayName: 'Update Customer',
  description: 'Updates the basic information stored on a customer',
  auth: baremetricsAuth,
  props: {
    source_id: Property.Dropdown({
      auth: baremetricsAuth,
      displayName: 'Source',
      description: 'Select the data source (Payment Provider or API)',
      required: true,
      refreshers: [],
      options: async (propsValue) => {
        if (!propsValue['auth']) {
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
            auth: propsValue['auth'] as BaremetricsAuth,
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
    customer_oid: Property.Dropdown({
      displayName: 'Customer',
      auth: baremetricsAuth,
      description: 'Select the customer to update',
      required: true,
      refreshers: ['source_id'],
      options: async (propsValue) => {
        const auth = propsValue['auth'];
        const sourceId = propsValue['source_id'] as string | undefined;
        
        if (!auth || !sourceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a source first',
          };
        }

        try {
          const response = await baremetricsApiCall<{ customers: Array<{ oid: string; name?: string; email?: string }> }>({
            method: HttpMethod.GET,
            path: `/${sourceId}/customers`,
            auth: auth as BaremetricsAuth,
          });
          
          return {
            disabled: false,
            options: response.customers.map(customer => ({
              label: customer.name || customer.email || customer.oid,
              value: customer.oid,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load customers',
          };
        }
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Customer name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address for this customer',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Your own notes for this customer',
      required: false,
    }),
    created: Property.DateTime({
      displayName: 'Created Date',
      description: 'Unix timestamp of when this customer was created',
      required: false,
    }),
  },
  async run(context) {
    const { source_id, customer_oid, name, email, notes, created } = context.propsValue;

    const body: Record<string, any> = {};
    
    if (name) body['name'] = name;
    if (email) body['email'] = email;
    if (notes) body['notes'] = notes;
    if (created) body['created'] = created;

    const response = await baremetricsApiCall({
      method: HttpMethod.PUT,
      path: `/${source_id}/customers/${customer_oid}`,
      auth: context.auth as BaremetricsAuth,
      body,
    });

    return response;
  },
});
