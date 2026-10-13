import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { createPlaylistOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeCreatePlaylistAction = createAction({
  auth: youtubeAuth,
  outputSchema: createPlaylistOutputSchema,
  name: 'create_playlist',
  classification: 'WRITE',
  displayName: 'Create Playlist',
  description: 'Create a new playlist on the authenticated account channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a playlist on the authenticated YouTube channel via playlists.insert and returns its new playlist ID. Use it before Add Video To Playlist; use Update Playlist to change an existing one instead. Every call creates another playlist, so retries duplicate it.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Playlist title, up to 150 characters.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Playlist description, up to 5000 characters.',
      required: false,
    }),
    privacyStatus: Property.StaticDropdown({
      displayName: 'Privacy Status',
      description: 'Who can see the playlist. Defaults to private.',
      required: false,
      defaultValue: 'private',
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
    defaultLanguage: Property.ShortText({
      displayName: 'Default Language',
      description:
        'BCP-47 language code of the title and description (for example: en, es, ja).',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { title, description, privacyStatus, defaultLanguage } =
      context.propsValue;

    const snippet: Record<string, string> = { title };
    if (description) {
      snippet['description'] = description;
    }
    if (defaultLanguage) {
      snippet['defaultLanguage'] = defaultLanguage;
    }

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.POST,
      path: '/playlists',
      operation: 'Create Playlist',
      queryParams: { part: 'snippet,status' },
      body: {
        snippet,
        status: { privacyStatus: privacyStatus ?? 'private' },
      },
    });
  },
});
