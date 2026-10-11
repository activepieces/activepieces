import { Property } from '@activepieces/pieces-framework';
import { ghostProps } from './ai-props';

export const NEWSLETTER_FIELDS = ['name', 'description', 'sender_name', 'sender_reply_to', 'visibility'];

export const newsletterProps = (mode: 'create' | 'update') => ({
  name: Property.ShortText({
    displayName: 'Name',
    description: 'The newsletter name.',
    required: mode === 'create',
  }),
  description: Property.LongText({
    displayName: 'Description',
    description: 'A description shown to members when they choose newsletters.',
    required: false,
  }),
  sender_name: Property.ShortText({
    displayName: 'Sender Name',
    description: 'The From name of the emails. Defaults to the site title.',
    required: false,
  }),
  sender_reply_to: Property.StaticDropdown({
    displayName: 'Reply-To',
    description: 'Where member replies go.',
    required: false,
    options: {
      options: [
        { label: 'Newsletter sender address', value: 'newsletter' },
        { label: 'Support address', value: 'support' },
      ],
    },
  }),
  visibility: Property.StaticDropdown({
    displayName: 'Audience',
    description: 'Who can subscribe to the newsletter.',
    required: false,
    options: {
      options: [
        { label: 'All members', value: 'members' },
        { label: 'Paid members only', value: 'paid' },
      ],
    },
  }),
  subscribe_on_signup: ghostProps.triState(
    'Subscribe on Signup',
    'Automatically subscribe new members to this newsletter.'
  ),
});
