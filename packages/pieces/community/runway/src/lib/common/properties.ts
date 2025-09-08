import { Property } from '@activepieces/pieces-framework';

// Base Properties
const promptText = ({ required = true }) =>
  Property.LongText({
    displayName: 'Prompt Text',
    description:
      'A non-empty string up to 1000 characters (measured in UTF-16 code units). This should describe in detail what should appear in the output.',
    required: required,
  });

const seed = ({ required = false }) =>
    Property.Number({
    displayName: 'Seed',
    description:
      'If unspecified, a random number is chosen. Varying the seed integer is a way to get different results for the same other request parameters. Using the same seed integer for an identical request will produce similar results.',
    required: required,
  });

const publicFigureThreshold = ({ required = false }) => Property.StaticDropdown({
    displayName: 'Public Figure Threshold',
    description:
      'When set to low, the content moderation system will be less strict about preventing generations that include recognizable public figures.',
    required: required,
    options: {
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Low', value: 'low' },
      ],
    },
  })

const taskId = ({ required = true }) =>
  Property.ShortText({
    displayName: 'Task ID',
    description: 'The ID of the task.',
    required: required,
  });

// Properties for the actions
export const generateImageFromText = {
  model: Property.StaticDropdown({
    displayName: 'Model',
    description: 'Select the model to use for text-to-image generation',
    required: true,
    options: {
      options: [
        { label: 'Gen-4 Image', value: 'gen4_image' },
        { label: 'Gen-4 Image Turbo', value: 'gen4_image_turbo' },
      ],
    },
  }),
  promptText: promptText({ required: true }),
  ratio: Property.StaticDropdown({
    displayName: 'Image Ratio',
    description: 'Select the resolution of the output image(s)',
    required: true,
    options: {
      options: [
        { label: '1920:1080', value: '1920:1080' },
        { label: '1080:1920', value: '1080:1920' },
        { label: '1024:1024', value: '1024:1024' },
        { label: '1360:768', value: '1360:768' },
        { label: '1080:1080', value: '1080:1080' },
        { label: '1168:880', value: '1168:880' },
        { label: '1440:1080', value: '1440:1080' },
        { label: '1080:1440', value: '1080:1440' },
        { label: '1808:768', value: '1808:768' },
        { label: '2112:912', value: '2112:912' },
        { label: '1280:720', value: '1280:720' },
        { label: '720:1280', value: '720:1280' },
        { label: '720:720', value: '720:720' },
        { label: '960:720', value: '960:720' },
        { label: '720:960', value: '720:960' },
        { label: '1680:720', value: '1680:720' },
      ],
    },
  }),
  referenceImages: Property.Array({
    displayName: 'Reference Images',
    description:
      'An array of up to three images to be used as references for the generated image output.',
    required: false,
    properties: {
      url: Property.ShortText({
        displayName: 'Image URL',
        description:
          'A HTTPS URL or data URI containing an encoded image to be used as reference for the generated output image.',
        required: true,
      }),
      tag: Property.ShortText({
        displayName: 'Tag',
        description:
          "A name used to refer to the image reference, from 3 to 16 characters in length. Tags must be alphanumeric (plus underscores) and start with a letter. You can refer to the reference image's tag in the prompt text with at-mention syntax: @tag. Tags are case-sensitive.",
        required: false,
      }),
    },
  }),
  publicFigureThreshold: publicFigureThreshold({ required: false }),
  seed: seed({ required: false }) ,
};

export const generateVideoFromImage = {
  model: Property.StaticDropdown({
    displayName: 'Model',
    description: 'Select the model to use for image-to-video generation',
    required: true,
    options: {
      options: [
        { label: 'Gen-3A Turbo', value: 'gen3a_turbo' },
        { label: 'Gen-4 Turbo', value: 'gen4_turbo' },
      ],
    },
  }),
  promptImage: Property.DynamicProperties({
    displayName: 'Prompt Image',
    description:
      'The image to be used as a reference for the generated video output.',
    required: true,
    refreshers: ['auth', 'model'],
    props: async ({ model }) => {
      if (typeof model === 'string' && model === 'gen4_turbo') {
        return {
          images: Property.Array({
            displayName: 'Prompt Images',
            description:
              'An array of images to be used as references for the generated video output. You can provide one or two images.',
            required: true,
            properties: {
              uri: Property.ShortText({
                displayName: 'Image URL',
                description:
                  'A HTTPS URL or data URI containing an encoded image to be used as reference for the generated output video.',
                required: true,
              }),
              position: Property.StaticDropdown({
                displayName: 'Position',
                description:
                  'The position of the image in the output video. "first" will use the image as the first frame of the video, "last" will use the image as the last frame of the video. "last" is currently supported for gen3a_turbo only.',
                required: false,
                options: {
                  options: [
                    { label: 'First', value: 'first' },
                    { label: 'Last', value: 'last' },
                  ],
                },
              }),
            },
          }),
        };
      } else {
        return {
          images: Property.ShortText({
            displayName: 'Image URL',
            description:
              'A HTTPS URL or data URI containing an encoded image to be used as reference for the generated output video.',
            required: true,
          }),
        };
      }
    },
  }),
  ratio: Property.DynamicProperties({
    displayName: 'Video Ratio',
    description: 'Select the resolution of the output video',
    required: true,
    refreshers: ['auth', 'model'],
    props: async ({ model }) => {
      if (typeof model === 'string' && model === 'gen4_turbo') {
        return {
          ratio: Property.StaticDropdown({
            displayName: 'Video Ratio',
            description: 'Select the resolution of the output video',
            required: true,
            options: {
              options: [
                { label: '1280:720', value: '1280:720' },
                { label: '720:1280', value: '720:1280' },
                { label: '1104:832', value: '1104:832' },
                { label: '832:1104', value: '832:1104' },
                { label: '960:960', value: '960:960' },
                { label: '1584:672', value: '1584:672' },
                { label: '1280:768', value: '1280:768' },
                { label: '768:1280', value: '768:1280' },
              ],
            },
          }),
        };
      } else {
        return {
          ratio: Property.StaticDropdown({
            displayName: 'Video Ratio',
            description: 'Select the resolution of the output video',
            required: true,
            options: {
              options: [
                { label: '1280:720', value: '1280:720' },
                { label: '720:1280', value: '720:1280' },
              ],
            },
          }),
        };
      }
    },
  }),
  publicFigureThreshold: publicFigureThreshold({ required: false }),
  duration: Property.StaticDropdown({
    displayName: 'Duration',
    description: 'The number of seconds of duration for the output video.',
    required: false,
    options: {
      options: [
        { label: '5 seconds', value: 5 },
        { label: '10 seconds', value: 10 },
      ],
    },
  }),
  promptText: promptText({ required: false }),
  seed: seed({ required: false }),
};

export const getTaskDetails = {
    taskId: taskId({ required: true })
};

export const cancelOrDeleteATask = {
    taskId: taskId({ required: true })
};
