import {
  createAction,
  Property,
  DynamicPropsValue,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth, CapsuleCrmAuthType } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { CreatePartyParams } from '../common/types';

export const createContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new Person or Organisation in Capsule CRM.',
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
      displayName: 'Details',
      required: true,
      refreshers: ['type'],
      props: async ({ auth, type }) => {
        const contactType = type as unknown as string;
        const fields: DynamicPropsValue = {};
        
        if (contactType === 'person') {
          // Fetch organisations data ONCE at the outer level
          let organisationOptions: { label: string; value: number }[] = [];
          
          if (auth) {
            try {
              const organisations = await capsuleCrmClient.searchContacts(
                auth as CapsuleCrmAuthType,
                ''
              );
              
              organisationOptions = organisations
                .filter((party) => party.type === 'organisation')
                .map((org) => ({
                  label: org.name || 'Unnamed Organisation',
                  value: org.id,
                }));
            } catch (error) {
              console.error('Failed to load organisations:', error);
            }
          }
          
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
      displayName: 'Owner',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        const users = await capsuleCrmClient.listUsers(
          auth as CapsuleCrmAuthType
        );
        return {
          options: users.map((user) => ({
            label: user.name,
            value: user.id,
          })),
        };
      },
    }),
    teamId: Property.Dropdown({
      displayName: 'Team',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        const teams = await capsuleCrmClient.listTeams(
          auth as CapsuleCrmAuthType
        );
        return {
          options: teams.map((team) => ({
            label: team.name,
            value: team.id,
          })),
        };
      },
    }),
    tags: Property.MultiSelectDropdown({
      displayName: 'Tags',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        const tags = await capsuleCrmClient.listTags(auth as CapsuleCrmAuthType);
        return {
          options: tags.map((tag) => ({
            label: tag.name,
            value: tag.name,
          })),
        };
      },
    }),
    customFields: Property.DynamicProperties({
      displayName: 'Custom Fields',
      required: true,
      refreshers: [],
      props: async ({ auth }) => {
        const fields: DynamicPropsValue = {};
        if (!auth) return fields;
        const customFields = await capsuleCrmClient.listCustomFields(
          auth as CapsuleCrmAuthType
        );
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

    const type = propsValue.type as 'person' | 'organisation';
    const contactFields = propsValue.contactFields as DynamicPropsValue;
    const contactData: Partial<CreatePartyParams> = {
      type: type,
      title: contactFields['title'] as string | undefined,
      jobTitle: contactFields['jobTitle'] as string | undefined,
      about: propsValue.about,
      organisationId: contactFields['organisationId'] as number | undefined,
      ownerId: propsValue.ownerId,
      teamId: propsValue.teamId,
      tags: propsValue.tags,
      emailAddresses: propsValue.emailAddresses as {
        type?: string;
        address: string;
      }[],
      phoneNumbers: propsValue.phoneNumbers as {
        type?: string;
        number: string;
      }[],
      addresses: propsValue.addresses as {
        type?: string;
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zip?: string;
      }[],
      websites: propsValue.websites as {
        type?: string;
        service: string;
        address: string;
      }[],
    };

    if (type === 'person') {
      contactData.firstName = contactFields['firstName'] as string;
      contactData.lastName = contactFields['lastName'] as string;
    } else if (type === 'organisation') {
      contactData.name = contactFields['organisationName'] as string;
    }

    const customFields = propsValue.customFields as DynamicPropsValue;
    if (customFields) {
      contactData.fields = Object.entries(customFields)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([id, value]) => ({
          definition: { id: Number(id) },
          value: value,
        }));
    }

    return await capsuleCrmClient.createContact(
      auth,
      contactData as CreatePartyParams
    );
  },
});
