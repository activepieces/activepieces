import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const createAudienceGroup = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_audience_group',
  classification: 'WRITE',
  displayName: 'Create An Audience Group',
  description: 'Creates an audience group in the selected audience.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new static group in a Tarvent audience (name up to 100 characters, optional description up to 255), optionally public so it appears as a question on forms. Use to set up a segment before assigning contacts. Returns the new group with its ID. Not idempotent: each call creates another group, even with the same name.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.audienceGroup,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience to create the group in.'),
    name: tarventCommon.name('Group name', true, 'Enter the group name. (100 character limit)'),
    description: tarventCommon.name('Group description', false, 'What the group is for (255 character limit). If the group is public this description shows in forms that have the groups question.'),
    isPublic: Property.StaticDropdown({
      displayName: 'Public group',
      description: 'Public groups are shown in forms with the groups question.',
      required: true,
      defaultValue: 'false',
      options: {
        options: [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    return tarventOperations.createAudienceGroup({ auth: context.auth.props, audienceId: context.propsValue.audienceId, name: context.propsValue.name, description: context.propsValue.description, isPublic: String(context.propsValue.isPublic) === 'true' });
  },
});
