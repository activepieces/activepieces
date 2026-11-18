import { Property } from '@activepieces/pieces-framework';
import { StabilityFile } from './client';

function prompt(required: boolean) {
  return Property.LongText({
    displayName: 'Prompt',
    description: 'What you want to see in the output image. Write it in English: Stability AI moderation may refuse non-English prompts with a 403 error, at no charge.',
    required,
  });
}

function negativePrompt() {
  return Property.LongText({
    displayName: 'Negative Prompt',
    description: 'What you do not want to see in the output image.',
    required: false,
  });
}

function seed() {
  return Property.Number({
    displayName: 'Seed',
    description: 'Value from 0 to 4294967294 that makes results repeatable. Leave empty or use 0 for a random seed.',
    required: false,
  });
}

function outputFormat() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Output Format',
    description: 'File type of the generated image. Stability AI uses PNG when this is empty.',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'WebP', value: 'webp' },
      ],
    },
  });
}

function upscaledOutputFormat() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Output Format',
    description:
      'File type of the upscaled image. Defaults to WebP: a 4x PNG can exceed the Activepieces file size limit (10 MB on Cloud), in which case the credits are charged but the file cannot be saved.',
    required: false,
    defaultValue: 'webp',
    options: {
      disabled: false,
      options: [
        { label: 'WebP', value: 'webp' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'PNG (can exceed the file size limit)', value: 'png' },
      ],
    },
  });
}

function transparentOutputFormat() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Output Format',
    description: 'File type of the image with the background removed. Stability AI uses PNG when this is empty.',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'WebP', value: 'webp' },
      ],
    },
  });
}

function stylePreset() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Style Preset',
    description: 'Guides the image model towards a particular style.',
    required: false,
    options: {
      disabled: false,
      options: STYLE_PRESETS.map((value) => ({ label: value, value })),
    },
  });
}

function aspectRatio() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Aspect Ratio',
    description: 'Width-to-height ratio of the generated image. Stability AI uses 1:1 when this is empty.',
    required: false,
    options: {
      disabled: false,
      options: ASPECT_RATIOS.map((value) => ({ label: value, value })),
    },
  });
}

function outputFileName() {
  return Property.ShortText({
    displayName: 'Output File Name',
    description: 'Name for the saved image. The extension is added from the output format. Leave empty for an automatic name.',
    required: false,
  });
}

function image({ displayName, description, required }: ImagePropParams) {
  return Property.File({ displayName, description, required });
}

function waitForResult() {
  return Property.StaticDropdown<string, true>({
    displayName: 'Wait for Result',
    description:
      'Yes: check every 10 seconds for up to 4 minutes after the job is sent and return the image when it is ready. No: return the generation ID right away; use Get Generation Result to fetch the image later.',
    required: true,
    defaultValue: 'yes',
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function readText(value: unknown): string | undefined {
  if (isBlank(value)) {
    return undefined;
  }
  return typeof value === 'string' ? value.trim() : String(value);
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = readText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function readNumber({ value, label, min, max, integer }: ReadNumberParams): number | undefined {
  if (isBlank(value)) {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a number.`);
  }
  if (integer && !Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number.`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
  return parsed;
}

function readSeed(value: unknown): number | undefined {
  return readNumber({ value, label: 'Seed', min: 0, max: MAX_SEED, integer: true });
}

function readChoice({ value, label, allowed }: ReadChoiceParams): string | undefined {
  const text = readText(value);
  if (text === undefined) {
    return undefined;
  }
  if (!allowed.includes(text)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  }
  return text;
}

function readFile({ value, label, required }: ReadFileParams): StabilityFile | undefined {
  if (isBlank(value)) {
    if (required) {
      throw new Error(`${label} is required.`);
    }
    return undefined;
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    !('data' in value) ||
    !('filename' in value) ||
    typeof value.filename !== 'string' ||
    !Buffer.isBuffer(value.data)
  ) {
    throw new Error(`${label} must be a file.`);
  }
  if (value.data.length === 0) {
    throw new Error(`${label} is empty.`);
  }
  return { filename: value.filename, data: value.data };
}

function readYesNo({ value, defaultValue }: { value: unknown; defaultValue: boolean }): boolean {
  const text = readText(value)?.toLowerCase();
  if (text === undefined) {
    return defaultValue;
  }
  if (text === 'yes' || text === 'true') {
    return true;
  }
  if (text === 'no' || text === 'false') {
    return false;
  }
  throw new Error('Wait for Result must be "yes" or "no".');
}

function readPngDimensions(data: Buffer): ImageDimensions | null {
  if (data.length < 24 || !data.subarray(0, 8).equals(PNG_SIGNATURE) || data.toString('ascii', 12, 16) !== 'IHDR') {
    return null;
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function readJpegDimensions(data: Buffer): ImageDimensions | null {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return null;
  }
  let offset = 2;
  while (offset + 3 < data.length) {
    if (data[offset] !== 0xff) {
      return null;
    }
    const marker = data[offset + 1];
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      offset += 2;
      continue;
    }
    const segmentLength = data.readUInt16BE(offset + 2);
    if (JPEG_SOF_MARKERS.has(marker)) {
      if (offset + 8 >= data.length) {
        return null;
      }
      return { height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) };
    }
    if (segmentLength < 2) {
      return null;
    }
    offset += 2 + segmentLength;
  }
  return null;
}

function readImageDimensions(file: StabilityFile): ImageDimensions | null {
  return readPngDimensions(file.data) ?? readJpegDimensions(file.data);
}

const MAX_SEED = 4294967294;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const JPEG_SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

const STYLE_PRESETS = [
  'enhance',
  'anime',
  'photographic',
  'digital-art',
  'comic-book',
  'fantasy-art',
  'line-art',
  'analog-film',
  'neon-punk',
  'isometric',
  'low-poly',
  'origami',
  'modeling-compound',
  'cinematic',
  '3d-model',
  'pixel-art',
  'tile-texture',
];

const ASPECT_RATIOS = ['21:9', '16:9', '3:2', '5:4', '1:1', '4:5', '2:3', '9:16', '9:21'];

const OUTPUT_FORMATS = ['png', 'jpeg', 'webp'];

const TRANSPARENT_OUTPUT_FORMATS = ['png', 'webp'];

type ImageDimensions = {
  width: number;
  height: number;
};

type ImagePropParams = {
  displayName: string;
  description: string;
  required: boolean;
};

type ReadNumberParams = {
  value: unknown;
  label: string;
  min: number;
  max: number;
  integer?: boolean;
};

type ReadChoiceParams = {
  value: unknown;
  label: string;
  allowed: string[];
};

type ReadFileParams = {
  value: unknown;
  label: string;
  required: boolean;
};

export const stabilityProps = {
  prompt,
  negativePrompt,
  seed,
  outputFormat,
  upscaledOutputFormat,
  transparentOutputFormat,
  stylePreset,
  aspectRatio,
  outputFileName,
  image,
  waitForResult,
};

export const stabilityInput = {
  readText,
  requireText,
  readNumber,
  readSeed,
  readChoice,
  readFile,
  readYesNo,
  readImageDimensions,
  styleChoice: (value: unknown) => readChoice({ value, label: 'Style Preset', allowed: STYLE_PRESETS }),
  aspectRatioChoice: (value: unknown) => readChoice({ value, label: 'Aspect Ratio', allowed: ASPECT_RATIOS }),
  outputFormatChoice: (value: unknown) => readChoice({ value, label: 'Output Format', allowed: OUTPUT_FORMATS }),
  upscaledOutputFormatChoice: (value: unknown) =>
    readChoice({ value, label: 'Output Format', allowed: OUTPUT_FORMATS }) ?? 'webp',
  transparentOutputFormatChoice: (value: unknown) =>
    readChoice({ value, label: 'Output Format', allowed: TRANSPARENT_OUTPUT_FORMATS }),
};
