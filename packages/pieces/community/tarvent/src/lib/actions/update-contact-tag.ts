import { tarventAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, tarventCommon } from '../common';

export const updateContactTags = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_tag',
  displayName: 'Add/Remove Contact Tag',
  description: 'Adds or removes a tag from contact.',
  audience: 'both',
  aiMetadata: { description: 'Adds or removes one or more tags on a Tarvent contact, with the direction (add vs. remove) chosen by the action input. Use to label or unlabel a contact for segmentation. Idempotent: re-running with the same tags and direction leaves the contact in the same tagged state.', idempotent: true },
  props: {
    audienceId: tarventCommon.audienceId(true, 'If specified, the trigger will only fire if contact is in the selected audience.'),
    contactId: tarventCommon.contactId,
    action: Property.StaticDropdown({
      displayName: 'Tag action',
      description: 'Select whether to add or remove tags.',
      required: true,
      defaultValue: 'Add',
      options: {
        options: [
          {
            label: 'Add',

            value: 'Add',
          },
          {
            label: 'Remove',
            value: 'remove',
          },
        ],
      },
    }),
    tagIds: tarventCommon.tagIds(true, `Enter which tags you would like to add or remove.`),
  },
  async run(context) {
    const { audienceId, contactId, action, tagIds } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.updateContactTags(audienceId, contactId, action, tagIds);
  },
});
