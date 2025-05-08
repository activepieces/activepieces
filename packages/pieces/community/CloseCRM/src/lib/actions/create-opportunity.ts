import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { closeAuth } from "../../";
import { CloseCRMOpportunity } from "../common/types";

export const createOpportunity = createAction({
  auth: closeAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Create a new sales opportunity linked to a lead with comprehensive details',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead this opportunity is associated with',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'A descriptive name for the opportunity',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Notes',
      description: 'Additional details about the opportunity',
      required: false,
    }),
    status_id: Property.Dropdown({
      displayName: 'Status',
      description: 'Select the opportunity status',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await httpClient.sendRequest<{ data: Array<{ id: string, label: string }> }>({
            method: HttpMethod.GET,
            url: `${auth === 'sandbox' ? 'https://api-sandbox.close.com/api/v1' : 'https://api.close.com/api/v1'}/status/opportunity/`,
            headers: {
              'Authorization': `Basic ${Buffer.from(`${auth}:`).toString('base64')}`,
              'Accept': 'application/json',
            },
          });

          return {
            disabled: false,
            options: response.body.data.map(status => ({
              label: status.label,
              value: status.id
            }))
          };
        } catch (error) {
          console.error('Error fetching statuses:', error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not fetch statuses. Check your connection.'
          };
        }
      }
    }),
    confidence: Property.Number({
      displayName: 'Confidence %',
      description: 'The probability of winning this opportunity (0-100)',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'The monetary value of the opportunity in cents (e.g., 10000 = $100)',
      required: false,
    }),
    value_currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency for the opportunity value',
      required: false,
      options: {
        options: [
          { label: 'USD ($)', value: 'USD' },
          { label: 'EUR (€)', value: 'EUR' },
          { label: 'GBP (£)', value: 'GBP' },
          { label: 'Other', value: '' },
        ]
      },
      defaultValue: 'USD'
    }),
    value_period: Property.StaticDropdown({
      displayName: 'Value Period',
      description: 'The period for the opportunity value',
      required: false,
      options: {
        options: [
          { label: 'One-Time', value: 'one_time' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Annual', value: 'annual' },
        ]
      },
      defaultValue: 'one_time'
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact associated with this opportunity',
      required: false,
    }),
    user_id: Property.ShortText({
      displayName: 'Assigned User ID',
      description: 'The ID of the user assigned to this opportunity',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Additional custom fields for the opportunity',
      required: false,
    }),
  },
  async run(context) {
    const {
      lead_id,
      name,
      note,
      status_id,
      confidence,
      value,
      value_currency,
      value_period,
      contact_id,
      user_id,
      custom_fields
    } = context.propsValue;
    const { apiKey, environment } = context.auth;

    const opportunityData = {
        ...context.propsValue,
        value_period: context.propsValue.value_period as 'one_time' | 'monthly' | 'annual'
      };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${environment === 'sandbox' ? 'https://api-sandbox.close.com/api/v1' : 'https://api.close.com/api/v1'}/opportunity/`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: opportunityData,
      });

      return response.body;
    } catch (error:any) {
      if (error.response?.status === 400) {
        throw new Error(`Invalid request: ${JSON.stringify(error.response.body)}`);
      }
      if (error.response?.status === 404) {
        throw new Error(`Lead or related resource not found`);
      }
      throw new Error(`Failed to create opportunity: ${error.message}`);
    }
  },
});