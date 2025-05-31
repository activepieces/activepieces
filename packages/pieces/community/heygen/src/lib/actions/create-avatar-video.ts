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
    callback_id: Property.ShortText({
      displayName: 'Callback ID',
      description: 'A custom ID for callback purposes',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'URL to notify when video rendering is complete',
      required: false,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Specify the video output folder destination',
      required: false,
    }),
    character_type: Property.StaticDropdown({
      displayName: 'Character Type',
      description: 'Type of character to use',
      required: true,
      options: {
        options: [
          { label: 'Avatar', value: 'avatar' },
          { label: 'Talking Photo', value: 'talking_photo' },
        ],
      },
      defaultValue: 'avatar',
    }),
    avatar_id: Property.ShortText({
      displayName: 'Avatar ID',
      description: 'The ID of the avatar to use (for avatar type)',
      required: false,
    }),
    talking_photo_id: Property.ShortText({
      displayName: 'Talking Photo ID',
      description: 'The ID of the talking photo to use (for talking_photo type)',
      required: false,
    }),
    scale: Property.Number({
      displayName: 'Scale',
      description: 'Character scale (0-5.0 for avatar, 0-2.0 for talking photo)',
      required: false,
      defaultValue: 1.0,
    }),
    avatar_style: Property.StaticDropdown({
      displayName: 'Avatar Style',
      description: 'Avatar style (only for avatar type)',
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
    talking_photo_style: Property.StaticDropdown({
      displayName: 'Talking Photo Style',
      description: 'Talking photo style (only for talking_photo type)',
      required: false,
      options: {
        options: [
          { label: 'Square', value: 'square' },
          { label: 'Circle', value: 'circle' },
        ],
      },
    }),
    talking_style: Property.StaticDropdown({
      displayName: 'Talking Style',
      description: 'Talking photo talking style (only for talking_photo type)',
      required: false,
      options: {
        options: [
          { label: 'Stable', value: 'stable' },
          { label: 'Expressive', value: 'expressive' },
        ],
      },
      defaultValue: 'stable',
    }),
    expression: Property.StaticDropdown({
      displayName: 'Expression',
      description: 'Talking photo expression style (only for talking_photo type)',
      required: false,
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Happy', value: 'happy' },
        ],
      },
      defaultValue: 'default',
    }),
    super_resolution: Property.Checkbox({
      displayName: 'Super Resolution',
      description: 'Whether to enhance the photo image (only for talking_photo type)',
      required: false,
      defaultValue: false,
    }),
    offset_x: Property.Number({
      displayName: 'X Offset',
      description: 'Character X position offset (-1.0 to 1.0)',
      required: false,
      defaultValue: 0,
    }),
    offset_y: Property.Number({
      displayName: 'Y Offset',
      description: 'Character Y position offset (-1.0 to 1.0)',
      required: false,
      defaultValue: 0,
    }),
    matting: Property.Checkbox({
      displayName: 'Enable Matting',
      description: 'Whether to do matting for the character',
      required: false,
      defaultValue: false,
    }),
    circle_background_color: Property.ShortText({
      displayName: 'Circle Background Color',
      description: 'Background color in the circle when using circle style (hex color)',
      required: false,
      defaultValue: '#f6f6fc',
    }),
    voice_type: Property.StaticDropdown({
      displayName: 'Voice Type',
      description: 'Type of voice to use',
      required: true,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Audio', value: 'audio' },
          { label: 'Silence', value: 'silence' },
        ],
      },
      defaultValue: 'text',
    }),
    voice_id: Property.ShortText({
      displayName: 'Voice ID',
      description: 'The ID of the voice to use (for text type)',
      required: false,
    }),
    input_text: Property.LongText({
      displayName: 'Input Text',
      description: 'The text for the character to speak (for text type)',
      required: false,
    }),
    audio_url: Property.ShortText({
      displayName: 'Audio URL',
      description: 'URL of the audio file (for audio type)',
      required: false,
    }),
    audio_asset_id: Property.ShortText({
      displayName: 'Audio Asset ID',
      description: 'ID of the audio asset (for audio type)',
      required: false,
    }),
    silence_duration: Property.Number({
      displayName: 'Silence Duration',
      description: 'Duration of silence in seconds (1.0 to 100.0) (for silence type)',
      required: false,
      defaultValue: 1.0,
    }),
    voice_speed: Property.Number({
      displayName: 'Voice Speed',
      description: 'Voice speed, value between 0.5 and 1.5 (for text type)',
      required: false,
      defaultValue: 1.0,
    }),
    voice_pitch: Property.Number({
      displayName: 'Voice Pitch',
      description: 'Voice pitch, value between -50 and 50 (for text type)',
      required: false,
      defaultValue: 0,
    }),
    voice_emotion: Property.StaticDropdown({
      displayName: 'Voice Emotion',
      description: 'Voice emotion (if supported by the voice) (for text type)',
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
      description: 'Voice locale (e.g., en-US, en-IN, pt-PT, pt-BR) (for text type)',
      required: false,
    }),
    elevenlabs_model: Property.StaticDropdown({
      displayName: 'ElevenLabs Model',
      description: 'The ElevenLabs model to use (for text type)',
      required: false,
      options: {
        options: [
          { label: 'Eleven Monolingual V1', value: 'eleven_monolingual_v1' },
          { label: 'Eleven Multilingual V1', value: 'eleven_multilingual_v1' },
          { label: 'Eleven Multilingual V2', value: 'eleven_multilingual_v2' },
          { label: 'Eleven Turbo V2', value: 'eleven_turbo_v2' },
          { label: 'Eleven Turbo V2.5', value: 'eleven_turbo_v2_5' },
        ],
      },
    }),
    elevenlabs_similarity_boost: Property.Number({
      displayName: 'ElevenLabs Similarity Boost',
      description: 'Controls how similar the generated speech should be to the original voice (0.0 to 1.0)',
      required: false,
      defaultValue: 0.75,
    }),
    elevenlabs_stability: Property.Number({
      displayName: 'ElevenLabs Stability',
      description: 'Controls the stability of the voice generation (0.0 to 1.0)',
      required: false,
      defaultValue: 0.75,
    }),
    elevenlabs_style: Property.Number({
      displayName: 'ElevenLabs Style',
      description: 'Controls the style intensity of the generated speech (0.0 to 1.0)',
      required: false,
      defaultValue: 0.75,
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
      callback_id,
      callback_url,
      folder_id,
      character_type,
      avatar_id,
      talking_photo_id,
      scale,
      avatar_style,
      talking_photo_style,
      talking_style,
      expression,
      super_resolution,
      offset_x,
      offset_y,
      matting,
      circle_background_color,
      voice_type,
      voice_id,
      input_text,
      audio_url,
      audio_asset_id,
      silence_duration,
      voice_speed,
      voice_pitch,
      voice_emotion,
      voice_locale,
      elevenlabs_model,
      elevenlabs_similarity_boost,
      elevenlabs_stability,
      elevenlabs_style,
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

    // Build character settings based on type
    const character = {
      type: character_type,
      ...(character_type === 'avatar' ? {
        avatar_id,
        scale,
        avatar_style,
      } : {
        talking_photo_id,
        scale,
        talking_photo_style,
        talking_style,
        expression,
        super_resolution,
      }),
      offset: {
        x: offset_x || 0,
        y: offset_y || 0,
      },
      matting,
      circle_background_color: formatColorValue(circle_background_color),
    };

    // Build voice settings based on type
    const voice = {
      type: voice_type,
      ...(voice_type === 'text' ? {
        voice_id,
        input_text,
        speed: voice_speed,
        pitch: voice_pitch,
        emotion: voice_emotion,
        locale: voice_locale,
        ...(elevenlabs_model && {
          elevenlabs_settings: {
            model: elevenlabs_model,
            similarity_boost: elevenlabs_similarity_boost,
            stability: elevenlabs_stability,
            style: elevenlabs_style,
          },
        }),
      } : voice_type === 'audio' ? {
        ...(audio_url ? { audio_url } : { audio_asset_id }),
      } : {
        duration: silence_duration,
      }),
    };

    // Build background settings
    const background = {
      type: background_type,
      ...(background_type === 'color' ? {
        value: formatColorValue(background_value),
      } : {
        value: background_value,
        fit: background_fit,
        ...(background_type === 'video' && { play_style: video_play_style }),
      }),
    };

    const videoInput = {
      character,
      voice,
      background,
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
        callback_id,
        callback_url,
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
