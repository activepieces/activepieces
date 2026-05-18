import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { klentyRequest } from './client';

type KlentyList = {
  name?: string;
  id?: string | number;
};

type KlentyCadence = {
  name?: string;
  id?: string | number;
};

export type ProspectPayloadInput = {
  email?: string;
  firstName?: string;
  company?: string;
  fullName?: string;
  lastName?: string;
  middleName?: string;
  account?: string;
  department?: string;
  companyDomain?: string;
  title?: string;
  location?: string;
  phone?: string;
  twitterId?: string;
  companyPhone?: string;
  companyEmail?: string;
  linkedinURL?: string;
  city?: string;
  country?: string;
  listName?: string;
  tags?: string;
  outcome?: string;
  owner?: string;
  customFields?: unknown[];
};

export const listNameProp = Property.Dropdown({
  displayName: 'List',
  description: 'Select a Klenty list.',
  required: false,
  refreshers: [],
  auth: klentyAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Klenty account first.',
        options: [],
      };
    }

    const lists = await klentyRequest<KlentyList[]>({
      auth,
      method: HttpMethod.GET,
      path: '/lists',
    });

    return {
      disabled: false,
      options: (lists ?? [])
        .filter((list) => list.name)
        .map((list) => ({
          label: list.name!,
          value: list.name!,
        })),
    };
  },
});

export const cadenceNameProp = Property.Dropdown({
  displayName: 'Cadence',
  description: 'Select a Klenty cadence.',
  required: true,
  refreshers: [],
  auth: klentyAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Klenty account first.',
        options: [],
      };
    }

    const cadences = await klentyRequest<KlentyCadence[]>({
      auth,
      method: HttpMethod.GET,
      path: '/cadences',
    });

    return {
      disabled: false,
      options: (cadences ?? [])
        .filter((cadence) => cadence.name)
        .map((cadence) => ({
          label: cadence.name!,
          value: cadence.name!,
        })),
    };
  },
});

export const prospectCommonProps = {
  company: Property.ShortText({
    displayName: 'Company',
    required: false,
  }),
  fullName: Property.ShortText({
    displayName: 'Full Name',
    required: false,
  }),
  lastName: Property.ShortText({
    displayName: 'Last Name',
    required: false,
  }),
  middleName: Property.ShortText({
    displayName: 'Middle Name',
    required: false,
  }),
  account: Property.ShortText({
    displayName: 'Account',
    required: false,
  }),
  department: Property.ShortText({
    displayName: 'Department',
    required: false,
  }),
  companyDomain: Property.ShortText({
    displayName: 'Company Domain',
    required: false,
  }),
  title: Property.ShortText({
    displayName: 'Title',
    required: false,
  }),
  location: Property.ShortText({
    displayName: 'Location',
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    required: false,
  }),
  twitterId: Property.ShortText({
    displayName: 'Twitter ID',
    required: false,
  }),
  companyPhone: Property.ShortText({
    displayName: 'Company Phone',
    required: false,
  }),
  companyEmail: Property.ShortText({
    displayName: 'Company Email',
    required: false,
  }),
  linkedinURL: Property.ShortText({
    displayName: 'LinkedIn URL',
    required: false,
  }),
  city: Property.ShortText({
    displayName: 'City',
    required: false,
  }),
  country: Property.ShortText({
    displayName: 'Country',
    required: false,
  }),
  listName: listNameProp,
  tags: Property.ShortText({
    displayName: 'Tags',
    description: 'Pipe-separated tag names, for example: Tag1|Tag2',
    required: false,
  }),
  outcome: Property.ShortText({
    displayName: 'Outcome',
    description: 'Klenty outcome value. Case-sensitive.',
    required: false,
  }),
  owner: Property.ShortText({
    displayName: 'Owner',
    description: 'Email address of the Klenty user to assign as prospect owner.',
    required: false,
  }),
  customFields: Property.Array({
    displayName: 'Custom Fields',
    description: 'Key/value pairs to send in Klenty CustomFields.',
    required: false,
    properties: {
      key: Property.ShortText({
        displayName: 'Key',
        required: true,
      }),
      value: Property.ShortText({
        displayName: 'Value',
        required: false,
      }),
    },
  }),
};

export function buildProspectPayload(
  input: ProspectPayloadInput,
): Record<string, unknown> {
  const customFields = (input.customFields ?? [])
    .filter((field): field is Record<string, unknown> => {
      return typeof field === 'object' && field !== null && 'key' in field;
    })
    .map((field) => ({
      key: String(field['key']),
      value:
        field['value'] === undefined || field['value'] === null
          ? ''
          : String(field['value']),
    }));

  return Object.fromEntries(
    Object.entries({
      Email: input.email,
      FirstName: input.firstName,
      Company: input.company,
      FullName: input.fullName,
      LastName: input.lastName,
      MiddleName: input.middleName,
      Account: input.account,
      Department: input.department,
      CompanyDomain: input.companyDomain,
      Title: input.title,
      Location: input.location,
      Phone: input.phone,
      TwitterId: input.twitterId,
      CompanyPhone: input.companyPhone,
      CompanyEmail: input.companyEmail,
      LinkedinURL: input.linkedinURL,
      City: input.city,
      Country: input.country,
      List: input.listName,
      Tags: input.tags,
      Outcome: input.outcome,
      Owner: input.owner,
      CustomFields: customFields.length > 0 ? customFields : undefined,
    }).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}
