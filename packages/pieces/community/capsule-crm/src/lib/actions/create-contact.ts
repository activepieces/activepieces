import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { partyOutputSchema } from '../common/output-schemas';
import { CreatePartyParams } from '../common/types';

export const createContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Create a new Person or Organisation in Capsule CRM.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new person or organisation in Capsule CRM and returns the created party. Each call creates a separate record.',
    idempotent: false,
  },
  outputSchema: partyOutputSchema,
  props: {
    type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'The type of contact to create.',
      required: true,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Organisation', value: 'organisation' },
        ],
      },
    }),
    contactFields: Property.DynamicProperties({
      auth: capsuleCrmAuth,
      displayName: 'Details',
      required: true,
      refreshers: ['type'],
      props: async ({ auth, type }) => {
        const contactType: unknown = type;
        const fields: DynamicPropsValue = {};
        
        if (contactType === 'person') {
          const organisations = auth
            ? await capsuleCrmClient.searchContacts({ auth })
            : [];
          const organisationOptions = organisations
            .filter((party) => party.type === 'organisation')
            .map((org) => ({
              label: org.name || `Organisation ${org.id}`,
              value: org.id,
            }));

          fields['firstName'] = Property.ShortText({
            displayName: 'First Name',
            required: true,
          });
          fields['lastName'] = Property.ShortText({
            displayName: 'Last Name',
            required: true,
          });
          fields['title'] = Property.ShortText({
            displayName: 'Title',
            required: false,
          });
          fields['jobTitle'] = Property.ShortText({
            displayName: 'Job Title',
            required: false,
          });
          fields['organisationId'] = Property.StaticDropdown({
            displayName: 'Organisation',
            required: false,
            options: {
              options: organisationOptions,
            },
          });
        } else if (contactType === 'organisation') {
          fields['organisationName'] = Property.ShortText({
            displayName: 'Organisation Name',
            required: true,
          });
        }
        return fields;
      },
    }),
    about: Property.LongText({
      displayName: 'About',
      required: false,
    }),
    ownerId: Property.Dropdown({
      auth: capsuleCrmAuth,
      displayName: 'Owner',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        const users = await capsuleCrmClient.listUsers({ auth });
        return {
          options: users.map((user) => ({
            label: user.name,
            value: user.id,
          })),
        };
      },
    }),
    teamId: Property.Dropdown({
      auth: capsuleCrmAuth,
      displayName: 'Team',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        const teams = await capsuleCrmClient.listTeams({ auth });
        return {
          options: teams.map((team) => ({
            label: team.name,
            value: team.id,
          })),
        };
      },
    }),
    tags: Property.MultiSelectDropdown({
      auth: capsuleCrmAuth,
      displayName: 'Tags',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        const tags = await capsuleCrmClient.listTags({ auth, entity: 'party' });
        return {
          options: tags.map((tag) => ({
            label: tag.name,
            value: tag.name,
          })),
        };
      },
    }),
    customFields: Property.DynamicProperties({
      auth: capsuleCrmAuth,
      displayName: 'Custom Fields',
      required: true,
      refreshers: [],
      props: async ({ auth }) => {
        const fields: DynamicPropsValue = {};
        if (!auth) return fields;
        const customFields = await capsuleCrmClient.listCustomFields({ auth, entity: 'party' });
        for (const field of customFields) {
          switch (field.type) {
            case 'list':
              fields[field.id] = Property.StaticDropdown({
                displayName: field.name,
                required: false,
                options: {
                  options:
                    field.options?.map((option) => ({
                      label: option,
                      value: option,
                    })) || [],
                },
              });
              break;
            case 'boolean':
              fields[field.id] = Property.Checkbox({
                displayName: field.name,
                required: false,
              });
              break;
            case 'date':
              fields[field.id] = Property.DateTime({
                displayName: field.name,
                required: false,
              });
              break;
            default:
              fields[field.id] = Property.ShortText({
                displayName: field.name,
                required: false,
              });
          }
        }
        return fields;
      },
    }),
    emailAddresses: Property.Array({
      displayName: 'Email Addresses',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: false,
          options: {
            options: [
              { label: 'Home', value: 'Home' },
              { label: 'Work', value: 'Work' },
            ],
          },
        }),
        address: Property.ShortText({
          displayName: 'Address',
          required: true,
        }),
      },
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: false,
          options: {
            options: [
              { label: 'Home', value: 'Home' },
              { label: 'Work', value: 'Work' },
              { label: 'Mobile', value: 'Mobile' },
              { label: 'Fax', value: 'Fax' },
              { label: 'Direct', value: 'Direct' },
            ],
          },
        }),
        number: Property.ShortText({
          displayName: 'Number',
          required: true,
        }),
      },
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: false,
          options: {
            options: [
              { label: 'Home', value: 'Home' },
              { label: 'Postal', value: 'Postal' },
              { label: 'Office', value: 'Office' },
              { label: 'Billing', value: 'Billing' },
              { label: 'Shipping', value: 'Shipping' },
            ],
          },
        }),
        street: Property.ShortText({
          displayName: 'Street',
          required: false,
        }),
        city: Property.ShortText({
          displayName: 'City',
          required: false,
        }),
        state: Property.ShortText({
          displayName: 'State',
          required: false,
        }),
        country: Property.ShortText({
          displayName: 'Country',
          required: false,
        }),
        zip: Property.ShortText({
          displayName: 'Zip',
          required: false,
        }),
      },
    }),
    websites: Property.Array({
      displayName: 'Websites',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: false,
          options: {
            options: [
              { label: 'Home', value: 'Home' },
              { label: 'Work', value: 'Work' },
            ],
          },
        }),
        service: Property.StaticDropdown({
          displayName: 'Service',
          required: true,
          options: {
            options: [
              { label: 'URL', value: 'URL' },
              { label: 'Skype', value: 'SKYPE' },
              { label: 'Twitter', value: 'TWITTER' },
              { label: 'LinkedIn', value: 'LINKED_IN' },
              { label: 'Facebook', value: 'FACEBOOK' },
              { label: 'Xing', value: 'XING' },
              { label: 'Feed', value: 'FEED' },
              { label: 'Google+', value: 'GOOGLE_PLUS' },
              { label: 'Flickr', value: 'FLICKR' },
              { label: 'GitHub', value: 'GITHUB' },
              { label: 'YouTube', value: 'YOUTUBE' },
              { label: 'Instagram', value: 'INSTAGRAM' },
              { label: 'Pinterest', value: 'PINTEREST' },
            ],
          },
        }),
        address: Property.ShortText({
          displayName: 'Address',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const type = propsValue.type === 'organisation' ? 'organisation' : 'person';
    const contactFields = propsValue.contactFields ?? {};
    const customFields = propsValue.customFields ?? {};

    const params: CreatePartyParams = {
      type,
      title: textOf(contactFields['title']),
      jobTitle: textOf(contactFields['jobTitle']),
      about: propsValue.about,
      organisationId: organisationIdOf(contactFields['organisationId']),
      ownerId: propsValue.ownerId,
      teamId: propsValue.teamId,
      tags: propsValue.tags,
      emailAddresses: itemsWith({ value: propsValue.emailAddresses, required: 'address' }).map((item) => ({ type: textOf(item['type']), address: String(item['address']) })),
      phoneNumbers: itemsWith({ value: propsValue.phoneNumbers, required: 'number' }).map((item) => ({ type: textOf(item['type']), number: String(item['number']) })),
      addresses: itemsWith({ value: propsValue.addresses }).map((item) => ({
        type: textOf(item['type']),
        street: textOf(item['street']),
        city: textOf(item['city']),
        state: textOf(item['state']),
        country: textOf(item['country']),
        zip: textOf(item['zip']),
      })),
      websites: itemsWith({ value: propsValue.websites, required: 'address' }).map((item) => ({
        type: textOf(item['type']),
        service: textOf(item['service']) ?? 'URL',
        address: String(item['address']),
      })),
      fields: Object.entries(customFields)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([id, value]) => ({ definition: { id: Number(id) }, value })),
    };

    if (type === 'person') {
      params.firstName = textOf(contactFields['firstName']);
      params.lastName = textOf(contactFields['lastName']);
    } else {
      params.name = textOf(contactFields['organisationName']);
    }

    return await capsuleCrmClient.createContact({ auth, params });
  },
});

function textOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function organisationIdOf(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  throw new Error(`Organisation must be a numeric Capsule CRM organisation ID; got "${String(value).slice(0, 50)}".`);
}

function itemsWith({ value, required }: { value: unknown; required?: string }): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && (required === undefined || textOf(item[required]) !== undefined)
  );
}
