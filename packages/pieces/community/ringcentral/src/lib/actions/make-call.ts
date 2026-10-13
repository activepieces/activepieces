import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ringcentralAuth } from '../common/auth';
import { ringcentralCommon } from '../common/client';

export const makeCall = createAction({
  auth: ringcentralAuth,
  name: 'make_call',
  displayName: 'Make Call (RingOut)',
  description:
    'Start a two-legged RingOut call: RingCentral calls the "from" number first, then connects it to the "to" number.',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description:
        'The number RingCentral calls first, in E.164 format (e.g. +14155550100). Usually one of your RingCentral numbers.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The number to connect the call to, in E.164 format (e.g. +14155550123).',
      required: true,
    }),
    callerId: Property.ShortText({
      displayName: 'Caller ID',
      description:
        'Optional number shown to the callee, in E.164 format. Must be one of your RingCentral numbers.',
      required: false,
    }),
    playPrompt: Property.Checkbox({
      displayName: 'Play Prompt',
      description: 'Play a "please hold" prompt to the "from" party before connecting the call.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { from, to, callerId, playPrompt } = context.propsValue;

    return await ringcentralCommon.sendRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      resourcePath: '/restapi/v1.0/account/~/extension/~/ring-out',
      body: {
        from: { phoneNumber: from },
        to: { phoneNumber: to },
        ...(callerId ? { callerId: { phoneNumber: callerId } } : {}),
        playPrompt: playPrompt ?? false,
      },
    });
  },
});
