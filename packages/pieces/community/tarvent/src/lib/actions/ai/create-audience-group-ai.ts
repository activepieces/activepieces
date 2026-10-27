import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const createAudienceGroupAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_audience_group_ai',
  classification: 'WRITE',
  displayName: 'Create Audience Group (AI)',
  description: 'Creates a static group in an audience.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a static group in a Tarvent audience: audience ID, name (up to 100 characters), optional description (up to 255) and whether it is public (shown on forms). Returns the group with its ID. Not idempotent: each call creates another group, so check Find Audience Groups first.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.audienceGroup,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID (from Find Audience).', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Group name (100 character limit).', required: true }),
    description: Property.ShortText({ displayName: 'Description', description: 'What the group is for (255 character limit).', required: false }),
    isPublic: Property.Checkbox({ displayName: 'Public', description: 'Show the group on forms with the groups question.', required: false, defaultValue: false }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.createAudienceGroup({ auth: context.auth.props, audienceId: p.audienceId, name: p.name, description: p.description, isPublic: p.isPublic === true });
  },
});
