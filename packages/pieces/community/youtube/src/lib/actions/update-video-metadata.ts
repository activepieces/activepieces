import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { updateVideoMetadataOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

const unchangedBooleanOptions = {
  options: [
    { label: 'Leave unchanged', value: 'unchanged' },
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
};

function resolveTriState({
  selection,
  current,
}: {
  selection: string | undefined;
  current: boolean | undefined;
}): boolean | undefined {
  if (selection === 'yes') {
    return true;
  }
  if (selection === 'no') {
    return false;
  }
  return current;
}

function asSuppliedText(value: string | undefined): string | undefined {
  return value === undefined || value === '' ? undefined : value;
}

function isChosen(selection: string | undefined): boolean {
  return selection !== undefined && selection !== 'unchanged';
}

export const youtubeUpdateVideoMetadataAction = createAction({
  auth: youtubeAuth,
  outputSchema: updateVideoMetadataOutputSchema,
  name: 'update_video_metadata',
  classification: 'WRITE',
  displayName: 'Update Video Metadata',
  description:
    'Update the title, description, tags, category or status of a video you own.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates metadata on a video owned by the authenticated channel via videos.update, reading the video first and merging only the fields you supply so untouched fields survive. Use it to retitle, re-describe, re-tag or re-categorise an upload; use Rate Video for likes and Set Comment Moderation Status for comments. The video must belong to the connected account, and applying the same values again converges on the same state.',
    idempotent: true,
  },
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The `v` parameter in a YouTube URL (e.g. `dQw4w9WgXcQ`).',
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
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description:
        'New video category ID (for example: 10 for Music). Leave blank to keep the current category.',
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
    defaultLanguage: Property.ShortText({
      displayName: 'Default Language',
      description:
        'BCP-47 language code of the title and description. Leave blank to keep the current value.',
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
    license: Property.StaticDropdown({
      displayName: 'License',
      description: 'New license. Leave Unchanged keeps the current value.',
      required: false,
      defaultValue: 'unchanged',
      options: {
        options: [
          { label: 'Leave unchanged', value: 'unchanged' },
          { label: 'Standard YouTube License', value: 'youtube' },
          { label: 'Creative Commons', value: 'creativeCommon' },
        ],
      },
    }),
    embeddable: Property.StaticDropdown({
      displayName: 'Embeddable',
      description:
        'Whether the video can be embedded on other sites. Leave Unchanged keeps the current value.',
      required: false,
      defaultValue: 'unchanged',
      options: unchangedBooleanOptions,
    }),
    publicStatsViewable: Property.StaticDropdown({
      displayName: 'Public Stats Viewable',
      description:
        'Whether the video statistics are publicly visible. Leave Unchanged keeps the current value.',
      required: false,
      defaultValue: 'unchanged',
      options: unchangedBooleanOptions,
    }),
    madeForKids: Property.StaticDropdown({
      displayName: 'Made For Kids',
      description:
        'Self-declaration that the video is made for kids. Leave Unchanged keeps the current value.',
      required: false,
      defaultValue: 'unchanged',
      options: unchangedBooleanOptions,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const {
      videoId,
      title,
      description,
      categoryId,
      tagsMode,
      tags,
      defaultLanguage,
      privacyStatus,
      license,
      embeddable,
      publicStatsViewable,
      madeForKids,
    } = context.propsValue;

    const snippetTouched =
      asSuppliedText(title) !== undefined ||
      asSuppliedText(description) !== undefined ||
      asSuppliedText(categoryId) !== undefined ||
      asSuppliedText(defaultLanguage) !== undefined ||
      isChosen(tagsMode);

    const statusTouched =
      isChosen(privacyStatus) ||
      isChosen(license) ||
      isChosen(embeddable) ||
      isChosen(publicStatsViewable) ||
      isChosen(madeForKids);

    if (!snippetTouched && !statusTouched) {
      throw new Error(
        'Nothing to update. Supply at least one field to change on the video.'
      );
    }

    const existing = await youtubeClient.sendRequest<VideoListResponse>({
      accessToken,
      method: HttpMethod.GET,
      path: '/videos',
      operation: 'Update Video Metadata (reading the current video)',
      queryParams: { part: 'snippet,status', id: videoId },
    });

    const current = existing.items?.[0];
    if (!current) {
      throw new Error(
        `Video "${videoId}" was not found or is not owned by the connected YouTube account.`
      );
    }

    const parts: string[] = [];
    const body: VideoUpdatePayload = { id: videoId };

    if (snippetTouched) {
      const mergedTitle = asSuppliedText(title) ?? current.snippet?.title;
      const mergedCategoryId =
        asSuppliedText(categoryId) ?? current.snippet?.categoryId;

      if (!mergedTitle) {
        throw new Error(
          'YouTube requires a video title on every update. Provide a Title because the existing video has none.'
        );
      }
      if (!mergedCategoryId) {
        throw new Error(
          'YouTube requires a category ID on every update. Provide a Category ID because the existing video has none.'
        );
      }

      const snippet: VideoSnippetPayload = {
        title: mergedTitle,
        categoryId: mergedCategoryId,
      };

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

      body.snippet = snippet;
      parts.push('snippet');
    }

    if (statusTouched) {
      const status: VideoStatusPayload = {};

      const mergedPrivacy = isChosen(privacyStatus)
        ? privacyStatus
        : current.status?.privacyStatus;
      if (mergedPrivacy !== undefined) {
        status.privacyStatus = mergedPrivacy;
      }

      const mergedLicense = isChosen(license)
        ? license
        : current.status?.license;
      if (mergedLicense !== undefined) {
        status.license = mergedLicense;
      }

      const mergedEmbeddable = resolveTriState({
        selection: embeddable,
        current: current.status?.embeddable,
      });
      if (mergedEmbeddable !== undefined) {
        status.embeddable = mergedEmbeddable;
      }

      const mergedPublicStatsViewable = resolveTriState({
        selection: publicStatsViewable,
        current: current.status?.publicStatsViewable,
      });
      if (mergedPublicStatsViewable !== undefined) {
        status.publicStatsViewable = mergedPublicStatsViewable;
      }

      const mergedMadeForKids = resolveTriState({
        selection: madeForKids,
        current: current.status?.selfDeclaredMadeForKids,
      });
      if (mergedMadeForKids !== undefined) {
        status.selfDeclaredMadeForKids = mergedMadeForKids;
      }

      if (
        current.status?.publishAt !== undefined &&
        status.privacyStatus === 'private'
      ) {
        status.publishAt = current.status.publishAt;
      }

      if (current.status?.containsSyntheticMedia !== undefined) {
        status.containsSyntheticMedia = current.status.containsSyntheticMedia;
      }

      body.status = status;
      parts.push('status');
    }

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.PUT,
      path: '/videos',
      operation: 'Update Video Metadata',
      queryParams: { part: parts.join(',') },
      body,
    });
  },
});

type VideoSnippetPayload = {
  title: string;
  categoryId: string;
  description?: string;
  defaultLanguage?: string;
  tags?: string[];
};

type VideoUpdatePayload = {
  id: string;
  snippet?: VideoSnippetPayload;
  status?: VideoStatusPayload;
};

type VideoStatusPayload = {
  privacyStatus?: string;
  license?: string;
  embeddable?: boolean;
  publicStatsViewable?: boolean;
  selfDeclaredMadeForKids?: boolean;
  publishAt?: string;
  containsSyntheticMedia?: boolean;
};

type VideoListResponse = {
  items?: {
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      categoryId?: string;
      defaultLanguage?: string;
      tags?: string[];
    };
    status?: {
      privacyStatus?: string;
      license?: string;
      embeddable?: boolean;
      publicStatsViewable?: boolean;
      selfDeclaredMadeForKids?: boolean;
      publishAt?: string;
      containsSyntheticMedia?: boolean;
    };
  }[];
};
