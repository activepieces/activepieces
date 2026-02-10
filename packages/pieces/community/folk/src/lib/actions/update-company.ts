import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const updateCompany = createAction({
  auth: folkAuth,
  name: 'updateCompany',
  displayName: 'Update Company',
  description: 'Update an existing company in your Folk workspace. Select the company from the dropdown to update its details.',
  props: {
    companyId: folkProps.company_id(true),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: false,
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
    const { companyId, name, description, industry, addresses, emails, phones, urls, groupId } = context.propsValue;

    const companyData: any = {};

    if (name) companyData.name = name;
    if (description) companyData.description = description;
    if (industry) companyData.industry = industry;

    if (addresses && Array.isArray(addresses)) {
      companyData.addresses = addresses.map((addr: any) => addr.value || addr);
    }

    if (emails && Array.isArray(emails)) {
      companyData.emails = emails.map((e: any) => e.value || e);
    }

    if (phones && Array.isArray(phones)) {
      companyData.phones = phones.map((p: any) => p.value || p);
    }

    if (urls && Array.isArray(urls)) {
      companyData.urls = urls.map((u: any) => u.value || u);
    }

    if (groupId) {
      companyData.groups = [{ id: groupId }];
    }

    const response = await folkClient.updateCompany({
      apiKey: context.auth,
      companyId: companyId as string,
      data: companyData,
    });

    return {
      company: response.data,
      success: true,
    };
  },
});

