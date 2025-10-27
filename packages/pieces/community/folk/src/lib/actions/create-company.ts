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
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses for the company',
      required: false,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        label: Property.ShortText({
          displayName: 'Label',
          description: 'Label for the email (e.g., work, personal)',
          required: false,
        }),
      },
    }),
    links: Property.Array({
      displayName: 'Links',
      description: 'Website links for the company',
      required: false,
      properties: {
        link: Property.ShortText({
          displayName: 'URL',
          required: true,
        }),
        label: Property.ShortText({
          displayName: 'Label',
          description: 'Label for the link (e.g., website, linkedin)',
          required: false,
        }),
      },
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers for the company',
      required: false,
      properties: {
        phone: Property.ShortText({
          displayName: 'Phone Number',
          required: true,
        }),
        label: Property.ShortText({
          displayName: 'Label',
          required: false,
        }),
      },
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the company',
      required: false,
    }),
    groupId: folkProps.group_id(false, 'Group ID'),
  },
  async run(context) {
    const { name, emails, links, phoneNumbers, notes, groupId } = context.propsValue;

    const companyData: any = {
      name,
    };

    if (emails && Array.isArray(emails) && emails.length > 0) {
      companyData.emails = emails.map((e: any) => ({
        email: e.email,
        label: e.label || 'work',
      }));
    }

    if (links && Array.isArray(links) && links.length > 0) {
      companyData.links = links.map((l: any) => ({
        link: l.link,
        label: l.label || 'website',
      }));
    }

    if (phoneNumbers && Array.isArray(phoneNumbers) && phoneNumbers.length > 0) {
      companyData.phoneNumbers = phoneNumbers.map((p: any) => ({
        phone: p.phone,
        label: p.label || 'work',
      }));
    }

    if (notes) {
      companyData.notes = notes;
    }

    if (groupId) {
      companyData.groupId = groupId;
    }

    const response = await folkClient.createCompany({
      apiKey: context.auth,
      data: companyData,
    });

    return {
      company: response.company,
      success: true,
    };
  },
});

