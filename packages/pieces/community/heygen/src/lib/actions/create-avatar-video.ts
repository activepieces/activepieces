import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createAvatarVideo = createAction({
  name: 'createAvatarVideo',
  displayName: 'Create Avatar Video',
  description: 'Create a video with an AI avatar using HeyGen API',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title for the video',
      required: false,
    }),
    caption: Property.Checkbox({
      displayName: 'Add Caption',
      description: 'Whether to add a caption to the video',
      required: false,
      defaultValue: false,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Specify the video output folder destination',
      required: false,
    }),
    avatar_id: Property.ShortText({
      displayName: 'Avatar ID',
      description: 'The ID of the avatar to use',
      required: true,
    }),
    avatar_scale: Property.Number({
      displayName: 'Avatar Scale',
      description: 'Avatar scale, value between 0 and 5.0',
      required: false,
      defaultValue: 1.0,
    }),
    avatar_style: Property.StaticDropdown({
      displayName: 'Avatar Style',
      description: 'Avatar style',
      required: false,
      options: {
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Circle', value: 'circle' },
          { label: 'Close Up', value: 'closeUp' },
        ],
      },
      defaultValue: 'normal',
    }),
    avatar_offset_x: Property.Number({
      displayName: 'Avatar X Offset',
      description: 'Avatar X position offset (-1.0 to 1.0)',
      required: false,
      defaultValue: 0,
    }),
    avatar_offset_y: Property.Number({
      displayName: 'Avatar Y Offset',
      description: 'Avatar Y position offset (-1.0 to 1.0)',
      required: false,
      defaultValue: 0,
    }),
    avatar_matting: Property.Checkbox({
      displayName: 'Enable Matting',
      description: 'Whether to do matting for the avatar',
      required: false,
      defaultValue: false,
    }),
    circle_background_color: Property.ShortText({
      displayName: 'Circle Background Color',
      description: 'Background color in the circle when using circle style (hex color)',
      required: false,
      defaultValue: '#f6f6fc',
    }),
    voice_id: Property.ShortText({
      displayName: 'Voice ID',
      description: 'The ID of the voice to use',
      required: true,
    }),
    input_text: Property.LongText({
      displayName: 'Input Text',
      description: 'The text for the avatar to speak',
      required: true,
    }),
    voice_speed: Property.Number({
      displayName: 'Voice Speed',
      description: 'Voice speed, value between 0.5 and 1.5',
      required: false,
      defaultValue: 1.0,
    }),
    voice_pitch: Property.Number({
      displayName: 'Voice Pitch',
      description: 'Voice pitch, value between -50 and 50',
      required: false,
      defaultValue: 0,
    }),
    voice_emotion: Property.StaticDropdown({
      displayName: 'Voice Emotion',
      description: 'Voice emotion (if supported by the voice)',
      required: false,
      options: {
        options: [
          { label: 'Excited', value: 'Excited' },
          { label: 'Friendly', value: 'Friendly' },
          { label: 'Serious', value: 'Serious' },
          { label: 'Soothing', value: 'Soothing' },
          { label: 'Broadcaster', value: 'Broadcaster' },
        ],
      },
    }),
    voice_locale: Property.ShortText({
      displayName: 'Voice Locale',
      description: 'Voice locale (e.g., en-US, en-IN, pt-PT, pt-BR)',
      required: false,
    }),
    background_type: Property.StaticDropdown({
      displayName: 'Background Type',
      description: 'Type of background to use',
      required: true,
      options: {
        options: [
          { label: 'Color', value: 'color' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
        ],
      },
      defaultValue: 'color',
    }),
    background_value: Property.ShortText({
      displayName: 'Background Value',
      description: 'For color: hex color code (e.g. #f6f6fc), For image/video: URL or asset ID',
      required: true,
      defaultValue: '#f6f6fc',
    }),
    background_fit: Property.StaticDropdown({
      displayName: 'Background Fit',
      description: 'How the background should fit the screen',
      required: false,
      options: {
        options: [
          { label: 'Cover', value: 'cover' },
          { label: 'Crop', value: 'crop' },
          { label: 'Contain', value: 'contain' },
          { label: 'None', value: 'none' },
        ],
      },
      defaultValue: 'cover',
    }),
    video_play_style: Property.StaticDropdown({
      displayName: 'Video Play Style',
      description: 'How the background video should play (only for video background)',
      required: false,
      options: {
        options: [
          { label: 'Fit to Scene', value: 'fit_to_scene' },
          { label: 'Freeze', value: 'freeze' },
          { label: 'Loop', value: 'loop' },
          { label: 'Once', value: 'once' },
        ],
      },
    }),
    dimension: Property.StaticDropdown({
      displayName: 'Video Dimension',
      description: 'The dimensions of the output video',
      required: true,
      options: {
        options: [
          { label: '1080x1920 (Portrait)', value: '1080x1920' },
          { label: '1920x1080 (Landscape)', value: '1920x1080' },
          { label: '1080x1080 (Square)', value: '1080x1080' },
        ],
      },
      defaultValue: '1920x1080',
    }),
  },
  async run(context) {
    const {
      title,
      caption,
      folder_id,
      avatar_id,
      avatar_scale,
      avatar_style,
      avatar_offset_x,
      avatar_offset_y,
      avatar_matting,
      circle_background_color,
      voice_id,
      input_text,
      voice_speed,
      voice_pitch,
      voice_emotion,
      voice_locale,
      background_type,
      background_value,
      background_fit,
      video_play_style,
      dimension,
    } = context.propsValue;

    // Validate and format color values
    const formatColorValue = (color: string | undefined) => {
      if (!color) return '#f6f6fc';
      // Remove any whitespace and ensure it starts with #
      const cleanColor = color.trim().replace(/^#?/, '#');
      // Ensure it's a valid 6-digit hex color
      return /^#[0-9a-fA-F]{6}$/.test(cleanColor) ? cleanColor : '#f6f6fc';
    };

    // Parse dimension string into width and height
    const [width, height] = dimension.split('x').map(Number);

    const videoInput = {
      character: {
        type: 'avatar',
        avatar_id,
        scale: avatar_scale,
        avatar_style,
        offset: {
          x: avatar_offset_x || 0,
          y: avatar_offset_y || 0,
        },
        matting: avatar_matting,
        circle_background_color: formatColorValue(circle_background_color),
      },
      voice: {
        type: 'text',
        voice_id,
        input_text,
        speed: voice_speed,
        pitch: voice_pitch,
        emotion: voice_emotion,
        locale: voice_locale,
      },
      background: {
        type: background_type,
        value: background_type === 'color' ? formatColorValue(background_value) : background_value,
        fit: background_fit,
        ...(background_type === 'video' && { play_style: video_play_style }),
      },
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.heygen.com/v2/video/generate',
      headers: {
        'x-api-key': context.auth as string,
        'Content-Type': 'application/json',
      },
      body: {
        title,
        caption,
        folder_id,
        video_inputs: [videoInput],
        dimension: {
          width,
          height,
        },
      },
    });

    return response.body;
  },
});
