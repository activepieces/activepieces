import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { closeAuth } from "../../";
import { CloseCRMContact } from "../common/types";

export const createContact = createAction({
  auth: closeAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Add a new contact to a lead in Close CRM with comprehensive details',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to associate this contact with',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Full Name',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      required: false,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: false,
          options: {
            options: [
              { label: 'Work', value: 'work' },
              { label: 'Home', value: 'home' },
              { label: 'Other', value: 'other' },
            ],
          },
        }),
      },
    }),
    phones: Property.Array({
      displayName: 'Phone Numbers',
      required: false,
      properties: {
        phone: Property.ShortText({
          displayName: 'Number',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: false,
          options: {
            options: [
              { label: 'Mobile', value: 'mobile' },
              { label: 'Work', value: 'work' },
              { label: 'Home', value: 'home' },
              { label: 'Fax', value: 'fax' },
              { label: 'Other', value: 'other' },
            ],
          },
        }),
      },
    }),
    urls: Property.Array({
      displayName: 'Website URLs',
      required: false,
      properties: {
        url: Property.ShortText({
          displayName: 'URL',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: false,
          options: {
            options: [
              { label: 'Website', value: 'website' },
              { label: 'LinkedIn', value: 'linkedin' },
              { label: 'Twitter', value: 'twitter' },
              { label: 'Other', value: 'other' },
            ],
          },
        }),
      },
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Additional custom fields for this contact',
      required: false,
    }),
  },
  async run(context) {
    const { lead_id, name, title, emails, phones, urls, customFields } = context.propsValue;
    const { apiKey, environment } = context.auth;

    const contactData: Partial<CloseCRMContact> = { // Use Partial for creation
      lead_id: lead_id,
      name: name,
      email: emails ? emails.map(email => ({ 
        type: email as string,
        email: email as string 
      })) : [],
      phone: phones ? phones.map(phone => ({ 
        type: phone as string,
        phone: phone as string 
      })) : [],
      url: urls ? urls.map(url => ({ 
        type: url as string,
        url: url as string 
      })) : [],
    };
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${environment === 'sandbox' ? 'https://api-sandbox.close.com/api/v1' : 'https://api.close.com/api/v1'}/contact/`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: contactData,
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      }
      if (error.response?.status === 404) {
        throw new Error(`Lead not found with ID: ${lead_id}`);
      }
      throw new Error(`Error creating contact: ${error.message}`);
    }
  },
});