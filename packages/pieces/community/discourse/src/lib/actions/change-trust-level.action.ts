import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseOps } from '../common/operations';
import { discourseProps } from '../common/props';
import { discourseSchemas } from '../common/schemas';

export const changeUserTrustLevel = createAction({
  auth: discourseAuth,
  name: 'change_user_trust_level',
  classification: 'WRITE',
  description: 'Change the trust level of a user (needs an admin API key)',
  audience: 'human',
  aiMetadata: {
    description:
      'Set a Discourse user to a trust level picked from a dropdown, by numeric user ID. Agents should use Set User Trust Level. Sets an absolute level, so repeating the call leaves the user unchanged.',
    idempotent: true,
  },
  displayName: 'Change User Trust Level',
  props: {
    user_id: Property.ShortText({
      description: 'Numeric ID of the user',
      displayName: 'User ID',
      required: true,
    }),
    new_trust_level: discourseProps.trustLevelDropdown(),
  },
  outputSchema: discourseSchemas.trustLevel,
  async run({ auth, propsValue }) {
    return discourseOps.setTrustLevel({
      auth: auth.props,
      userId: propsValue.user_id,
      level: propsValue.new_trust_level,
    });
  },
});
