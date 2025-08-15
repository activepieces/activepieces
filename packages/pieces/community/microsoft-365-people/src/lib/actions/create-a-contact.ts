import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365Auth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/client';

export const createAContact = createAction({
  auth: microsoft365Auth,
  name: 'createAContact',
  displayName: 'Create a Contact',
  description:
    'Create a new contact in Microsoft 365 People with detailed attributes',
  props: {
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: "The contact's display name",
      required: true,
    }),
    givenName: Property.ShortText({
      displayName: 'First Name',
      description: "The contact's first name",
      required: false,
    }),
    surname: Property.ShortText({
      displayName: 'Last Name',
      description: "The contact's last name",
      required: false,
    }),
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description: 'Primary email address',
      required: false,
    }),
    emailName: Property.ShortText({
      displayName: 'Email Display Name',
      description: 'Display name for the email address',
      required: false,
    }),
    businessPhone: Property.ShortText({
      displayName: 'Business Phone',
      description: 'Business phone number',
      required: false,
    }),
    homePhone: Property.ShortText({
      displayName: 'Home Phone',
      description: 'Home phone number',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'Mobile phone number',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: "The contact's company name",
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: "The contact's job title",
      required: false,
    }),
    businessStreet: Property.ShortText({
      displayName: 'Business Street Address',
      description: 'Business street address',
      required: false,
    }),
    businessCity: Property.ShortText({
      displayName: 'Business City',
      description: 'Business address city',
      required: false,
    }),
    businessState: Property.ShortText({
      displayName: 'Business State',
      description: 'Business address state/province',
      required: false,
    }),
    businessPostalCode: Property.ShortText({
      displayName: 'Business Postal Code',
      description: 'Business address postal/zip code',
      required: false,
    }),
    businessCountry: Property.ShortText({
      displayName: 'Business Country',
      description: 'Business address country',
      required: false,
    }),
    homeStreet: Property.ShortText({
      displayName: 'Home Street Address',
      description: 'Home street address',
      required: false,
    }),
    homeCity: Property.ShortText({
      displayName: 'Home City',
      description: 'Home address city',
      required: false,
    }),
    homeState: Property.ShortText({
      displayName: 'Home State',
      description: 'Home address state/province',
      required: false,
    }),
    homePostalCode: Property.ShortText({
      displayName: 'Home Postal Code',
      description: 'Home address postal/zip code',
      required: false,
    }),
    homeCountry: Property.ShortText({
      displayName: 'Home Country',
      description: 'Home address country',
      required: false,
    }),
    birthday: Property.ShortText({
      displayName: 'Birthday',
      description: 'Birthday in ISO 8601 format (YYYY-MM-DD)',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Contact Folder ID',
      description:
        'ID of the contact folder to create the contact in (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const contactData: any = {
      displayName: propsValue.displayName,
    };

    // Add optional basic fields
    if (propsValue.givenName) contactData.givenName = propsValue.givenName;
    if (propsValue.surname) contactData.surname = propsValue.surname;
    if (propsValue.companyName)
      contactData.companyName = propsValue.companyName;
    if (propsValue.jobTitle) contactData.jobTitle = propsValue.jobTitle;
    if (propsValue.birthday) contactData.birthday = propsValue.birthday;

    // Handle email addresses
    if (propsValue.emailAddress) {
      contactData.emailAddresses = [
        {
          address: propsValue.emailAddress,
          name: propsValue.emailName || propsValue.emailAddress,
        },
      ];
    }

    // Handle phone numbers
    const phoneNumbers: Array<{ number: string; type: string }> = [];

    if (propsValue.businessPhone) {
      phoneNumbers.push({
        number: propsValue.businessPhone,
        type: 'business',
      });
    }

    if (propsValue.homePhone) {
      phoneNumbers.push({
        number: propsValue.homePhone,
        type: 'home',
      });
    }

    if (propsValue.mobilePhone) {
      phoneNumbers.push({
        number: propsValue.mobilePhone,
        type: 'mobile',
      });
    }

    if (phoneNumbers.length > 0) {
      contactData.phoneNumbers = phoneNumbers;
    }

    // Handle business address
    const hasBusinessAddress =
      propsValue.businessStreet ||
      propsValue.businessCity ||
      propsValue.businessState ||
      propsValue.businessPostalCode ||
      propsValue.businessCountry;

    if (hasBusinessAddress) {
      contactData.businessAddress = {};
      if (propsValue.businessStreet)
        contactData.businessAddress.street = propsValue.businessStreet;
      if (propsValue.businessCity)
        contactData.businessAddress.city = propsValue.businessCity;
      if (propsValue.businessState)
        contactData.businessAddress.state = propsValue.businessState;
      if (propsValue.businessPostalCode)
        contactData.businessAddress.postalCode = propsValue.businessPostalCode;
      if (propsValue.businessCountry)
        contactData.businessAddress.countryOrRegion =
          propsValue.businessCountry;
    }

    // Handle home address
    const hasHomeAddress =
      propsValue.homeStreet ||
      propsValue.homeCity ||
      propsValue.homeState ||
      propsValue.homePostalCode ||
      propsValue.homeCountry;

    if (hasHomeAddress) {
      contactData.homeAddress = {};
      if (propsValue.homeStreet)
        contactData.homeAddress.street = propsValue.homeStreet;
      if (propsValue.homeCity)
        contactData.homeAddress.city = propsValue.homeCity;
      if (propsValue.homeState)
        contactData.homeAddress.state = propsValue.homeState;
      if (propsValue.homePostalCode)
        contactData.homeAddress.postalCode = propsValue.homePostalCode;
      if (propsValue.homeCountry)
        contactData.homeAddress.countryOrRegion = propsValue.homeCountry;
    }

    try {
      const contact = await microsoft365PeopleCommon.createContact(
        auth,
        contactData,
        propsValue.folderId || undefined
      );

      return {
        success: true,
        contact: contact,
        message: `Contact "${contact.displayName}" created successfully`,
      };
    } catch (error) {
      throw new Error(`Failed to create contact: ${error}`);
    }
  },
});
