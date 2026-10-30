import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest } from '../../common/client';
import { GitlabUserStatus } from '../../common/models';
import { optionalText } from '../../common/props';
import { userStatusOutputSchema } from '../../output-schemas';

export const setUserStatusAction = createAction({
  auth: gitlabAuth,
  name: 'set_user_status',
  displayName: 'Set User Status',
  description:
    'Sets the status of the connected user. Fields left empty keep their current value.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Sets the connected GitLab user's status emoji, message, availability and auto-clear time. Fields you leave empty keep their current value (the action reads the status first and merges); use Clear Message, Clear Emoji or Clear Whole Status to blank them. GitLab shows the speech_balloon emoji when a message has no emoji, and any earlier auto-clear time is removed unless Clear Status After is set again.",
    idempotent: true,
  },
  props: {
    message: Property.ShortText({
      displayName: 'Message',
      description: 'Up to 100 characters.',
      required: false,
    }),
    clearMessage: Property.Checkbox({
      displayName: 'Clear Message',
      required: false,
      defaultValue: false,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description: 'Emoji name without colons, e.g. coffee or palm_tree.',
      required: false,
    }),
    clearEmoji: Property.Checkbox({
      displayName: 'Clear Emoji',
      required: false,
      defaultValue: false,
    }),
    availability: Property.StaticDropdown({
      displayName: 'Availability',
      required: false,
      options: {
        options: [
          { label: 'Busy', value: 'busy' },
          { label: 'Not set', value: 'not_set' },
        ],
      },
    }),
    clearStatusAfter: Property.StaticDropdown({
      displayName: 'Clear Status After',
      required: false,
      options: {
        options: [
          { label: '30 minutes', value: '30_minutes' },
          { label: '3 hours', value: '3_hours' },
          { label: '8 hours', value: '8_hours' },
          { label: '1 day', value: '1_day' },
          { label: '3 days', value: '3_days' },
          { label: '7 days', value: '7_days' },
          { label: '30 days', value: '30_days' },
        ],
      },
    }),
    clearAll: Property.Checkbox({
      displayName: 'Clear Whole Status',
      description:
        'Removes message, emoji and availability. Other fields are ignored.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: userStatusOutputSchema,
  async run({ auth, propsValue }) {
    if (propsValue.clearAll === true) {
      await gitlabRequest({
        auth,
        method: 'PUT',
        path: '/user/status',
        body: { emoji: '', message: '', availability: 'not_set' },
      });
      return gitlabRequest({ auth, method: 'GET', path: '/user/status' });
    }
    const message = optionalText(propsValue.message);
    if (message !== undefined && message.length > 100) {
      throw new Error('Message can be at most 100 characters.');
    }
    const emoji = optionalText(propsValue.emoji)?.replace(/^:|:$/g, '');
    const current = await gitlabRequest<GitlabUserStatus>({
      auth,
      method: 'GET',
      path: '/user/status',
    });
    const body: Record<string, unknown> = {
      message:
        propsValue.clearMessage === true
          ? ''
          : message ?? current?.message ?? '',
      emoji:
        propsValue.clearEmoji === true ? '' : emoji ?? current?.emoji ?? '',
      availability:
        propsValue.availability ?? current?.availability ?? 'not_set',
    };
    if (propsValue.clearStatusAfter) {
      body['clear_status_after'] = propsValue.clearStatusAfter;
    }
    return gitlabRequest({ auth, method: 'PUT', path: '/user/status', body });
  },
});
