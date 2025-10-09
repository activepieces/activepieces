import {
  createAction,
  Property,
  DynamicPropsValue,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth, CapsuleCrmAuthType } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const updateContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update fields on an existing Person or Organisation.',
  props: {
    contact_id: capsuleCrmProps.contact_id(),
    contactFields: Property.DynamicProperties({
      displayName: 'Details',
      required: true,
      refreshers: ['contact_id'],
      props: async ({ auth, contact_id }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !contact_id) return fields;

        const contact = await capsuleCrmClient.getContact(
          auth as CapsuleCrmAuthType,
          contact_id as unknown as number
        );

        if (contact?.type === 'person') {
          fields['firstName'] = Property.ShortText({
            displayName: 'First Name',
            description: "Update the person's first name.",
            required: false,
          });
          fields['lastName'] = Property.ShortText({
            displayName: 'Last Name',
            description: "Update the person's last name.",
            required: false,
          });
          fields['title'] = Property.ShortText({
            displayName: 'Title',
            description: "Update the person's job title.",
            required: false,
          });
        } else if (contact?.type === 'organisation') {
          fields['organisationName'] = Property.ShortText({
            displayName: 'Organisation Name',
            description: "Update the organisation's name.",
            required: false,
          });
        }
        return fields;
      },
    }),
    ownerId: capsuleCrmProps.owner_id(false),
    teamId: capsuleCrmProps.team_id(false),
    about: Property.LongText({
      displayName: 'About',
      description: 'Update the biography or description for the contact.',
      required: false,
    }),
    addresses: Property.DynamicProperties({
      displayName: 'Addresses',
      required: false,
      refreshers: ['contact_id'],
      props: async ({ auth, contact_id }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !contact_id) return fields;

        const contact = await capsuleCrmClient.getContact(
          auth as CapsuleCrmAuthType,
          contact_id as unknown as number
        );
        const addressOptions =
          contact?.addresses?.map((address) => ({
            label: `${address.street}, ${address.city}`,
            value: address.id,
          })) ?? [];

        fields['addresses'] = Property.Array({
          displayName: 'Addresses',
          required: false,
          properties: {
            id: Property.StaticDropdown({
              displayName: 'Address',
              required: false,
              options: {
                options: addressOptions,
              },
            }),
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
            delete: Property.Checkbox({
              displayName: 'Delete',
              description: 'Check this to delete the address.',
              required: false,
            }),
          },
        });
        return fields;
      },
    }),
    websites: Property.DynamicProperties({
      displayName: 'Websites',
      required: false,
      refreshers: ['contact_id'],
      props: async ({ auth, contact_id }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !contact_id) return fields;

        const contact = await capsuleCrmClient.getContact(
          auth as CapsuleCrmAuthType,
          contact_id as unknown as number
        );
        const websiteOptions =
          contact?.websites?.map((website) => ({
            label: website.address,
            value: website.id,
          })) ?? [];

        fields['websites'] = Property.Array({
          displayName: 'Websites',
          required: false,
          properties: {
            id: Property.StaticDropdown({
              displayName: 'Website',
              required: false,
              options: {
                options: websiteOptions,
              },
            }),
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
              required: false,
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
              required: false,
            }),
            delete: Property.Checkbox({
              displayName: 'Delete',
              description: 'Check this to delete the website.',
              required: false,
            }),
          },
        });
        return fields;
      },
    }),
    emailAddresses: Property.DynamicProperties({
      displayName: 'Email Addresses',
      required: false,
      refreshers: ['contact_id'],
      props: async ({ auth, contact_id }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !contact_id) return fields;

        const contact = await capsuleCrmClient.getContact(
          auth as CapsuleCrmAuthType,
          contact_id as unknown as number
        );
        const emailOptions =
          contact?.emailAddresses?.map((email) => ({
            label: email.address,
            value: email.id,
          })) ?? [];

        fields['emailAddresses'] = Property.Array({
          displayName: 'Email Addresses',
          required: false,
          properties: {
            id: Property.StaticDropdown({
              displayName: 'Email Address',
              required: false,
              options: {
                options: emailOptions,
              },
            }),
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
              required: false,
            }),
            delete: Property.Checkbox({
              displayName: 'Delete',
              description: 'Check this to delete the email.',
              required: false,
            }),
          },
        });
        return fields;
      },
    }),
    phoneNumbers: Property.DynamicProperties({
      displayName: 'Phone Numbers',
      required: false,
      refreshers: ['contact_id'],
      props: async ({ auth, contact_id }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !contact_id) return fields;

        const contact = await capsuleCrmClient.getContact(
          auth as CapsuleCrmAuthType,
          contact_id as unknown as number
        );
        const phoneOptions =
          contact?.phoneNumbers?.map((phone) => ({
            label: phone.number,
            value: phone.id,
          })) ?? [];

        fields['phoneNumbers'] = Property.Array({
          displayName: 'Phone Numbers',
          required: false,
          properties: {
            id: Property.StaticDropdown({
              displayName: 'Phone Number',
              required: false,
              options: {
                options: phoneOptions,
              },
            }),
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
              required: false,
            }),
            delete: Property.Checkbox({
              displayName: 'Delete',
              description: 'Check this to delete the phone number.',
              required: false,
            }),
          },
        });
        return fields;
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const contactId = propsValue.contact_id as number;
    const contactFields = propsValue.contactFields as DynamicPropsValue;

    return await capsuleCrmClient.updateContact(auth, contactId, {
      firstName: contactFields['firstName'] as string | undefined,
      lastName: contactFields['lastName'] as string | undefined,
      name: contactFields['organisationName'] as string | undefined,
      title: contactFields['title'] as string | undefined,
      about: propsValue.about,
      ownerId: propsValue.ownerId,
      teamId: propsValue.teamId,
      addresses: (
        (propsValue.addresses as DynamicPropsValue)?.['addresses'] as any[]
      )?.map((address) => ({
        ...address,
        _delete: address.delete,
      })),
      websites: (
        (propsValue.websites as DynamicPropsValue)?.['websites'] as any[]
      )?.map((website) => ({
        ...website,
        _delete: website.delete,
      })),
      emailAddresses: (
        (propsValue.emailAddresses as DynamicPropsValue)?.[
          'emailAddresses'
        ] as any[]
      )?.map((email) => ({
        ...email,
        _delete: email.delete,
      })),
      phoneNumbers: (
        (propsValue.phoneNumbers as DynamicPropsValue)?.[
          'phoneNumbers'
        ] as any[]
      )?.map((phone) => ({
        ...phone,
        _delete: phone.delete,
      })),
    });
  },
});
