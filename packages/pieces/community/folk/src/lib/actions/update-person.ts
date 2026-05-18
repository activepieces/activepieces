import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const updatePerson = createAction({
  auth: folkAuth,
  name: 'updatePerson',
  displayName: 'Update Person',
  description:
    'Update an existing person in your Folk workspace with new information.',
  props: {
    personId: folkProps.person_id(true),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the person',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the person',
      required: false,
    }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'The full name of the person (alternative to first/last)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A short description of the person',
      required: false,
    }),
    birthday: Property.ShortText({
      displayName: 'Birthday',
      description: 'The birthday in YYYY-MM-DD format',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'The job title of the person',
      required: false,
    }),
    companyIds: folkProps.companyIds(false),
    companyNames: Property.Array({
      displayName: 'Company Names',
      description:
        "Company names to create or associate with. Companies will be created if they don't exist.",
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Company Name',
          required: true,
        }),
      },
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      description:
        'Physical addresses for the person. The first address is primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Address',
          required: true,
        }),
      },
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description:
        'Email addresses for the person. The first email is primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
      },
    }),
    phones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers for the person. The first phone is primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Phone Number',
          required: true,
        }),
      },
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'Website URLs for the person. The first URL is primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'URL',
          required: true,
        }),
      },
    }),
    groupId: folkProps.group_id(false, 'Group ID'),
  },
  async run(context) {
    const {
      personId,
      firstName,
      lastName,
      fullName,
      description,
      birthday,
      jobTitle,
      companyIds,
      companyNames,
      addresses,
      emails,
      phones,
      urls,
      groupId,
    } = context.propsValue;

    const personData: any = {};

    if (firstName) personData.firstName = firstName;
    if (lastName) personData.lastName = lastName;
    if (fullName) personData.fullName = fullName;
    if (description) personData.description = description;
    if (birthday) personData.birthday = birthday;
    if (jobTitle) personData.jobTitle = jobTitle;

    const companies: any[] = [];
    if (companyIds) {
      for (const companyId of companyIds) {
        companies.push({ id: companyId });
      }
    }
    if (companyNames && Array.isArray(companyNames)) {
      companies.push(...companyNames.map((c: any) => ({ name: c.value || c })));
    }
    if (companies.length > 0) personData.companies = companies;

    if (addresses && Array.isArray(addresses) && addresses.length > 0) {
      personData.addresses = addresses.map((addr: any) => addr.value || addr);
    }

    if (emails && Array.isArray(emails) && emails.length > 0) {
      personData.emails = emails.map((e: any) => e.value || e);
    }

    if (phones && Array.isArray(phones) && phones.length > 0) {
      personData.phones = phones.map((p: any) => p.value || p);
    }

    if (urls && Array.isArray(urls) && urls.length > 0) {
      personData.urls = urls.map((u: any) => u.value || u);
    }

    if (groupId) {
      personData.groups = [{ id: groupId }];
    }

    const response = await folkClient.updatePerson({
      apiKey: context.auth,
      contactId: personId as string,
      data: personData,
    });

    return {
      data: response.data,
      success: true,
    };
  },
});
