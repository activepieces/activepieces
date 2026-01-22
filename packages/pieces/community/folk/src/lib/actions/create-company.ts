import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const createCompany = createAction({
  auth: folkAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Create a new company in your Folk workspace. You can add emails, links, phone numbers, and assign it to a group.',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A short description of the company',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'The industry the company operates in',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      description: 'Physical addresses for the company. The first address is primary.',
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
      description: 'Email addresses for the company. The first email is primary.',
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
      description: 'Phone numbers for the company. The first phone is primary.',
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
      description: 'Website URLs for the company. The first URL is primary.',
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
    const { name, description, industry, addresses, emails, phones, urls, groupId } = context.propsValue;

    const companyData: any = {
      name,
    };

    if (description) companyData.description = description;
    if (industry) companyData.industry = industry;

    if (addresses && Array.isArray(addresses) && addresses.length > 0) {
      companyData.addresses = addresses.map((addr: any) => addr.value || addr);
    }

    if (emails && Array.isArray(emails) && emails.length > 0) {
      companyData.emails = emails.map((e: any) => e.value || e);
    }

    if (phones && Array.isArray(phones) && phones.length > 0) {
      companyData.phones = phones.map((p: any) => p.value || p);
    }

    if (urls && Array.isArray(urls) && urls.length > 0) {
      companyData.urls = urls.map((u: any) => u.value || u);
    }

    if (groupId) {
      companyData.groups = [{ id: groupId }];
    }

    const response = await folkClient.createCompany({
      apiKey: context.auth,
      data: companyData,
    });

    return {
      company: response.data,
      success: true,
    };
  },
});

