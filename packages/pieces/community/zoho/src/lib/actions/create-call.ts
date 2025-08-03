import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createCall = createAction({
  auth: zohoAuth,
  name: 'create-call',
  displayName: 'Create Call',
  description: 'Log a new call entry in Bigin',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject or title of the call',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the call',
      required: false,
    }),
    callType: Property.StaticDropdown({
      displayName: 'Call Type',
      description: 'Type of call',
      required: true,
      options: {
        options: [
          { label: 'Inbound', value: 'inbound' },
          { label: 'Outbound', value: 'outbound' },
          { label: 'Missed', value: 'missed' },
        ],
      },
    }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
      description: 'Duration of the call in seconds',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number for the call',
      required: false,
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact related to this call',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the company related to this call',
      required: false,
    }),
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      description: 'ID of the deal/pipeline record related to this call',
      required: false,
    }),
    callDate: Property.DateTime({
      displayName: 'Call Date',
      description: 'Date and time of the call',
      required: true,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      subject,
      description,
      callType,
      duration,
      phoneNumber,
      contactId,
      companyId,
      dealId,
      callDate,
    } = propsValue;

    // Construct the API endpoint - using a placeholder that can be updated
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/calls`;

    const callData = {
      subject,
      description,
      call_type: callType,
      duration: duration ? parseInt(duration.toString()) : null,
      phone_number: phoneNumber,
      contact_id: contactId,
      company_id: companyId,
      deal_id: dealId,
      call_date: callDate,
    };

    // Remove null/undefined values
    Object.keys(callData).forEach(key => {
      if (callData[key as keyof typeof callData] === null || callData[key as keyof typeof callData] === undefined) {
        delete callData[key as keyof typeof callData];
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create call: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 