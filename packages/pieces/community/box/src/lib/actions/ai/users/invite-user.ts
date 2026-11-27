import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const BOOLEANS = ['true', 'false'];

export const inviteUserAction = createAction({
  auth: boxAuth,
  name: 'box_invite_user',
  displayName: 'Invite User',
  description: 'Invites an existing Box user to join the enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails an invitation to join the enterprise to a person who already has a Box account outside any enterprise, and returns the invite ID for Get Invite. Needs admin rights and the "Manage An Enterprise" scope; the enterprise ID is in Get Current User with fields "enterprise". Use Create User to make a new account instead.',
    idempotent: false,
  },
  props: {
    enterpriseId: boxAiProps.enterpriseId({
      required: true,
      description: 'ID of the enterprise to invite into. Get it from Get Current User with Fields "enterprise".',
    }),
    login: Property.ShortText({
      displayName: 'Login',
      description: 'Login email of the Box user to invite.',
      required: true,
    }),
    isAutoRollInEnabled: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Auto Roll In',
      description: '"true" to add the user automatically after 14 days without accepting. Only for free users whose email domain belongs to the enterprise; depends on the plan.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.isAutoRollInEnabled !== undefined && !BOOLEANS.includes(propsValue.isAutoRollInEnabled)) {
      throw new Error('Auto Roll In must be "true" or "false".');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/invites',
      query: { fields: propsValue.fields },
      body: {
        enterprise: { id: propsValue.enterpriseId },
        actionable_by: { login: propsValue.login },
        ...(propsValue.isAutoRollInEnabled !== undefined ? { is_auto_roll_in_enabled: propsValue.isAutoRollInEnabled === 'true' } : {}),
      },
    });
  },
});
