import { tarventAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, tarventCommon } from '../common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const createContact = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_contact',
  displayName: 'Create/Update Contact',
  description: 'This action is used to create or update a contact in an audience.',
  props: {
    audienceId: tarventCommon.audienceId(true, ''),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Enter the contacts email. NOTE: If the audience uses a custom contact identifier and overwrite is enabled, then this will update the FIRST contact that matches the email.',
      required: true,
      defaultValue: ''
    }),
    updateAction: Property.StaticDropdown({
      displayName: 'Update existing contact',
      description: 'Update the contact\'s profile if it already exists. Otherwise, return the "Duplicate" error.',
      required: true,
      options: {
        options: [
          {
            label: 'Update',

            value: 'Update',
          },
          {
            label: 'Return duplicate error',
            value: 'ReturnError',
          },
        ],
      },
    }),
    groupAction: Property.StaticDropdown({
      displayName: 'Replace existing groups',
      description: 'Select whether to replace or only add to contact groups. NOTE: Add only will only add the contact to the groups they are not already in. Replace will remove the contact from all existing groups and add them to the selected groups.',
      required: false,
      options: {
        options: [
          {
            label: 'Replace',

            value: 'Replace',
          },
          {
            label: 'Add only',
            value: 'Add',
          },
        ],
      },
    }),
    groupIds: tarventCommon.audienceGroupIds(false, ''),
    tagAction: Property.StaticDropdown({
      displayName: 'Replace existing tags',
      description: 'Select whether to replace or only add to contact tags of an existing contact. NOTE: Add only will only add the tags the contact does not already have. Replace will replace all contact tags with the entered tags.',
      required: false,
      options: {
        options: [
          {
            label: 'Replace',

            value: 'Replace',
          },
          {
            label: 'Add only',
            value: 'Add',
          },
        ],
      },
    }),
    tagIds: tarventCommon.tagIds(false, `Select which tags you would like to add to the contact.`),
    firstName: Property.ShortText({
      displayName: 'First name',
      description: 'The contacts first name.',
      required: false,
      defaultValue: ''
    }),
    lastName: Property.ShortText({
      displayName: 'Last name',
      description: 'The contacts last name.',
      required: false,
      defaultValue: ''
    }),
    streetAddress: Property.ShortText({
      displayName: 'Street address',
      description: '',
      required: false,
      defaultValue: ''
    }),
    streetAddress2: Property.ShortText({
      displayName: 'Street address 2',
      description: '',
      required: false,
      defaultValue: ''
    }),
    addressLocality: Property.ShortText({
      displayName: 'City (Locality)',
      description: '',
      required: false,
      defaultValue: ''
    }),
    addressRegion: Property.ShortText({
      displayName: 'State (Region)',
      description: '',
      required: false,
      defaultValue: ''
    }),
    postalCode: Property.ShortText({
      displayName: 'Zip code (Postal code)',
      description: '',
      required: false,
      defaultValue: ''
    }),
    addressCountry: Property.ShortText({
      displayName: 'Country',
      description: '',
      required: false,
      defaultValue: ''
    }),
    audienceDataFields: tarventCommon.audienceDataFields
  },
  async run(context) {
    const { audienceId, email, updateAction, groupAction, groupIds, tagAction, tagIds, firstName, lastName,
      streetAddress, streetAddress2, addressLocality, addressRegion, postalCode, addressCountry, audienceDataFields } = context.propsValue;

    await propsValidation.validateZod(context.propsValue, {
      email: z.string().max(100, 'Email has to be equal to or less than 100 characters.'),
      firstName: z.string().max(100, 'First name has to be equal to or less than 100 characters.').optional(),
      lastName: z.string().max(100, 'Last name has to be equal to or less than 100 characters.').optional(),
      streetAddress: z.string().max(100, 'Street address has to be equal to or less than 100 characters.').optional(),
      streetAddress2: z.string().max(100, 'Street address 2 has to be equal to or less than 100 characters.').optional(),
      addressLocality: z.string().max(100, 'City (Locality) has to be equal to or less than 100 characters.').optional(),
      addressRegion: z.string().max(100, 'State (Region) has to be equal to or less than 100 characters.').optional(),
      postalCode: z.string().max(15, 'Zip code (Postal code) has to be equal to or less than 15 characters.').optional(),
      addressCountry: z.string().max(100, 'Country has to be equal to or less than 100 characters.').optional(),
    });

    const client = makeClient(context.auth);
    return await client.createContact(audienceId, email, updateAction, groupAction, tagAction, tagIds, groupIds, firstName, lastName, streetAddress, streetAddress2, addressLocality, addressRegion, postalCode, addressCountry,
      audienceDataFields);
  },
});
