import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { companyDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { handleDropdownError } from '../common/helpers';

export const createContact = createAction({
  auth: biginAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Creates a Contact Record',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Mobile phone number',
      required: false,
    }),
    emailOptOut: Property.Checkbox({
      displayName: 'Email Opt Out',
      description: 'Whether the contact has opted out of emails',
      required: false,
      defaultValue: false,
    }),
    owner: usersDropdown,
    accountName: companyDropdown,
    tag: tagsDropdown('Contacts'),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Provide additional descriptions or notes related to the contact',
      required: false,
    }),
    mailingStreet: Property.ShortText({
      displayName: 'Mailing Street',
      description: 'Street address for mailing',
      required: false,
    }),
    mailingCity: Property.ShortText({
      displayName: 'Mailing City',
      description: 'City for mailing address',
      required: false,
    }),
    mailingState: Property.ShortText({
      displayName: 'Mailing State',
      description: 'State for mailing address',
      required: false,
    }),
    mailingCountry: Property.ShortText({
      displayName: 'Mailing Country',
      description: 'Country for mailing address',
      required: false,
    }),
    mailingZip: Property.ShortText({
      displayName: 'Mailing Zip',
      description: 'ZIP/postal code',
      required: false,
    }),
  },
  async run(context) {
    try {
      const {
        firstName,
        lastName,
        title,
        email,
        mobile,
        emailOptOut,
        owner,
        accountName,
        tag,
        description,
        mailingStreet,
        mailingCity,
        mailingState,
        mailingCountry,
        mailingZip,
      } = context.propsValue;

      const record: Record<string, any> = {
        First_Name: firstName,
        Last_Name: lastName,
        Title: title,
        Email: email,
        Mobile: mobile,
        Email_Opt_Out: emailOptOut,
        Owner: owner ? { id: owner } : undefined,
        Account_Name: accountName ? { id: accountName } : undefined,
        Tag: tag?.length ? tag.map((t: any) => ({ name: t })) : undefined,
        Description: description,
        Mailing_Street: mailingStreet,
        Mailing_City: mailingCity,
        Mailing_State: mailingState,
        Mailing_Country: mailingCountry,
        Mailing_Zip: mailingZip,
      };

      Object.keys(record).forEach((k) => {
        const v = record[k];
        if (
          v === undefined ||
          v === null ||
          (typeof v === 'string' && v.trim() === '') ||
          (Array.isArray(v) && v.length === 0)
        ) {
          delete record[k];
        }
      });

      const payload = { data: [record] };

      const response = await biginApiService.createContact(
        context.auth.access_token,
        (context.auth as any).api_domain,
        payload
      );

      return {
        message: 'Contact created successfully',
        data: response.data[0],
      };
    } catch (error: any) {
      console.error('Error creating contact:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to create contact: ${error.message}`
          : 'Failed to create contact due to an unknown error'
      );
    }
  },
});
