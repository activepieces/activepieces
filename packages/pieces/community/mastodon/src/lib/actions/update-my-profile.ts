import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import {
  MastodonEntity,
  mastodonClient,
  mastodonProps,
  mastodonUtils,
} from '../common/client';
import { myAccountOutputSchema } from '../output-schemas';

export const updateMyProfile = createAction({
  auth: mastodonAuth,
  name: 'update_my_profile',
  classification: 'WRITE',
  displayName: 'Update My Profile',
  description: 'Update the display name, bio and settings of the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates the connected account\'s public profile and posting defaults; only the fields you set change, the rest stay as they are. Profile metadata fields, avatar and header are not handled here. Changes are visible to everyone who views the profile. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: myAccountOutputSchema,
  props: {
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'New display name shown on the profile. Leave empty to keep the current display name.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Bio',
      description: 'New profile bio text. Leave empty to keep the current bio.',
      required: false,
    }),
    locked: mastodonProps.optionalBoolean({
      displayName: 'Require Follow Approval',
      description: 'Whether new followers must be approved manually. Leave empty to keep the current setting.',
    }),
    bot: mastodonProps.optionalBoolean({
      displayName: 'Bot Account',
      description: 'Whether the profile is flagged as an automated (bot) account. Leave empty to keep the current setting.',
    }),
    discoverable: mastodonProps.optionalBoolean({
      displayName: 'Discoverable',
      description: 'Whether the account is featured in the profile directory. Leave empty to keep the current setting.',
    }),
    default_visibility: Property.StaticDropdown({
      displayName: 'Default Post Visibility',
      description: 'Default privacy for new posts. Leave empty to keep the current setting.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Followers only', value: 'private' },
        ],
      },
    }),
    default_language: Property.ShortText({
      displayName: 'Default Post Language',
      description: 'Default ISO 639-1 language code for new posts, for example en.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const source = {
      ...(mastodonUtils.hasValue(props.default_visibility)
        ? { privacy: props.default_visibility }
        : {}),
      ...(mastodonUtils.hasValue(props.default_language)
        ? { language: props.default_language }
        : {}),
    };
    const body = {
      ...(mastodonUtils.hasValue(props.display_name) ? { display_name: props.display_name } : {}),
      ...(mastodonUtils.hasValue(props.note) ? { note: props.note } : {}),
      ...(props.locked !== undefined ? { locked: props.locked } : {}),
      ...(props.bot !== undefined ? { bot: props.bot } : {}),
      ...(props.discoverable !== undefined ? { discoverable: props.discoverable } : {}),
      ...(Object.keys(source).length > 0 ? { source } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one profile field to update.');
    }
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.PATCH,
      path: '/api/v1/accounts/update_credentials',
      operation: 'Update My Profile',
      scope: 'write:accounts',
      body,
    });
  },
});
