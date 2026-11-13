import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const setContactTagsAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_set_contact_tags_ai',
  classification: 'WRITE',
  displayName: 'Add or Remove Contact Tags (AI)',
  description: 'Adds or removes tags on a contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds tags to, or removes tags from, one Tarvent contact. Give the audience ID, contact ID, the tag names (1-100, free text) and action ADD or REMOVE. Existing tags not listed are kept. Idempotent: tags behave as a set.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contactTags,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID (from Find Audience).', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'The Tarvent contact ID (from Find Contact or List Contacts).', required: true }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tag names to add or remove.', required: true }),
    action: Property.StaticDropdown({ displayName: 'Action', description: 'ADD or REMOVE the tags.', required: true, options: { options: [{ label: 'Add', value: 'ADD' }, { label: 'Remove', value: 'REMOVE' }] } }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.setContactTags({ auth: context.auth.props, audienceId: p.audienceId, contactId: p.contactId, tags: p.tags, remove: p.action === 'REMOVE' });
  },
});
