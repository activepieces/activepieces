import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';
import { cometApiUtils } from './utils';

function model<R extends boolean>({
  required,
  displayName = 'Model',
  description = 'CometAPI model ID, e.g. "gpt-4o-mini". Use List Models to find one that supports this endpoint.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function messages({
  displayName = 'Messages',
  description = 'The conversation so far, oldest first. Each item has a role and its text content.',
  roles,
}: Omit<PropParams<false>, 'required'> & { roles: string[] }) {
  return Property.Array({
    displayName,
    description,
    required: false,
    properties: {
      role: Property.StaticDropdown({
        displayName: 'Role',
        required: false,
        options: {
          options: cometApiUtils.toOptions({ values: roles }),
        },
      }),
      content: Property.LongText({ displayName: 'Content', required: false }),
    },
  });
}

function additionalFields<R extends boolean>({
  required,
  displayName = 'Additional Fields',
  description = 'Any other request body fields the endpoint accepts, as a JSON object. Dedicated inputs above take precedence over the same key here.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function temperature<R extends boolean>({
  required,
  displayName = 'Temperature',
  description = 'Sampling temperature. Lower is more deterministic. Leave empty for the model default.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function booleanChoice<R extends boolean>({
  required,
  displayName,
  description,
  trueLabel = 'true',
  falseLabel = 'false',
}: BooleanChoiceParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: trueLabel, value: 'true' },
        { label: falseLabel, value: 'false' },
      ],
    },
  });
}

function watermark<R extends boolean>({
  required,
  displayName = 'Watermark',
  description,
}: PropParams<R>) {
  return booleanChoice({ required, displayName, description });
}

function numberOfImages<R extends boolean>({
  required,
  displayName = 'Number of Images',
  description = '1 to 9. Defaults to 1.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function speechToTextModel<R extends boolean>({
  required,
  displayName = 'Model',
  description = 'Speech-to-text model ID, e.g. "whisper-1". Use List Models with feature speech-to-text.',
}: PropParams<R>) {
  return model({ required, displayName, description });
}

function audioFile<R extends boolean>({
  required,
  displayName = 'Audio File',
  description = 'The audio to process, as a file URL or flow file.',
}: PropParams<R>) {
  return Property.File({ displayName, description, required });
}

function transcriptionPrompt<R extends boolean>({
  required,
  displayName = 'Prompt',
  description = 'Text to guide style or spelling of names and terms.',
}: PropParams<R>) {
  return Property.LongText({ displayName, description, required });
}

function transcriptionResponseFormat<R extends boolean>({
  required,
  displayName = 'Response Format',
  description = 'json returns the text; verbose_json adds language, duration and timed segments. Defaults to json.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: cometApiUtils.toOptions({ values: ['json', 'verbose_json'] }),
    },
  });
}

function videoTaskId<R extends boolean>({
  required,
  displayName = 'Task ID',
  description = 'The id returned by Create Video.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function minimaxTaskId<R extends boolean>({
  required,
  displayName = 'Task ID',
  description = 'The task_id returned by Create MiniMax Video.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function klingCallbackUrl<R extends boolean>({
  required,
  displayName = 'Callback URL',
  description = 'Webhook URL that receives task status updates.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function klingExternalTaskId<R extends boolean>({
  required,
  displayName = 'External Task ID',
  description = 'Your own tracking ID, unique per account.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function klingMode<R extends boolean>({
  required,
  displayName = 'Mode',
  description,
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { options: cometApiUtils.toOptions({ values: ['std', 'pro'] }) },
  });
}

function klingDuration<R extends boolean>({
  required,
  displayName = 'Duration (seconds)',
  description,
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { options: cometApiUtils.toOptions({ values: ['5', '10'] }) },
  });
}

function klingSound<R extends boolean>({
  required,
  displayName = 'Sound',
  description = 'Generate audio on models that support it. Leave empty for the model default.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { options: cometApiUtils.toOptions({ values: ['on', 'off'] }) },
  });
}

function klingVideoAspectRatio<R extends boolean>({
  required,
  displayName = 'Aspect Ratio',
  description,
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: cometApiUtils.toOptions({ values: KLING_VIDEO_ASPECT_RATIOS }),
    },
  });
}

function klingImageAspectRatio<R extends boolean>({
  required,
  displayName = 'Aspect Ratio',
  description = 'Defaults to 16:9.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: cometApiUtils.toOptions({ values: KLING_IMAGE_ASPECT_RATIOS }),
    },
  });
}

function klingNegativePrompt<R extends boolean>({
  required,
  displayName = 'Negative Prompt',
  description = 'What to keep out of the video. Up to 200 characters.',
}: PropParams<R>) {
  return Property.LongText({ displayName, description, required });
}

function klingCfgScale<R extends boolean>({
  required,
  displayName = 'CFG Scale',
  description = 'Prompt adherence from 0 to 1.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function klingImage<R extends boolean>({
  required,
  displayName = 'Image',
  description = 'Public image URL or raw Base64 (no data: prefix); JPG or PNG, up to 10 MB, at least 300x300 px.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function klingVideoId<R extends boolean>({
  required,
  displayName = 'Video ID',
  description = 'Video id from a finished Kling task result (task_result.videos[].id). Use this or Video URL.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function klingVideoUrl<R extends boolean>({
  required,
  displayName = 'Video URL',
  description = 'Public MP4 or MOV URL. Use this or Video ID.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function klingSessionId<R extends boolean>({
  required,
  displayName = 'Session ID',
  description = 'The session_id returned by Kling Init Video Selection, on the same account.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function klingFrameIndex<R extends boolean>({
  required,
  displayName = 'Frame Index',
  description = 'The frame the points are on.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function klingPoints({
  displayName = 'Points',
  description = 'Up to 10 points, as fractions of the frame from 0 to 1.',
}: Omit<PropParams<true>, 'required'>) {
  return Property.Array({
    displayName,
    description,
    required: true,
    properties: {
      x: Property.Number({ displayName: 'X', required: true }),
      y: Property.Number({ displayName: 'Y', required: true }),
    },
  });
}

function klingRouteModel<R extends boolean>({
  required,
  displayName = 'Model',
  description,
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: cometApiUtils.toOptions({ values: KLING_ROUTE_MODELS }),
    },
  });
}

function klingRouteResolution<R extends boolean>({
  required,
  displayName = 'Resolution',
  description = '4k is kling-3.0 only. Defaults to 720p.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: cometApiUtils.toOptions({ values: ['720p', '1080p', '4k'] }),
    },
  });
}

function klingRouteDuration<R extends boolean>({
  required,
  displayName = 'Duration (seconds)',
  description = 'Whole seconds in the model range. Defaults to 10 for kling-4.0 and 5 otherwise.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function klingRouteAudio<R extends boolean>({
  required,
  displayName = 'Audio',
  description = 'kling-3.0 and kling-2.6 only. native on kling-2.6 needs 1080p.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: cometApiUtils.toOptions({ values: ['native', 'off'] }),
    },
  });
}

function klingMultiShot<R extends boolean>({
  required,
  displayName = 'Multi Shot',
  description = 'kling-3.0 only: true for multiple shots, false for one.',
}: PropParams<R>) {
  return booleanChoice({ required, displayName, description });
}

function midjourneyBotType<R extends boolean>({
  required,
  displayName = 'Bot Type',
  description = 'MID_JOURNEY (default) or NIJI_JOURNEY.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'Midjourney', value: 'MID_JOURNEY' },
        { label: 'Niji', value: 'NIJI_JOURNEY' },
      ],
    },
  });
}

function runwaySeed<R extends boolean>({
  required,
  displayName = 'Seed',
  description = 'Sampling seed from 1 to 4294967295. Leave empty for a random seed.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function runwayPublicFigureThreshold<R extends boolean>({
  required,
  displayName = 'Public Figure Threshold',
  description = 'auto for standard moderation, low for less restrictive public-figure filtering. Leave empty for standard moderation.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { options: cometApiUtils.toOptions({ values: ['auto', 'low'] }) },
  });
}

function runwayOutputFormat<R extends boolean>({
  required,
  displayName = 'Output Format',
  description = 'Output encoding. Leave empty for H.264 MP4. Set proresProfile through Additional Fields for prores or hdr_prores.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: cometApiUtils.toOptions({ values: RUNWAY_OUTPUT_FORMATS }),
    },
  });
}

function runwayPresetVoice<R extends boolean>({
  required,
  displayName = 'Preset Voice',
  description = 'The Runway preset voice to speak in.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: cometApiUtils.toOptions({ values: RUNWAY_PRESET_VOICES }),
    },
  });
}

export const cometApiAiProps = {
  model,
  messages,
  additionalFields,
  temperature,
  booleanChoice,
  watermark,
  numberOfImages,
  speechToTextModel,
  audioFile,
  transcriptionPrompt,
  transcriptionResponseFormat,
  videoTaskId,
  minimaxTaskId,
  klingCallbackUrl,
  klingExternalTaskId,
  klingMode,
  klingDuration,
  klingSound,
  klingVideoAspectRatio,
  klingImageAspectRatio,
  klingNegativePrompt,
  klingCfgScale,
  klingImage,
  klingVideoId,
  klingVideoUrl,
  klingSessionId,
  klingFrameIndex,
  klingPoints,
  klingRouteModel,
  klingRouteResolution,
  klingRouteDuration,
  klingRouteAudio,
  klingMultiShot,
  midjourneyBotType,
  runwaySeed,
  runwayPublicFigureThreshold,
  runwayOutputFormat,
  runwayPresetVoice,
};

const KLING_VIDEO_ASPECT_RATIOS = ['16:9', '9:16', '1:1'];

const KLING_IMAGE_ASPECT_RATIOS = [
  '16:9',
  '9:16',
  '1:1',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '21:9',
];

const KLING_ROUTE_MODELS = [
  'kling-4.0',
  'kling-3.0-turbo',
  'kling-3.0',
  'kling-2.6',
  'kling-2.5-turbo',
];

const RUNWAY_OUTPUT_FORMATS = [
  'mp4',
  'prores',
  'png_sequence',
  'hdr10',
  'hlg',
  'sdr_rec709_10bit',
  'hdr_pq_12bit_master',
  'hdr_prores',
  'hdr_png_sequence',
  'hdr_exr_sequence',
  'hdr_exr_acescg_sequence_1_3',
  'hdr_exr_acescg_sequence_2_0',
];

const RUNWAY_PRESET_VOICES = [
  'Maya',
  'Arjun',
  'Serene',
  'Bernard',
  'Billy',
  'Mark',
  'Clint',
  'Mabel',
  'Chad',
  'Leslie',
  'Eleanor',
  'Elias',
  'Elliot',
  'Grungle',
  'Brodie',
  'Sandra',
  'Kirk',
  'Kylie',
  'Lara',
  'Lisa',
  'Malachi',
  'Marlene',
  'Martin',
  'Miriam',
  'Monster',
  'Paula',
  'Pip',
  'Rusty',
  'Ragnar',
  'Xylar',
  'Maggie',
  'Jack',
  'Katie',
  'Noah',
  'James',
  'Rina',
  'Ella',
  'Mariah',
  'Frank',
  'Claudia',
  'Niki',
  'Vincent',
  'Kendrick',
  'Myrna',
  'Tom',
  'Wanda',
  'Benjamin',
  'Kiana',
  'Rachel',
];

type BooleanChoiceParams<R extends boolean> = PropParams<R> & {
  displayName: string;
  trueLabel?: string;
  falseLabel?: string;
};
