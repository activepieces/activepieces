import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const configureVideo = createAction({
  auth: tokportalAuth,
  name: 'configure_video',
  displayName: 'Configure Video',
  description:
    'Configures one video slot (video, carousel or story) of a bundle by its 1-based position: media URL, caption, publish date and platform options.',
  audience: 'both',
  aiMetadata: {
    description:
      'Configure a video, carousel or story slot of a TokPortal bundle (media URL, caption, YYYY-MM-DD publish date, platform options). Requires a bundle with video slots; use Upload Image From URL for carousel images. Reconfiguring the same position replaces the slot, so retries are safe. Publish afterwards with Publish All Bundle Videos or Auto Publish.',
    idempotent: true,
  },
  props: {
    bundleId: tokportalProps.bundleId(true),
    position: Property.Number({
      displayName: 'Position',
      description: '1-based position of the video slot inside the bundle.',
      required: true,
    }),
    videoType: Property.StaticDropdown({
      displayName: 'Video Type',
      description:
        'video (needs Video URL and Description), carousel (needs Carousel Images and Description) or story (exactly one of Video URL or Story Image URL).',
      required: true,
      defaultValue: 'video',
      options: {
        options: [
          { label: 'Video', value: 'video' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'Story', value: 'story' },
        ],
      },
    }),
    targetPublishDate: Property.ShortText({
      displayName: 'Target Publish Date',
      description: 'Publish date in YYYY-MM-DD format, for example 2026-09-01. Max 3 videos per day per bundle.',
      required: true,
    }),
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'Public direct video URL (.mp4) or TokPortal storage URL. Required for video, optional for a video story.',
      required: false,
    }),
    carouselImages: Property.Array({
      displayName: 'Carousel Images',
      description: '1-20 public image URLs or TokPortal storage paths (see Upload Image From URL). Required for carousel.',
      required: false,
    }),
    carouselTitle: Property.ShortText({
      displayName: 'Carousel Title',
      description: 'Optional title of the carousel.',
      required: false,
    }),
    storyImageUrl: Property.ShortText({
      displayName: 'Story Image URL',
      description: 'Story image URL. For a story, provide exactly one of Video URL or Story Image URL.',
      required: false,
    }),
    storyRepostUrl: Property.ShortText({
      displayName: 'Story Repost URL',
      description: 'Make the story repost an existing post from the same platform (+1 credit).',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Caption of the post. Required for video and carousel, ignored for stories.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Internal name of the slot.',
      required: false,
    }),
    externalRef: Property.ShortText({
      displayName: 'External Reference',
      description: 'Your own correlation reference for this slot.',
      required: false,
    }),
    autoPublish: Property.Checkbox({
      displayName: 'Auto Publish',
      description: 'Publish the slot immediately after configuration (the bundle must be accepted by a manager).',
      required: false,
    }),
    editingInstructions: Property.LongText({
      displayName: 'Editing Instructions',
      description: 'Instructions for the manager when the bundle includes edit slots.',
      required: false,
    }),
    aiContentDisclaimer: Property.Checkbox({
      displayName: 'AI Content Disclaimer',
      description: 'The manager enables the platform AI-generated content label (free).',
      required: false,
    }),
    discloseAsAds: Property.Checkbox({
      displayName: 'Disclose As Ads',
      description: 'The manager enables paid-partnership disclosure or adds #ad (free).',
      required: false,
    }),
    instantRepostAsStory: Property.Checkbox({
      displayName: 'Instant Repost As Story',
      description: 'The manager reposts the video as a story right after posting (+1 credit).',
      required: false,
    }),
    tiktokSoundUrl: Property.ShortText({
      displayName: 'TikTok Sound URL',
      description: 'TikTok sound to add to the post.',
      required: false,
    }),
    volumeOriginalSound: Property.Number({
      displayName: 'Volume Original Sound',
      description: 'Volume of the original sound (0-100).',
      required: false,
    }),
    volumeAddedSound: Property.Number({
      displayName: 'Volume Added Sound',
      description: 'Volume of the added sound (0-100).',
      required: false,
    }),
    instagramContentType: Property.StaticDropdown({
      displayName: 'Instagram Content Type',
      description: 'Instagram only.',
      required: false,
      options: {
        options: [
          { label: 'Reel', value: 'reel' },
          { label: 'Post', value: 'post' },
        ],
      },
    }),
    instagramLocation: Property.ShortText({
      displayName: 'Instagram Location',
      description: 'Location tag (Instagram only).',
      required: false,
    }),
    instagramCollaborators: Property.Array({
      displayName: 'Instagram Collaborators',
      description: 'Instagram usernames to invite as collaborators.',
      required: false,
    }),
    instagramAudioName: Property.ShortText({
      displayName: 'Instagram Audio Name',
      description: 'Name of the audio to use (Instagram only).',
      required: false,
    }),
    instagramAddToStory: Property.Checkbox({
      displayName: 'Instagram Add To Story',
      description: 'Also share the post to the story (Instagram only).',
      required: false,
    }),
    youtubeTitle: Property.ShortText({
      displayName: 'YouTube Title',
      description: 'Title of the YouTube video (YouTube only).',
      required: false,
    }),
    youtubeTags: Property.Array({
      displayName: 'YouTube Tags',
      description: 'Tags of the YouTube video (YouTube only).',
      required: false,
    }),
    youtubeCategory: Property.ShortText({
      displayName: 'YouTube Category',
      description: 'YouTube category (YouTube only).',
      required: false,
    }),
    youtubeVisibility: Property.StaticDropdown({
      displayName: 'YouTube Visibility',
      description: 'YouTube only.',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
    youtubeSoundUrl: Property.ShortText({
      displayName: 'YouTube Sound URL',
      description: 'Sound to add to the YouTube video (YouTube only).',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;

    if (p.videoType === 'video' && !p.videoUrl) {
      throw new Error('Video URL is required when Video Type is video.');
    }
    if (p.videoType === 'carousel' && (!p.carouselImages || p.carouselImages.length === 0)) {
      throw new Error('Carousel Images are required when Video Type is carousel.');
    }
    if (p.videoType === 'story' && !p.videoUrl && !p.storyImageUrl) {
      throw new Error('Provide Video URL or Story Image URL when Video Type is story.');
    }

    const toStringArray = (value: unknown[] | undefined) =>
      value && value.length > 0 ? value.map((item) => String(item)) : undefined;

    const response = await tokportalApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      resourceUri: `/bundles/${p.bundleId}/videos/${p.position}`,
      body: {
        video_type: p.videoType,
        target_publish_date: p.targetPublishDate,
        video_url: p.videoUrl || undefined,
        carousel_images: toStringArray(p.carouselImages),
        carousel_title: p.carouselTitle || undefined,
        story_image_url: p.storyImageUrl || undefined,
        story_repost_url: p.storyRepostUrl || undefined,
        description: p.description || undefined,
        name: p.name || undefined,
        external_ref: p.externalRef || undefined,
        auto_publish: p.autoPublish ?? undefined,
        editing_instructions: p.editingInstructions || undefined,
        ai_content_disclaimer: p.aiContentDisclaimer ?? undefined,
        disclose_as_ads: p.discloseAsAds ?? undefined,
        instant_repost_as_story: p.instantRepostAsStory ?? undefined,
        tiktok_sound_url: p.tiktokSoundUrl || undefined,
        volume_original_sound: p.volumeOriginalSound ?? undefined,
        volume_added_sound: p.volumeAddedSound ?? undefined,
        instagram_content_type: p.instagramContentType || undefined,
        instagram_location: p.instagramLocation || undefined,
        instagram_collaborators: toStringArray(p.instagramCollaborators),
        instagram_audio_name: p.instagramAudioName || undefined,
        instagram_add_to_story: p.instagramAddToStory ?? undefined,
        youtube_title: p.youtubeTitle || undefined,
        youtube_tags: toStringArray(p.youtubeTags),
        youtube_category: p.youtubeCategory || undefined,
        youtube_visibility: p.youtubeVisibility || undefined,
        youtube_sound_url: p.youtubeSoundUrl || undefined,
      },
    });
    return response.data ?? response;
  },
});
