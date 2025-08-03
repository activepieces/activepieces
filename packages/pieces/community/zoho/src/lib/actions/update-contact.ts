import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const updateContact = createAction({
  auth: zohoAuth,
  name: 'update-contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact record in Bigin',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the contact',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Mobile number of the contact',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Job title or position',
      required: false,
    }),
    address: Property.LongText({
      displayName: 'Address',
      description: 'Full address of the contact',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State/Province',
      description: 'State or province',
      required: false,
    }),
    zipCode: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      description: 'ZIP or postal code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Website URL',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Additional notes about the contact',
      required: false,
    }),
    leadSource: Property.StaticDropdown({
      displayName: 'Lead Source',
      description: 'Source of the lead',
      required: false,
      options: {
        options: [
          { label: 'Website', value: 'website' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Referral', value: 'referral' },
          { label: 'Social Media', value: 'social_media' },
          { label: 'Advertisement', value: 'advertisement' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      contactId,
      firstName,
      lastName,
      email,
      phone,
      mobile,
      company,
      jobTitle,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      description,
      leadSource,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/contacts/${contactId}`;

    const contactData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      mobile,
      company,
      job_title: jobTitle,
      address,
      city,
      state,
      zip_code: zipCode,
      country,
      website,
      description,
      lead_source: leadSource,
    };

    // Remove null/undefined values
    Object.keys(contactData).forEach(key => {
      if (contactData[key as keyof typeof contactData] === null || contactData[key as keyof typeof contactData] === undefined) {
        delete contactData[key as keyof typeof contactData];
      }
    });

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update contact: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 