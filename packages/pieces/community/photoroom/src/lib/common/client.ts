import {
  httpClient,
  HttpError,
  HttpHeaders,
  HttpMethod,
} from '@activepieces/pieces-common';
import { ApFile } from '@activepieces/pieces-framework';

function toRecord({
  value,
}: {
  value: unknown;
}): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  return { ...value };
}

function readStringField({
  record,
  key,
}: {
  record: Record<string, unknown>;
  key: string;
}): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function decodeErrorBody({ body }: { body: unknown }): string | undefined {
  const text = Buffer.isBuffer(body)
    ? body.toString('utf-8')
    : typeof body === 'string'
    ? body
    : undefined;
  let parsed: unknown = body;
  if (text !== undefined) {
    try {
      parsed = JSON.parse(text);
    } catch {
      return text.length > 0 ? text : undefined;
    }
  }
  const record = toRecord({ value: parsed });
  if (record === undefined) {
    return undefined;
  }
  const detail = readStringField({ record, key: 'detail' });
  if (detail !== undefined) {
    return detail;
  }
  const nestedError = toRecord({ value: record['error'] });
  if (nestedError !== undefined) {
    const nestedMessage = readStringField({
      record: nestedError,
      key: 'message',
    });
    if (nestedMessage !== undefined) {
      return nestedMessage;
    }
  }
  return readStringField({ record, key: 'message' });
}

function toPhotoroomError({ error }: { error: unknown }): PhotoroomApiError {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const detail = decodeErrorBody({ body: error.response.body });
    const suffix = detail === undefined ? '' : `: ${detail}`;
    return new PhotoroomApiError({
      status,
      message: `Photoroom API request failed with status ${status}${suffix}`,
    });
  }
  const message = error instanceof Error ? error.message : String(error);
  return new PhotoroomApiError({
    message: `Could not reach the Photoroom API: ${message}`,
  });
}

function appendFormField({
  form,
  name,
  value,
}: {
  form: FormData;
  name: string;
  value: string | number | boolean | undefined | null;
}): void {
  if (value === undefined || value === null || value === '') {
    return;
  }
  form.append(name, String(value));
}

function appendFormFile({
  form,
  name,
  file,
}: {
  form: FormData;
  name: string;
  file: ApFile;
}): void {
  form.append(name, new Blob([new Uint8Array(file.data)]), file.filename);
}

function buildRemoveBackgroundFormData({
  file,
  format,
  channels,
  bgColor,
  size,
  crop,
  despill,
}: RemoveBackgroundFormParams): FormData {
  const form = new FormData();
  appendFormFile({ form, name: 'image_file', file });
  appendFormField({ form, name: 'format', value: format });
  appendFormField({ form, name: 'channels', value: channels });
  appendFormField({ form, name: 'bg_color', value: bgColor });
  appendFormField({ form, name: 'size', value: size });
  appendFormField({ form, name: 'crop', value: crop });
  appendFormField({ form, name: 'despill', value: despill });
  return form;
}

function buildEditImageFormData({
  image,
  removeBackground,
  backgroundPrompt,
  backgroundColor,
  backgroundImage,
  backgroundSeed,
  shadowMode,
  lightingMode,
  textRemovalMode,
  upscaleMode,
  expandMode,
  uncropMode,
  beautifyMode,
  padding,
  margin,
  outputSize,
  exportFormat,
  exportDpi,
}: EditImageFormParams): FormData {
  const form = new FormData();
  appendFormFile({ form, name: 'imageFile', file: image });
  appendFormField({
    form,
    name: 'removeBackground',
    value: removeBackground ?? true,
  });
  appendFormField({ form, name: 'background.prompt', value: backgroundPrompt });
  appendFormField({ form, name: 'background.color', value: backgroundColor });
  if (backgroundImage !== undefined && backgroundImage !== null) {
    appendFormFile({
      form,
      name: 'background.imageFile',
      file: backgroundImage,
    });
  }
  appendFormField({ form, name: 'background.seed', value: backgroundSeed });
  appendFormField({ form, name: 'shadow.mode', value: shadowMode });
  appendFormField({ form, name: 'lighting.mode', value: lightingMode });
  appendFormField({ form, name: 'textRemoval.mode', value: textRemovalMode });
  appendFormField({ form, name: 'upscale.mode', value: upscaleMode });
  appendFormField({ form, name: 'expand.mode', value: expandMode });
  appendFormField({ form, name: 'uncrop.mode', value: uncropMode });
  appendFormField({ form, name: 'beautify.mode', value: beautifyMode });
  appendFormField({ form, name: 'padding', value: padding });
  appendFormField({ form, name: 'margin', value: margin });
  appendFormField({ form, name: 'outputSize', value: outputSize });
  appendFormField({ form, name: 'export.format', value: exportFormat });
  appendFormField({ form, name: 'export.dpi', value: exportDpi });
  return form;
}

function buildGenerateImageFormData({
  prompt,
  seed,
  size,
  exportFormat,
}: GenerateImageFormParams): FormData {
  const form = new FormData();
  appendFormField({ form, name: 'imageFromPrompt.prompt', value: prompt });
  appendFormField({ form, name: 'imageFromPrompt.seed', value: seed });
  appendFormField({ form, name: 'imageFromPrompt.size', value: size });
  appendFormField({ form, name: 'export.format', value: exportFormat });
  return form;
}

function readHeaderNumber({
  headers,
  name,
}: {
  headers: HttpHeaders;
  name: string;
}): number | undefined {
  const raw = headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

async function sendImageRequest({
  apiKey,
  url,
  form,
}: {
  apiKey: string;
  url: string;
  form: FormData;
}): Promise<PhotoroomImageResult> {
  try {
    const response = await httpClient.sendRequest<Buffer>({
      method: HttpMethod.POST,
      url,
      headers: {
        'x-api-key': apiKey,
        Accept: 'image/*',
      },
      body: form,
      responseType: 'arraybuffer',
    });
    const headers = response.headers ?? {};
    return {
      data: response.body,
      uncertaintyScore: readHeaderNumber({
        headers,
        name: 'x-uncertainty-score',
      }),
      aiBackgroundSeed: readHeaderNumber({
        headers,
        name: 'pr-ai-background-seed',
      }),
    };
  } catch (error) {
    throw toPhotoroomError({ error });
  }
}

async function sendRemoveBackgroundRequest({
  apiKey,
  form,
}: {
  apiKey: string;
  form: FormData;
}): Promise<PhotoroomImageResult> {
  return sendImageRequest({ apiKey, url: PHOTOROOM_SEGMENT_URL, form });
}

async function sendEditRequest({
  apiKey,
  form,
}: {
  apiKey: string;
  form: FormData;
}): Promise<PhotoroomImageResult> {
  return sendImageRequest({
    apiKey,
    url: `${PHOTOROOM_IMAGE_API_BASE_URL}/v2/edit`,
    form,
  });
}

function mapAccountDetails({
  body,
}: {
  body: PhotoroomAccountResponseBody;
}): PhotoroomAccountDetails {
  return {
    plan: body.plan,
    images: {
      available: body.images.available,
      subscription: body.images.subscription,
    },
  };
}

async function fetchAccountDetails({
  apiKey,
}: {
  apiKey: string;
}): Promise<PhotoroomAccountDetails> {
  try {
    const response = await httpClient.sendRequest<PhotoroomAccountResponseBody>(
      {
        method: HttpMethod.GET,
        url: `${PHOTOROOM_IMAGE_API_BASE_URL}/v2/account`,
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
      }
    );
    return mapAccountDetails({ body: response.body });
  } catch (error) {
    throw toPhotoroomError({ error });
  }
}

export class PhotoroomApiError extends Error {
  readonly status?: number;

  constructor({ status, message }: { status?: number; message: string }) {
    super(message);
    this.name = 'PhotoroomApiError';
    this.status = status;
  }
}

export const photoroomClient = {
  buildRemoveBackgroundFormData,
  buildEditImageFormData,
  buildGenerateImageFormData,
  sendRemoveBackgroundRequest,
  sendEditRequest,
  fetchAccountDetails,
  mapAccountDetails,
  decodeErrorBody,
  toPhotoroomError,
};

export const PHOTOROOM_IMAGE_API_BASE_URL = 'https://image-api.photoroom.com';
export const PHOTOROOM_SEGMENT_URL = 'https://sdk.photoroom.com/v1/segment';

export type RemoveBackgroundFormParams = {
  file: ApFile;
  format?: string;
  channels?: string;
  bgColor?: string;
  size?: string;
  crop?: boolean;
  despill?: boolean;
};

export type EditImageFormParams = {
  image: ApFile;
  removeBackground?: boolean;
  backgroundPrompt?: string;
  backgroundColor?: string;
  backgroundImage?: ApFile | null;
  backgroundSeed?: number;
  shadowMode?: string;
  lightingMode?: string;
  textRemovalMode?: string;
  upscaleMode?: string;
  expandMode?: string;
  uncropMode?: string;
  beautifyMode?: string;
  padding?: string;
  margin?: string;
  outputSize?: string;
  exportFormat?: string;
  exportDpi?: number;
};

export type GenerateImageFormParams = {
  prompt: string;
  seed?: number;
  size?: string;
  exportFormat?: string;
};

export type PhotoroomImageResult = {
  data: Buffer;
  uncertaintyScore?: number;
  aiBackgroundSeed?: number;
};

export type PhotoroomAccountDetails = {
  plan: string;
  images: {
    available: number;
    subscription: number;
  };
};

export type PhotoroomAccountResponseBody = {
  plan: string;
  images: {
    available: number;
    subscription: number;
  };
};
