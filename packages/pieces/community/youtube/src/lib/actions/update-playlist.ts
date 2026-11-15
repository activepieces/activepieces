import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { updatePlaylistOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

function asSuppliedText(value: string | undefined): string | undefined {
  return value === undefined || value === '' ? undefined : value;
}

export const youtubeUpdatePlaylistAction = createAction({
  auth: youtubeAuth,
  outputSchema: updatePlaylistOutputSchema,
  name: 'update_playlist',
  classification: 'WRITE',
  displayName: 'Update Playlist',
  description:
    'Update the title, description, tags or privacy of an existing playlist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a playlist owned by the authenticated channel via playlists.update, reading the playlist first and merging only the fields you supply so untouched fields survive. Use it to rename or re-describe an existing playlist; use Create Playlist for a new one. The playlist must belong to the connected account, and applying the same values again converges on the same state.',
    idempotent: true,
  },
  props: {
    playlistId: Property.ShortText({
      displayName: 'Playlist ID',
      description:
        'The playlist to update. This is the `list` parameter in a playlist URL (e.g. `PLbpi6ZahtOH6Ar_3GPy3workLYfGa7mGm`).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title. Leave blank to keep the current title.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'New description. Leave blank to keep the current description.',
      required: false,
    }),
    tagsMode: Property.StaticDropdown({
      displayName: 'Tags Update Mode',
      description:
        'How to treat the Tags field. Leave Unchanged keeps the existing tags.',
      required: false,
      defaultValue: 'unchanged',
      options: {
        options: [
          { label: 'Leave unchanged', value: 'unchanged' },
          { label: 'Replace with the tags below', value: 'replace' },
          { label: 'Clear all tags', value: 'clear' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to set when Tags Update Mode is Replace.',
      required: false,
    }),
    privacyStatus: Property.StaticDropdown({
      displayName: 'Privacy Status',
      description: 'New privacy. Leave Unchanged keeps the current value.',
      required: false,
      defaultValue: 'unchanged',
      options: {
        options: [
          { label: 'Leave unchanged', value: 'unchanged' },
          { label: 'Private', value: 'private' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
    defaultLanguage: Property.ShortText({
      displayName: 'Default Language',
      description:
        'BCP-47 language code of the title and description. Leave blank to keep the current value.',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const {
      playlistId,
      title,
      description,
      tagsMode,
      tags,
      privacyStatus,
      defaultLanguage,
    } = context.propsValue;

    const existing = await youtubeClient.sendRequest<PlaylistListResponse>({
      accessToken,
      method: HttpMethod.GET,
      path: '/playlists',
      operation: 'Update Playlist (reading the current playlist)',
      queryParams: { part: 'snippet,status', id: playlistId },
    });

    const current = existing.items?.[0];
    if (!current) {
      throw new Error(
        `Playlist "${playlistId}" was not found or is not owned by the connected YouTube account.`
      );
    }

    const mergedTitle = asSuppliedText(title) ?? current.snippet?.title;
    if (!mergedTitle) {
      throw new Error(
        'YouTube requires a playlist title. Provide a Title because the existing playlist has none.'
      );
    }

    const snippet: PlaylistSnippetPayload = { title: mergedTitle };

    const mergedDescription =
      asSuppliedText(description) ?? current.snippet?.description;
    if (mergedDescription !== undefined) {
      snippet.description = mergedDescription;
    }

    const mergedLanguage =
      asSuppliedText(defaultLanguage) ?? current.snippet?.defaultLanguage;
    if (mergedLanguage !== undefined) {
      snippet.defaultLanguage = mergedLanguage;
    }

    if (tagsMode === 'clear') {
      snippet.tags = [];
    } else if (tagsMode === 'replace') {
      snippet.tags = (tags ?? []).map((tag) => String(tag));
    } else if (current.snippet?.tags !== undefined) {
      snippet.tags = current.snippet.tags;
    }

    const mergedPrivacy =
      privacyStatus && privacyStatus !== 'unchanged'
        ? privacyStatus
        : current.status?.privacyStatus;

    const body: PlaylistUpdatePayload = { id: playlistId, snippet };
    if (mergedPrivacy !== undefined) {
      body.status = { privacyStatus: mergedPrivacy };
    }

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.PUT,
      path: '/playlists',
      operation: 'Update Playlist',
      queryParams: { part: 'snippet,status' },
      body,
      ifMatch: current.etag,
    });
  },
});

type PlaylistSnippetPayload = {
  title: string;
  description?: string;
  defaultLanguage?: string;
  tags?: string[];
};

type PlaylistUpdatePayload = {
  id: string;
  snippet: PlaylistSnippetPayload;
  status?: { privacyStatus: string };
};

type PlaylistListResponse = {
  items?: {
    id: string;
    etag?: string;
    snippet?: {
      title?: string;
      description?: string;
      defaultLanguage?: string;
      tags?: string[];
    };
    status?: { privacyStatus?: string };
  }[];
};
