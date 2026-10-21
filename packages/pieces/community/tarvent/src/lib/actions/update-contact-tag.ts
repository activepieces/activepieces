import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const updateContactTags = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_tag',
  classification: 'WRITE',
  displayName: 'Add/Remove Contact Tag',
  description: 'Adds or removes tags on a contact.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds tags to, or removes tags from, one Tarvent contact (by audience ID and contact ID). Tags are free text; up to 100 per call. Use to label or unlabel a contact for segmentation. Returns the contact ID, the action and the tags sent. Idempotent: tags behave as a set, so repeating the same call leaves the same tags.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contactTags,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience the contact belongs to.'),
    contactId: tarventCommon.contactId,
    action: Property.StaticDropdown({
      displayName: 'Tag action',
      description: 'Select whether to add or remove tags.',
      required: true,
      defaultValue: 'Add',
      options: {
        options: [
          { label: 'Add', value: 'Add' },
          { label: 'Remove', value: 'Remove' },
        ],
      },
    }),
    tagIds: tarventCommon.tagIds(true, 'Tags to add or remove.'),
  },
  async run(context) {
    const audienceId = tarventCommon.requireText({ value: context.propsValue.audienceId, label: 'Audience' });
    const id = tarventCommon.requireText({ value: context.propsValue.contactId, label: 'Contact ID' });
    const tags = (Array.isArray(context.propsValue.tagIds) ? context.propsValue.tagIds : [])
      .map((tag) => tarventCommon.trimmed(tag))
      .filter((tag): tag is string => tag !== undefined);
    if (tags.length === 0) {
      throw new Error('Enter at least one tag.');
    }
    if (tags.length > 100) {
      throw new Error('Tarvent accepts at most 100 tags per call.');
    }
    const operator = String(context.propsValue.action).toLowerCase() === 'remove' ? 'REMOVE' : 'ADD';
    await tarventClient.booleanMutation({
      auth: context.auth.props,
      operation: 'UpdateContactTags',
      field: 'updateContactTags',
      argDefs: '$input: UpdateContactTagsInput!',
      args: 'input: $input',
      variables: { input: { id, audienceId, operator, tags } },
    });
    return { success: true, contactId: id, action: operator, tags };
  },
});
