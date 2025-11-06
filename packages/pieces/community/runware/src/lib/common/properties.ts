import { Property } from '@activepieces/pieces-framework';

// Common Properties
const height = ({ required = true }) =>
  Property.Number({
    displayName: 'Height',
    description:
      'Used to define the height dimension of the generated image. Certain models perform better with specific dimensions.',
    required: required,
  });

const width = ({ required = true }) =>
  Property.Number({
    displayName: 'Width',
    description:
      'Used to define the width dimension of the generated image. Certain models perform better with specific dimensions.',
    required: required,
  });

const model = Property.ShortText({
  displayName: 'Model',
  description:
   `You can find model in the Model Explorer (https://my.runware.ai/models/all) tool.`,
  required: true,
});

const steps = Property.Number({
  displayName: 'Steps',
  description:
    'The number of steps is the number of iterations the model will perform to generate the image. The higher the number of steps, the more detailed the image will be. However, increasing the number of steps will also increase the time it takes to generate the image and may not always result in a better image (some schedulers work differently).',
  required: false,
});

const CFGScale = Property.Number({
  displayName: 'CFG Scale',
  description:
    'Guidance scale represents how closely the images will resemble the prompt or how much freedom the AI model has. Higher values are closer to the prompt. Low values may reduce the quality of the results.',
  required: false,
});

const scheduler = Property.ShortText({
  displayName: 'Scheduler',
  description:
    'An scheduler is a component that manages the inference process. Different schedulers can be used to achieve different results like more detailed images, faster inference, or more accurate results.',
  required: false,
});

const positivePrompt = Property.LongText({
  displayName: 'Positive Prompt',
  description:
    'A positive prompt is a text instruction to guide the model on generating the image. It is usually a sentence or a paragraph that provides positive guidance for the task. This parameter is essential to shape the desired results.',
  required: true,
});

const negativePrompt = Property.LongText({
  displayName: 'Negative Prompt',
  description:
    'A negative prompt is a text instruction to guide the model on generating the image. It is usually a sentence or a paragraph that provides negative guidance for the task. This parameter helps to avoid certain undesired results.',
  required: false,
});
// Action Properties

export const generateImagesFromText = {
  model,
  positivePrompt,
  negativePrompt,
  height: height({ required: true }),
  width: width({ required: true }),
  steps,
  CFGScale,
  scheduler,
  seed: Property.Number({
    displayName: 'Seed',
    description:
      'A seed is a value used to randomize the image generation. If you want to make images reproducible (generate the same image multiple times), you can use the same seed value.',
    required: false,
  }),
  vae: Property.ShortText({
    displayName: 'VAE',
    description:
      'VAE (Variational Autoencoder) is a type of neural network architecture used for generating images. Some models may require a specific VAE to work properly. If you want to use a specific VAE, you can provide its AIR identifier here.',
    required: false,
  }),
  clipSkip: Property.Number({
    displayName: 'Clip Skip',
    description:
      'Defines additional layer skips during prompt processing in the CLIP model. Some models already skip layers by default, this parameter adds extra skips on top of those. Different values affect how your prompt is interpreted, which can lead to variations in the generated image.',
    required: false,
  }),
};

export const generateImagesFromExistingImage = {
  seedImage: Property.ShortText({
    displayName: 'Seed Image',
    description: 'A URL for the seed image to base the generation on.',
    required: true,
  }),
  model,
  positivePrompt,
  height: height({ required: true }),
  width: width({ required: true }),
  negativePrompt,
  strength: Property.Number({
    displayName: 'Strength',
    description:
      'A value between 0 and 1 that indicates how much to transform the seed image. A value of 0 will keep the image as is, while a value of 1 will completely transform it according to the prompt.',
    required: false,
  }),
  steps,
  CFGScale,
  scheduler,
};

export const generateVideoFromText = {
  positivePrompt,
  negativePrompt,
  model,
  duration: Property.Number({
    displayName: 'Duration',
    description: 'The duration of the generated video in seconds.',
    required: false,
  }),
  fps: Property.Number({
    displayName: 'FPS',
    description: 'Frames per second for the generated video.',
    required: false,
  }),
  outputFormat: Property.StaticDropdown({
    displayName: 'Output Format',
    description: 'The format of the generated video.',
    required: false,
    options: {
      options: [
        { label: 'MP4', value: 'MP4' },
        { label: 'WEBM', value: 'WEBM' },
        { label: 'MOV', value: 'MOV' },
      ],
    },
  }),
  outputQuality: Property.Number({
    displayName: 'Output Quality',
    description:
      'Sets the compression quality of the output video. Higher values preserve more quality but increase file size, lower values reduce file size but decrease quality.',
    required: false,
  }),
  uploadEndpoint: Property.ShortText({
    displayName: 'Upload Endpoint',
    description:
      'Specifies a URL where the generated content will be automatically uploaded using the HTTP PUT method. The raw binary data of the media file is sent directly as the request body. For secure uploads to cloud storage, use presigned URLs that include temporary authentication credentials.',
    required: false,
  }),
  numberResults: Property.Number({
    displayName: 'Number of Results',
    description:
      'Specifies how many videos to generate for the given parameters. Each video will have the same parameters but different seeds, resulting in variations of the same concept.',
    required: false,
  }),
};

export const imageBackgroundRemoval = {
  inputImage: Property.ShortText({
    displayName: 'Input Image',
    description: 'A URL for the image to have its background removed.',
    required: true,
  }),
  model,
  outputFormat: Property.StaticDropdown({
    displayName: 'Output Format',
    description: 'The format of the output image with the background removed.',
    required: false,
    options: {
      options: [
        { label: 'PNG', value: 'PNG' },
        { label: 'JPG', value: 'JPG' },
        { label: 'WEBP', value: 'WEBP' },
      ],
    },
  }),
  outputQuality: Property.Number({
    displayName: 'Output Quality',
    description:
      'Sets the compression quality of the output image. Higher values preserve more quality but increase file size, lower values reduce file size but decrease quality.',
    required: false,
  }),
  uploadEndpoint: Property.ShortText({
    displayName: 'Upload Endpoint',
    description:
      'Specifies a URL where the generated content will be automatically uploaded using the HTTP PUT method. The raw binary data of the media file is sent directly as the request body. For secure uploads to cloud storage, use presigned URLs that include temporary authentication credentials.',
    required: false,
  }),
};
