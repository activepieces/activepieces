import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const createContact = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_contact',
  classification: 'WRITE',
  displayName: 'Create/Update Contact',
  description: 'Creates a contact in an audience, or updates it if the email already exists.',
  audience: 'human',
  aiMetadata: {
    description:
      'Upserts a contact into a Tarvent audience by email: creates it, or (when Update existing contact is "Update") updates the existing contact with that email; with "Return duplicate error" an existing email fails the step. Group and tag assignments either replace or add to the current ones. Use this to add a subscriber or to set profile fields by email; to change a known contact by ID (for example its email address) use Update Contact. Empty text fields are not sent, so they never blank existing values. Returns the full contact record including its ID. Not idempotent: in add-only mode repeated calls keep adding groups and tags.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.contact,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience to add the contact to.'),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The contact\'s email. NOTE: If the audience uses a custom contact identifier and overwrite is enabled, then this will update the FIRST contact that matches the email.',
      required: true,
    }),
    updateAction: Property.StaticDropdown({
      displayName: 'Update existing contact',
      description: 'Update the contact\'s profile if it already exists. Otherwise, return the "Duplicate" error.',
      required: true,
      defaultValue: 'Update',
      options: {
        options: [
          { label: 'Update', value: 'Update' },
          { label: 'Return duplicate error', value: 'ReturnError' },
        ],
      },
    }),
    groupAction: Property.StaticDropdown({
      displayName: 'Replace existing groups',
      description: 'Add only adds the contact to the selected groups they are not already in. Replace removes the contact from all existing groups and adds them to the selected groups.',
      required: false,
      options: {
        options: [
          { label: 'Replace', value: 'Replace' },
          { label: 'Add only', value: 'Add' },
        ],
      },
    }),
    groupIds: tarventCommon.audienceGroupIds(false, 'Groups to put the contact in.'),
    tagAction: Property.StaticDropdown({
      displayName: 'Replace existing tags',
      description: 'Add only adds the tags the contact does not already have. Replace replaces all contact tags with the entered tags.',
      required: false,
      options: {
        options: [
          { label: 'Replace', value: 'Replace' },
          { label: 'Add only', value: 'Add' },
        ],
      },
    }),
    tagIds: tarventCommon.tagIds(false, 'Tags to add to the contact.'),
    firstName: Property.ShortText({ displayName: 'First name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last name', required: false }),
    streetAddress: Property.ShortText({ displayName: 'Street address', required: false }),
    streetAddress2: Property.ShortText({ displayName: 'Street address 2', required: false }),
    addressLocality: Property.ShortText({ displayName: 'City (Locality)', required: false }),
    addressRegion: Property.ShortText({ displayName: 'State (Region)', required: false }),
    postalCode: Property.ShortText({ displayName: 'Zip code (Postal code)', required: false }),
    addressCountry: Property.ShortText({ displayName: 'Country', required: false }),
    audienceDataFields: tarventCommon.audienceDataFields,
  },
  async run(context) {
    const p = context.propsValue;
    const audienceId = tarventCommon.requireText({ value: p.audienceId, label: 'Audience' });
    const email = tarventCommon.requireText({ value: p.email, label: 'Email' });
    const text = contactTextFields(p);
    tarventCommon.checkLength({ value: email, label: 'Email', max: 320 });
    for (const [key, value] of Object.entries(text)) {
      tarventCommon.checkLength({ value, label: key, max: key === 'postalCode' ? 15 : 100 });
    }
    const tags = Array.isArray(p.tagIds) ? p.tagIds.map(String) : undefined;
    const groupIds = Array.isArray(p.groupIds) ? p.groupIds.map(String) : undefined;
    const profile = tarventCommon.profileFromDataFields(p.audienceDataFields);
    return tarventClient.createContact({
      auth: context.auth.props,
      input: {
        ...text,
        email,
        audienceId,
        updateExisting: p.updateAction !== 'ReturnError',
        audienceGroupManagementType: p.groupAction === 'Replace' ? 'REPLACE_EXISTING' : 'ADD_NEW_GROUPS_ONLY',
        tagManagementType: p.tagAction === 'Replace' ? 'REPLACE_EXISTING' : 'ADD_NEW_TAGS_ONLY',
        ...(profile.length > 0 ? { profile } : {}),
        ...(tags && (tags.length > 0 || p.tagAction === 'Replace') ? { tags } : {}),
        ...(groupIds && (groupIds.length > 0 || p.groupAction === 'Replace') ? { groupIds } : {}),
        sendFormat: 'MULTIPART',
      },
    });
  },
});

function contactTextFields(p: Record<string, unknown>): Record<string, string> {
  const keys = ['firstName', 'lastName', 'streetAddress', 'streetAddress2', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'];
  return Object.fromEntries(keys.flatMap((key) => {
    const value = tarventCommon.trimmed(p[key]);
    return value === undefined ? [] : [[key, value]];
  }));
}
