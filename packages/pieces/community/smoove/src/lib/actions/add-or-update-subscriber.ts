import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { listsDropdown, emailDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addOrUpdateSubscriber = createAction({
  auth: smooveAuth,
  name: 'addOrUpdateSubscriber',
  displayName: 'Add or Update Subscriber',
  description: 'Create or update subscriber data, and subscribe/unsubscribe from lists',
  props: {
    email: emailDropdown,
    
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: false,
    }),
    dateOfBirth: Property.DateTime({
      displayName: 'Date of Birth',
      description: 'The date of birth of the contact',
      required: false,
    }),
    
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The primary phone number of the contact',
      required: false,
    }),
    cellPhone: Property.ShortText({
      displayName: 'Cell Phone',
      description: 'The cell phone number of the contact',
      required: false,
    }),
    
    address: Property.ShortText({
      displayName: 'Address',
      description: 'The street address of the contact',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city of the contact',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'The country of the contact',
      required: false,
    }),
    
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name of the contact',
      required: false,
    }),
    position: Property.ShortText({
      displayName: 'Position',
      description: 'The job title or position of the contact',
      required: false,
    }),
    
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'External identifier for the contact (useful for syncing with other systems)',
      required: false,
    }),
    campaignSource: Property.ShortText({
      displayName: 'Campaign Source',
      description: 'The campaign source that brought this contact',
      required: false,
    }),
    
    canReceiveEmails: Property.Checkbox({
      displayName: 'Can Receive Emails',
      description: 'Whether the contact can receive email communications',
      required: false,
      defaultValue: true,
    }),
    canReceiveSmsMessages: Property.Checkbox({
      displayName: 'Can Receive SMS',
      description: 'Whether the contact can receive SMS messages',
      required: false,
      defaultValue: true,
    }),
    
    lists: listsDropdown,
    
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom fields data (JSON object with field IDs as keys)',
      required: false,
    }),
    
    operation: Property.StaticDropdown({
      displayName: 'Operation',
      description: 'Choose the contact operation type',
      required: true,
      defaultValue: 'updateIfExists',
      options: {
        options: [
          { label: 'Create Only', value: 'create' },
          { label: 'Create or Update if Exists', value: 'updateIfExists' },
          { label: 'Restore if Deleted', value: 'restoreIfDeleted' },
          { label: 'Restore if Unsubscribed', value: 'restoreIfUnsubscribed' },
          { label: 'Override Nullable Values', value: 'overrideNullableValue' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      email, firstName, lastName, dateOfBirth, phone, cellPhone, 
      address, city, country, company, position, externalId, 
      campaignSource, canReceiveEmails, canReceiveSmsMessages, 
      lists, customFields, operation 
    } = propsValue;

    let endpoint = '/Contacts';
    const queryParams: string[] = [];
    
    if (operation === 'updateIfExists') queryParams.push('updateIfExists=true');
    if (operation === 'restoreIfDeleted') queryParams.push('restoreIfDeleted=true');
    if (operation === 'restoreIfUnsubscribed') queryParams.push('restoreIfUnsubscribed=true');
    if (operation === 'overrideNullableValue') queryParams.push('overrideNullableValue=true');
    
    if (queryParams.length) {
      endpoint += '?' + queryParams.join('&');
    }

    const body: any = {
      email,
    };

    if (firstName) body.firstName = firstName;
    if (lastName) body.lastName = lastName;
    if (dateOfBirth) body.dateOfBirth = dateOfBirth;
    if (phone) body.phone = phone;
    if (cellPhone) body.cellPhone = cellPhone;
    if (address) body.address = address;
    if (city) body.city = city;
    if (country) body.country = country;
    if (company) body.company = company;
    if (position) body.position = position;
    if (externalId) body.externalId = externalId;
    if (campaignSource) body.campaignSource = campaignSource;
    
    if (typeof canReceiveEmails === 'boolean') body.canReceiveEmails = canReceiveEmails;
    if (typeof canReceiveSmsMessages === 'boolean') body.canReceiveSmsMessages = canReceiveSmsMessages;
    
    if (lists && Array.isArray(lists) && lists.length > 0) {
      body.lists_Linked = lists;
    }
    
    if (customFields && typeof customFields === 'object') {
      body.customFields = customFields;
    }

    const response = await makeRequest(auth, HttpMethod.POST, endpoint, body);
    return response;
  },
});
