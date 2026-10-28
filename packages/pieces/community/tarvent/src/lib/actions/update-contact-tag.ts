import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const updateContactTags = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_tag',
  classification: 'WRITE',
  displayName: 'Add/Remove Contact Tag',
  description: 'Adds or removes tags on a contact.',
  audience: 'human',
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
    return tarventOperations.setContactTags({ auth: context.auth.props, audienceId: context.propsValue.audienceId, contactId: context.propsValue.contactId, tags: context.propsValue.tagIds, remove: String(context.propsValue.action).toLowerCase() === 'remove' });
  },
});
