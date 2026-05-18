import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { predisAiAuth } from '../..';
import {
  predisAiApiCall,
  INPUT_LANGUAGES,
  OUTPUT_LANGUAGES,
  MEDIA_TYPES,
  POST_TYPES,
  MODEL_VERSIONS,
  VIDEO_DURATIONS,
  COLOR_PALETTE_TYPES,
} from '../common';

export const createContent = createAction({
  auth: predisAiAuth,
  name: 'create_content',
  displayName: 'Create Content',
  description: 'Generate posts including videos, carousels, images, quotes, and memes.',
  props: {
    brand_id: Property.ShortText({
      displayName: 'Brand ID',
      description: 'Unique identifier of your brand. Find it in Predis.ai under your brand settings.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Topic',
      description: 'The topic for your post. Must be at least 20 characters and 3 words.',
      required: true,
    }),
    model_version: Property.StaticDropdown({
      displayName: 'Model Version',
      description: 'Version 4 offers higher quality but only supports single_image and carousel.',
      required: false,
      defaultValue: '4',
      options: {
        disabled: false,
        options: MODEL_VERSIONS,
      },
    }),
    media_type: Property.StaticDropdown({
      displayName: 'Media Type',
      description: 'Type of media to generate. Video is only supported by model version 2.',
      required: false,
      defaultValue: 'single_image',
      options: {
        disabled: false,
        options: MEDIA_TYPES,
      },
    }),
    post_type: Property.StaticDropdown({
      displayName: 'Post Type',
      description: 'Type of post to generate. Only supported by model version 2.',
      required: false,
      defaultValue: 'generic',
      options: {
        disabled: false,
        options: POST_TYPES,
      },
    }),
    n_posts: Property.Number({
      displayName: 'Number of Posts',
      description: 'Number of posts to generate (1-10).',
      required: false,
      defaultValue: 1,
    }),
    input_language: Property.StaticDropdown({
      displayName: 'Input Language',
      description: 'Language of your input text.',
      required: false,
      defaultValue: 'english',
      options: {
        disabled: false,
        options: INPUT_LANGUAGES,
      },
    }),
    output_language: Property.StaticDropdown({
      displayName: 'Output Language',
      description: 'Language for the generated post.',
      required: false,
      defaultValue: 'english',
      options: {
        disabled: false,
        options: OUTPUT_LANGUAGES,
      },
    }),
    video_duration: Property.StaticDropdown({
      displayName: 'Video Duration',
      description: 'Required when media type is video.',
      required: false,
      options: {
        disabled: false,
        options: VIDEO_DURATIONS,
      },
    }),
    color_palette_type: Property.StaticDropdown({
      displayName: 'Color Palette',
      description: 'Color palette for generated content.',
      required: false,
      defaultValue: 'ai_suggested',
      options: {
        disabled: false,
        options: COLOR_PALETTE_TYPES,
      },
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Author name. Required when post type is quotes.',
      required: false,
    }),
    template_ids: Property.Array({
      displayName: 'Template IDs',
      description: 'List of template IDs to use. Only supported by model version 2.',
      required: false,
    }),
    media_urls: Property.Array({
      displayName: 'Media URLs',
      description: 'List of image/video URLs to use in your post. Only supported by model version 2.',
      required: false,
    }),
  },
  async run(context) {
    const {
      brand_id,
      text,
      model_version,
      media_type,
      post_type,
      n_posts,
      input_language,
      output_language,
      video_duration,
      color_palette_type,
      author,
      template_ids,
      media_urls,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      brand_id,
      text,
    };

    if (model_version) body['model_version'] = model_version;
    if (media_type) body['media_type'] = media_type;
    if (post_type) body['post_type'] = post_type;
    if (n_posts) body['n_posts'] = n_posts;
    if (input_language) body['input_language'] = input_language;
    if (output_language) body['output_language'] = output_language;
    if (video_duration) body['video_duration'] = video_duration;
    if (color_palette_type) body['color_palette_type'] = color_palette_type;
    if (author) body['author'] = author;
    if (template_ids && template_ids.length > 0) body['template_ids'] = template_ids;
    if (media_urls && media_urls.length > 0) body['media_urls'] = media_urls;

    const response = await predisAiApiCall(
      context.auth.secret_text,
      HttpMethod.POST,
      '/create_content/',
      body
    );

    return response;
  },
});
