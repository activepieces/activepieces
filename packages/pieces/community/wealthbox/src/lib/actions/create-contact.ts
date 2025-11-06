import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Adds a new contact with rich details (name, address, email, tags, etc.)',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: true
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name', 
      description: 'The last name of the contact',
      required: true
    }),
    
    prefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'The preferred prefix for the contact (e.g., Mr., Ms., Dr.)',
      required: false
    }),
    middle_name: Property.ShortText({
      displayName: 'Middle Name',
      description: 'The middle name of the contact',
      required: false
    }),
    suffix: Property.ShortText({
      displayName: 'Suffix',
      description: 'The suffix associated with the contact (e.g., Jr., Sr., M.D.)',
      required: false
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'A preferred shortname for the contact',
      required: false
    }),
    
    job_title: Property.ShortText({
      displayName: 'Job Title',
      description: 'The title the contact holds at their present company',
      required: false
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the contact\'s present company',
      required: false
    }),
    
    type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'The type of the contact being created',
      required: false,
      defaultValue: 'Person',
      options: {
        options: [
          { label: 'Person', value: 'Person' },
          { label: 'Household', value: 'Household' },
          { label: 'Organization', value: 'Organization' },
          { label: 'Trust', value: 'Trust' }
        ]
      }
    }),
    contact_type: Property.StaticDropdown({
      displayName: 'Contact Classification',
      description: 'A string further classifying the contact',
      required: false,
      options: {
        options: [
          { label: 'Client', value: 'Client' },
          { label: 'Past Client', value: 'Past Client' },
          { label: 'Prospect', value: 'Prospect' },
          { label: 'Vendor', value: 'Vendor' },
          { label: 'Organization', value: 'Organization' }
        ]
      }
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Whether the contact is currently active',
      required: false,
      defaultValue: 'Active',
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' }
        ]
      }
    }),
    
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'The gender of the contact',
      required: false,
      options: {
        options: [
          { label: 'Female', value: 'Female' },
          { label: 'Male', value: 'Male' },
          { label: 'Non-binary', value: 'Non-binary' },
          { label: 'Unknown', value: 'Unknown' }
        ]
      }
    }),
    birth_date: Property.DateTime({
      displayName: 'Birth Date',
      description: 'The birthdate of the contact (YYYY-MM-DD format)',
      required: false
    }),
    marital_status: Property.StaticDropdown({
      displayName: 'Marital Status',
      description: 'The marital status of the contact',
      required: false,
      options: {
        options: [
          { label: 'Married', value: 'Married' },
          { label: 'Single', value: 'Single' },
          { label: 'Divorced', value: 'Divorced' },
          { label: 'Widowed', value: 'Widowed' },
          { label: 'Life Partner', value: 'Life Partner' },
          { label: 'Separated', value: 'Separated' },
          { label: 'Unknown', value: 'Unknown' }
        ]
      }
    }),
    
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Primary email address for the contact',
      required: false
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Primary phone number for the contact (e.g., (555) 123-4567)',
      required: false
    }),
    
    street_line_1: Property.ShortText({
      displayName: 'Street Address Line 1',
      description: 'First line of street address',
      required: false
    }),
    street_line_2: Property.ShortText({
      displayName: 'Street Address Line 2',
      description: 'Second line of street address (apt, suite, etc.)',
      required: false
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City for the address',
      required: false
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State or province for the address',
      required: false
    }),
    zip_code: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'ZIP or postal code for the address',
      required: false
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country for the address',
      required: false,
      defaultValue: 'United States'
    }),
    
    twitter_name: Property.ShortText({
      displayName: 'Twitter Handle',
      description: 'The twitter handle of the contact',
      required: false
    }),
    linkedin_url: Property.LongText({
      displayName: 'LinkedIn URL',
      description: 'The LinkedIn URL for the contact',
      required: false
    }),
    
    background_information: Property.LongText({
      displayName: 'Background Information',
      description: 'A brief description of the contact',
      required: false
    }),
    important_information: Property.LongText({
      displayName: 'Important Information',
      description: 'Any other important info for the contact',
      required: false
    }),
    personal_interests: Property.LongText({
      displayName: 'Personal Interests',
      description: 'Personal interests for the contact',
      required: false
    }),
    
    contact_source: Property.StaticDropdown({
      displayName: 'Contact Source',
      description: 'The method in which this contact was acquired',
      required: false,
      options: {
        options: [
          { label: 'Referral', value: 'Referral' },
          { label: 'Conference', value: 'Conference' },
          { label: 'Direct Mail', value: 'Direct Mail' },
          { label: 'Cold Call', value: 'Cold Call' },
          { label: 'Other', value: 'Other' }
        ]
      }
    }),
    
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to associate with the contact (e.g., "Client", "VIP", "Referral")',
      required: false
    }),
    
    external_unique_id: Property.ShortText({
      displayName: 'External Unique ID',
      description: 'A unique identifier for this contact in an external system',
      required: false
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    
    const requestBody: any = {};

    if (propsValue.type === 'Household') {
      if (propsValue.first_name) {
        requestBody.name = propsValue.first_name;
      }
    } else {
      if (propsValue.first_name) requestBody.first_name = propsValue.first_name;
      if (propsValue.last_name) requestBody.last_name = propsValue.last_name;
    }
    
    if (propsValue.prefix) requestBody.prefix = propsValue.prefix;
    if (propsValue.middle_name) requestBody.middle_name = propsValue.middle_name;
    if (propsValue.suffix) requestBody.suffix = propsValue.suffix;
    if (propsValue.nickname) requestBody.nickname = propsValue.nickname;
    if (propsValue.job_title) requestBody.job_title = propsValue.job_title;
    if (propsValue.company_name) requestBody.company_name = propsValue.company_name;
    if (propsValue.type) requestBody.type = propsValue.type;
    if (propsValue.contact_type) requestBody.contact_type = propsValue.contact_type;
    if (propsValue.status) requestBody.status = propsValue.status;
    if (propsValue.gender) requestBody.gender = propsValue.gender;
    if (propsValue.birth_date) requestBody.birth_date = propsValue.birth_date;
    if (propsValue.marital_status) requestBody.marital_status = propsValue.marital_status;
    if (propsValue.twitter_name) requestBody.twitter_name = propsValue.twitter_name;
    if (propsValue.linkedin_url) requestBody.linkedin_url = propsValue.linkedin_url;
    if (propsValue.background_information) requestBody.background_information = propsValue.background_information;
    if (propsValue.important_information) requestBody.important_information = propsValue.important_information;
    if (propsValue.personal_interests) requestBody.personal_interests = propsValue.personal_interests;
    if (propsValue.contact_source) requestBody.contact_source = propsValue.contact_source;
    if (propsValue.external_unique_id) requestBody.external_unique_id = propsValue.external_unique_id;
    
    if (propsValue.email_address) {
      requestBody.email_addresses = [{
        address: propsValue.email_address,
        principal: true,
        kind: 'Work'
      }];
    }
    
    if (propsValue.phone_number) {
      requestBody.phone_numbers = [{
        address: propsValue.phone_number,
        principal: true,
        kind: 'Work'
      }];
    }
    
    if (propsValue.street_line_1 || propsValue.city || propsValue.state || propsValue.zip_code) {
      requestBody.street_addresses = [{
        street_line_1: propsValue.street_line_1 || '',
        street_line_2: propsValue.street_line_2 || '',
        city: propsValue.city || '',
        state: propsValue.state || '',
        zip_code: propsValue.zip_code || '',
        country: propsValue.country || 'United States',
        principal: true,
        kind: 'Work'
      }];
    }
    
    if (propsValue.tags && Array.isArray(propsValue.tags)) {
      requestBody.tags = propsValue.tags;
    }
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.crmworkspace.com/v1/contacts',
        headers: {
          'ACCESS_TOKEN': auth as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      if (response.status >= 400) {
        throw new Error(`Wealthbox API error: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});