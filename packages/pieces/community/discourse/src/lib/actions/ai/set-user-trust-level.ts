import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseOps } from '../../common/operations';
import { DEFAULT_TRUST_LEVELS } from '../../common/props';
import { discourseSchemas } from '../../common/schemas';

export const setUserTrustLevelAction = createAction({
  auth: discourseAuth,
  name: 'set_user_trust_level',
  classification: 'WRITE',
  displayName: 'Set User Trust Level',
  description: 'Sets the trust level (0 to 4) of a Discourse user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set a Discourse user trust level (0 new, 1 basic, 2 member, 3 regular, 4 leader) by numeric user ID, which changes what they can do on the forum. Needs an admin key. Fails if the level is locked or the user would lose it by automatic rules. Sets an absolute level, so safe to retry.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Numeric user ID.', required: true }),
    level: Property.StaticDropdown({
      displayName: 'Trust Level',
      required: true,
      options: { disabled: false, options: DEFAULT_TRUST_LEVELS },
    }),
  },
  outputSchema: discourseSchemas.trustLevel,
  async run({ auth, propsValue }) {
    return discourseOps.setTrustLevel({ auth: auth.props, userId: propsValue.user_id, level: propsValue.level });
  },
});
