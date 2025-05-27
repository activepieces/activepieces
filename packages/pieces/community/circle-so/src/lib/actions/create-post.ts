import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fetchSpaces, makeCircleRequest } from '../common';
import { circleAuth } from '../../index';

export const createPostAction = createAction({
  name: 'create_post',
  auth: circleAuth,
  displayName: 'Create Post',
  description: 'Share generated content like newsletters or updates to specific spaces.',
  props: {
    spaceId: Property.Dropdown({
      displayName: 'Space',
      description: 'The Circle space where the post will be published',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Circle.so account',
            options: [],
          };
        }
  
        const apiKey = auth as string;
        const spaces = await fetchSpaces(apiKey);
  
        return {
          options: spaces.map((space: any) => ({
            label: space.name,
            value: space.id.toString(),
          })),
        };
      },
    }),
    name: Property.ShortText({
      displayName: 'Post Title',
      description: 'The title of the post',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Status of the post',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Scheduled', value: 'scheduled' },
        ],
      },
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'URL-friendly identifier for the post',
      required: false,
    }),
    tiptapBody: Property.LongText({
      displayName: 'Tiptap Content (JSON)',
      description: 'Post body as Tiptap JSON',
      required: true,
    }),
    coverImage: Property.ShortText({
      displayName: 'Cover Image Signed ID',
      description: 'Signed ID of the cover image',
      required: false,
    }),
    internalCustomHtml: Property.LongText({
      displayName: 'Internal Custom HTML',
      description: 'HTML content for internal use',
      required: false,
    }),
    isTruncationDisabled: Property.Checkbox({
      displayName: 'Disable Truncation',
      description: 'Prevent truncating long posts',
      required: false,
    }),
    isCommentsClosed: Property.Checkbox({
      displayName: 'Close Comments',
      description: 'Disable new comments on the post',
      required: false,
    }),
    isCommentsEnabled: Property.Checkbox({
      displayName: 'Enable Comments',
      description: 'Allow comments on the post',
      required: false,
    }),
    isLikingEnabled: Property.Checkbox({
      displayName: 'Enable Liking',
      description: 'Allow members to like the post',
      required: false,
    }),
    hideMetaInfo: Property.Checkbox({
      displayName: 'Hide Meta Info',
      description: 'Hide author and post meta info',
      required: false,
    }),
    hideFromFeaturedAreas: Property.Checkbox({
      displayName: 'Hide from Featured Areas',
      description: 'Prevent post from showing in featured sections',
      required: false,
    }),
    metaTitle: Property.ShortText({
      displayName: 'Meta Title',
      description: 'SEO title for the post',
      required: false,
    }),
    metaDescription: Property.ShortText({
      displayName: 'Meta Description',
      description: 'SEO description for the post',
      required: false,
    }),
    opengraphTitle: Property.ShortText({
      displayName: 'Open Graph Title',
      description: 'Title used in social shares',
      required: false,
    }),
    opengraphDescription: Property.ShortText({
      displayName: 'Open Graph Description',
      description: 'Description used in social shares',
      required: false,
    }),
    publishedAt: Property.ShortText({
      displayName: 'Publish At (ISO)',
      description: 'When to publish the post (ISO 8601 format)',
      required: false,
    }),
    createdAt: Property.ShortText({
      displayName: 'Created At (ISO)',
      description: 'Custom created date (ISO 8601 format)',
      required: false,
    }),
    topics: Property.Array({
      displayName: 'Topic IDs',
      description: 'List of topic IDs associated with the post',
      required: false,
    }),
    skipNotifications: Property.Checkbox({
      displayName: 'Skip Notifications',
      description: 'Do not notify members about the post',
      required: false,
    }),
    isPinned: Property.Checkbox({
      displayName: 'Pin Post',
      description: 'Pin this post to the top',
      required: false,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      description: 'Email of the post author (preferred over user ID)',
      required: false,
    }),
    userId: Property.Number({
      displayName: 'User ID',
      description: 'User ID of the post author (used if email is not provided)',
      required: false,
    }),
  },
  async run(context) {
    const {
      spaceId,
      name,
      status,
      slug,
      tiptapBody,
      coverImage,
      internalCustomHtml,
      isTruncationDisabled,
      isCommentsClosed,
      isCommentsEnabled,
      isLikingEnabled,
      hideMetaInfo,
      hideFromFeaturedAreas,
      metaTitle,
      metaDescription,
      opengraphTitle,
      opengraphDescription,
      publishedAt,
      createdAt,
      topics,
      skipNotifications,
      isPinned,
      userEmail,
      userId,
    } = context.propsValue;
  
    const body: Record<string, any> = {
      name,
      status,
      slug,
      tiptap_body: tiptapBody ? JSON.parse(tiptapBody) : undefined,
      cover_image: coverImage,
      internal_custom_html: internalCustomHtml,
      is_truncation_disabled: isTruncationDisabled,
      is_comments_closed: isCommentsClosed,
      is_comments_enabled: isCommentsEnabled,
      is_liking_enabled: isLikingEnabled,
      hide_meta_info: hideMetaInfo,
      hide_from_featured_areas: hideFromFeaturedAreas,
      meta_title: metaTitle,
      meta_description: metaDescription,
      opengraph_title: opengraphTitle,
      opengraph_description: opengraphDescription,
      published_at: publishedAt,
      created_at: createdAt,
      skip_notifications: skipNotifications,
      is_pinned: isPinned,
      user_email: userEmail,
      user_id: userId,
    };
  
    if (topics && topics.length > 0) {
      body['topics'] = topics.map(String);
    }
  
    Object.keys(body).forEach(
      (key) => (body[key] === undefined || body[key] === null) && delete body[key]
    );
  
    const query = new URLSearchParams({ space_id: spaceId.toString() }).toString();
  
    return await makeCircleRequest(
      context.auth as string,
      HttpMethod.POST,
      `/posts?${query}`,
      body
    );
  }
});
