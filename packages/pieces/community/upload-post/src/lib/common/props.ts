import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { uploadPostAuth } from '../auth';
import { uploadPostClient } from './client';

async function fetchProfiles(apiKey: string): Promise<UploadPostProfile[]> {
  const response = await uploadPostClient.request<ListProfilesResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: '/uploadposts/users',
  });
  return response.body.profiles ?? [];
}

function connectedPlatforms(profile: UploadPostProfile): string[] {
  return Object.entries(profile.social_accounts ?? {})
    .filter(([, account]) => typeof account === 'object' && account !== null)
    .map(([platform]) => platform);
}

function pageDropdown({
  displayName,
  description,
  path,
  listKey,
}: {
  displayName: string;
  description: string;
  path: string;
  listKey: 'pages' | 'boards';
}) {
  return Property.Dropdown({
    auth: uploadPostAuth,
    displayName,
    description,
    required: false,
    refreshers: ['profile'],
    options: async ({ auth, profile }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Upload-Post account first',
        };
      }
      if (!profile) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a profile first',
        };
      }
      try {
        const response = await uploadPostClient.request<PagesResponse>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          path,
          queryParams: { profile: String(profile) },
        });
        const items = response.body[listKey] ?? [];
        return {
          disabled: false,
          options: items.map((item) => ({
            label: item.name ?? item.id,
            value: item.id,
          })),
          placeholder:
            items.length === 0 ? 'No items found for this profile' : undefined,
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'This profile has no connected account for this platform',
        };
      }
    },
  });
}

function platformsProperty({
  options,
  description,
}: {
  options: { label: string; value: string }[];
  description: string;
}) {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Platforms',
    description,
    required: true,
    options: { options },
  });
}

function publishingProps({
  titleDisplayName,
  titleDescription,
  titleRequired,
}: {
  titleDisplayName: string;
  titleDescription: string;
  titleRequired: boolean;
}) {
  return {
    title: Property.LongText({
      displayName: titleDisplayName,
      description: titleDescription,
      required: titleRequired,
    }),
    scheduled_date: Property.DateTime({
      displayName: 'Schedule For',
      description:
        'Publish at this date and time instead of now (up to 365 days ahead). Leave empty to publish immediately. Cannot be combined with "Add to Queue".',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description:
        'IANA timezone used to interpret "Schedule For", e.g. `Europe/Madrid` or `America/New_York`. Defaults to UTC.',
      required: false,
    }),
    add_to_queue: Property.Checkbox({
      displayName: 'Add to Queue',
      description:
        'Schedule the post in the next free slot of the profile\'s posting queue (configured in the Upload-Post dashboard). Cannot be combined with "Schedule For".',
      required: false,
      defaultValue: false,
    }),
    async_upload: Property.Checkbox({
      displayName: 'Process in Background',
      description:
        'Return immediately with a request ID instead of waiting for every platform to finish, and check the result later with "Get Upload Status". Turn it off to wait for the per-platform results in this step.',
      required: false,
      defaultValue: true,
    }),
    first_comment: Property.LongText({
      displayName: 'First Comment',
      description:
        'Optional comment posted automatically right after publishing, on platforms that support it.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description:
        'Your own identifier for this post (max 255 characters). It is echoed back by "Get Upload Status" and "Get Upload History" so you can match the post to a record in your system.',
      required: false,
    }),
    facebook_page_id: pageDropdown({
      displayName: 'Facebook Page',
      description:
        'The Facebook Page to post to. Needed when Facebook is selected and the profile has more than one Page connected.',
      path: '/uploadposts/facebook/pages',
      listKey: 'pages',
    }),
    target_linkedin_page_id: pageDropdown({
      displayName: 'LinkedIn Company Page',
      description:
        'Post to this LinkedIn company page. Leave empty to post to the personal LinkedIn profile.',
      path: '/uploadposts/linkedin/pages',
      listKey: 'pages',
    }),
  };
}

function pinterestBoardProperty() {
  return pageDropdown({
    displayName: 'Pinterest Board',
    description: 'The board to pin to. Required when Pinterest is selected.',
    path: '/uploadposts/pinterest/boards',
    listKey: 'boards',
  });
}

function buildUploadForm({
  profile,
  platforms,
  fields,
}: {
  profile: string;
  platforms: string[];
  fields: Record<string, string | boolean | undefined | null>;
}): FormData {
  const form = new FormData();
  form.append('user', profile);
  for (const platform of platforms) {
    form.append('platform[]', platform);
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    form.append(key, typeof value === 'boolean' ? String(value) : value);
  }
  return form;
}

function commonUploadFields(propsValue: {
  title?: string;
  description?: string;
  scheduled_date?: string;
  timezone?: string;
  add_to_queue?: boolean;
  async_upload?: boolean;
  first_comment?: string;
  external_id?: string;
  facebook_page_id?: unknown;
  target_linkedin_page_id?: unknown;
}): Record<string, string | boolean | undefined> {
  if (propsValue.scheduled_date && propsValue.add_to_queue) {
    throw new Error(
      '"Schedule For" and "Add to Queue" cannot be used together. Pick one.',
    );
  }
  return {
    title: propsValue.title,
    description: propsValue.description,
    scheduled_date: propsValue.scheduled_date,
    timezone: propsValue.timezone,
    add_to_queue: propsValue.add_to_queue ? true : undefined,
    async_upload: propsValue.async_upload ? true : undefined,
    first_comment: propsValue.first_comment,
    external_id: propsValue.external_id,
    facebook_page_id: optionalString(propsValue.facebook_page_id),
    target_linkedin_page_id: optionalString(propsValue.target_linkedin_page_id),
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export const profileDropdown = Property.Dropdown({
  auth: uploadPostAuth,
  displayName: 'Profile',
  description:
    'The Upload-Post profile whose connected social accounts will publish the post. Profiles are managed under Manage Users in the Upload-Post dashboard.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Upload-Post account first',
      };
    }
    const profiles = await fetchProfiles(auth.secret_text);
    if (profiles.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No profiles found. Create one under Manage Users in Upload-Post.',
      };
    }
    return {
      disabled: false,
      options: profiles.map((profile) => {
        const platforms = connectedPlatforms(profile);
        return {
          label:
            platforms.length > 0
              ? `${profile.username} (${platforms.join(', ')})`
              : profile.username,
          value: profile.username,
        };
      }),
    };
  },
});

export const VIDEO_PLATFORMS = [
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'X (Twitter)', value: 'x' },
  { label: 'Threads', value: 'threads' },
  { label: 'Pinterest', value: 'pinterest' },
  { label: 'Bluesky', value: 'bluesky' },
  { label: 'Google Business Profile', value: 'google_business' },
  { label: 'Discord', value: 'discord' },
  { label: 'Telegram', value: 'telegram' },
];

export const PHOTO_PLATFORMS = VIDEO_PLATFORMS.filter(
  (platform) => platform.value !== 'youtube',
);

export const TEXT_PLATFORMS = [
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'X (Twitter)', value: 'x' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Threads', value: 'threads' },
  { label: 'Bluesky', value: 'bluesky' },
  { label: 'Google Business Profile', value: 'google_business' },
  { label: 'Discord', value: 'discord' },
  { label: 'Telegram', value: 'telegram' },
];

export const uploadPostProps = {
  platforms: platformsProperty,
  publishing: publishingProps,
  pinterestBoard: pinterestBoardProperty,
};

export const uploadPostForm = {
  build: buildUploadForm,
  commonFields: commonUploadFields,
  optionalString,
};

export const uploadPostProfiles = {
  fetch: fetchProfiles,
  connectedPlatforms,
};

export type UploadPostProfile = {
  username: string;
  created_at?: string;
  social_accounts?: Record<
    string,
    | {
        username?: string;
        handle?: string;
        display_name?: string;
        social_images?: string;
        reauth_required?: boolean;
      }
    | string
    | null
  >;
};

type ListProfilesResponse = {
  success: boolean;
  limit?: number;
  plan?: string;
  profiles?: UploadPostProfile[];
};

type PagesResponse = {
  success: boolean;
  pages?: { id: string; name?: string }[];
  boards?: { id: string; name?: string }[];
};
