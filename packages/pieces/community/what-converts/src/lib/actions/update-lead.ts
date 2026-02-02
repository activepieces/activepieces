import { createAction, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';
import { whatConvertsProps } from '../common/props';

export const updateLeadAction = createAction({
  auth: whatConvertsAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: "Update an existing lead's attributes by its ID.",
  props: {
    account_id: whatConvertsProps.account_id(),
    profile_id: whatConvertsProps.profile_id(true),
    lead_id: whatConvertsProps.lead_id(),
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
    referring_source: Property.StaticDropdown({
      displayName: 'Referring Source',
      description: 'The source of the lead (e.g., "google").',
      required: false,
      options: {
        options: [
          { label: 'Google', value: 'google' },
          { label: 'Bing', value: 'bing' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Twitter', value: 'twitter' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'Direct Traffic', value: '(direct)' },
        ],
      },
    }),
    referring_medium: Property.StaticDropdown({
      displayName: 'Referring Medium',
      description: 'The medium of the lead (e.g., "cpc").',
      required: false,
      options: {
        options: [
          { label: 'Organic Search', value: 'organic' },
          { label: 'Paid Search (CPC)', value: 'cpc' },
          { label: 'Social Media', value: 'social' },
          { label: 'Email', value: 'email' },
          { label: 'Referral', value: 'referral' },
          { label: 'Display Ad', value: 'display' },
          { label: 'None (for Direct Traffic)', value: '(none)' },
        ],
      },
    }),
    referring_campaign: Property.StaticDropdown({
      displayName: 'Referring Campaign',
      description: 'The campaign that generated the lead.',
      required: false,
      options: {
        options: [
          { label: 'Summer Sale', value: 'summer-sale' },
          { label: 'Q4 Promotion', value: 'q4-promo' },
          { label: 'New Product Launch', value: 'new-product-launch' },
          { label: 'Brand Awareness', value: 'brand-awareness' },
        ],
      },
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    if (propsValue.lead_id === undefined) {
      throw new Error('Lead ID is required to update a lead.');
    }
    const body: { [key: string]: unknown } = {};
    const leadDetails: { [key: string]: unknown } = {};
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

    return await whatConvertsClient.updateLead(auth, propsValue.lead_id, body);
  },
});
