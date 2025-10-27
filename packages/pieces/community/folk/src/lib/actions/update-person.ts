import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const updatePerson = createAction({
  auth: folkAuth,
  name: 'updatePerson',
  displayName: 'Update Person',
  description: 'Update an existing person in your Folk workspace. Select the person from the dropdown to update their details.',
  props: {
    contactId: folkProps.person_id(true),
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
      description: 'The full name of the person',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'The job title of the person',
      required: false,
    }),
    companyId: folkProps.company_id(false),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses for the person',
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
      description: 'Website links for the person',
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
      description: 'Phone numbers for the person',
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
      description: 'Additional notes about the person',
      required: false,
    }),
    groupId: folkProps.group_id(false, 'Group ID'),
  },
  async run(context) {
    const { contactId, firstName, lastName, fullName, jobTitle, companyId, emails, links, phoneNumbers, notes, groupId } = context.propsValue;

    const personData: any = {};

    if (fullName) personData.fullName = fullName;
    if (firstName) personData.firstName = firstName;
    if (lastName) personData.lastName = lastName;
    if (jobTitle) personData.jobTitle = jobTitle;
    if (companyId) personData.companyId = companyId;

    if (emails && Array.isArray(emails)) {
      personData.emails = emails.map((e: any) => ({
        email: e.email,
        label: e.label || 'work',
      }));
    }

    if (links && Array.isArray(links)) {
      personData.links = links.map((l: any) => ({
        link: l.link,
        label: l.label || 'website',
      }));
    }

    if (phoneNumbers && Array.isArray(phoneNumbers)) {
      personData.phoneNumbers = phoneNumbers.map((p: any) => ({
        phone: p.phone,
        label: p.label || 'work',
      }));
    }

    if (notes) personData.notes = notes;
    if (groupId) personData.groupId = groupId;

    const response = await folkClient.updatePerson({
      apiKey: context.auth,
      contactId: contactId as string,
      data: personData,
    });

    return {
      contact: response.contact,
      success: true,
    };
  },
});

