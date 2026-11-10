import {
  ActionContext,
  ApFile,
  AppConnectionType,
  createMockActionContext,
  InputPropertyMap,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stabilityAi } from '../src';
import { stabilityAiAuth } from '../src/lib/auth';
import { stabilityClient } from '../src/lib/common/client';
import { creativeUpscale } from '../src/lib/actions/creative-upscale';
import { eraseObject } from '../src/lib/actions/erase-object';
import { generateImage } from '../src/lib/actions/generate-image';
import { getAccountBalance } from '../src/lib/actions/get-account-balance';
import { getAccountDetails } from '../src/lib/actions/get-account-details';
import { getGenerationResult } from '../src/lib/actions/get-generation-result';
import { imageToImage } from '../src/lib/actions/image-to-image';
import { inpaint } from '../src/lib/actions/inpaint';
import { listEngines } from '../src/lib/actions/list-engines';
import { outpaint } from '../src/lib/actions/outpaint';
import { removeBackground } from '../src/lib/actions/remove-background';
import { replaceBackgroundAndRelight } from '../src/lib/actions/replace-background-and-relight';
import { searchAndRecolor } from '../src/lib/actions/search-and-recolor';
import { searchAndReplace } from '../src/lib/actions/search-and-replace';
import { sketchToImage } from '../src/lib/actions/sketch-to-image';
import { structureToImage } from '../src/lib/actions/structure-to-image';
import { styleGuide } from '../src/lib/actions/style-guide';
import { styleTransfer } from '../src/lib/actions/style-transfer';
import { textToImage } from '../src/lib/actions/text-to-image';
import { upscaleImage } from '../src/lib/actions/upscale-image';

const sendRequest = vi.fn();
const write = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const API_KEY = 'sk-test-key';
const GENERATION_ID = 'a6dc6c6e20acda010fe14d71f180658f2896ed9b4ec25aa99a6ff06c796987c4';
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
const PHOTO = new ApFile('photo.png', Buffer.from('photo-bytes'), 'png');
const MASK = new ApFile('mask.png', Buffer.from('mask-bytes'), 'png');

function pngOfSize({ width, height }: { width: number; height: number }): ApFile {
  const header = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  return new ApFile('sized.png', header, 'png');
}

function fileSizeError(message: string): Error {
  const error = new Error(message);
  error.name = 'FileSizeError';
  return error;
}

function jpegOfSize({ width, height }: { width: number; height: number }): ApFile {
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]);
  const sof = Buffer.alloc(11);
  sof.writeUInt16BE(0xffc0, 0);
  sof.writeUInt16BE(9, 2);
  sof.writeUInt8(8, 4);
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return new ApFile('sized.jpg', Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof]), 'jpg');
}

function runAction({ action, propsValue }: RunActionParams): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue });
  const context: StabilityActionContext = {
    ...base,
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: { api_key: API_KEY } },
    files: { ...base.files, write },
  };
  return action.run(context);
}

function respondImage({ contentType, headers }: { contentType: string; headers: Record<string, string> }): void {
  sendRequest.mockResolvedValueOnce({
    status: 200,
    headers: { 'content-type': contentType, ...headers },
    body: PNG_BYTES,
  });
}

function respondPng(): void {
  respondImage({
    contentType: 'image/png',
    headers: { 'finish-reason': 'SUCCESS', seed: '42', 'x-request-id': 'req-1' },
  });
}

function respondJson({ status, body }: { status: number; body: unknown }): void {
  sendRequest.mockResolvedValueOnce({ status, headers: { 'content-type': 'application/json' }, body });
}

function rejectWith({ status, body }: { status: number; body: unknown }): void {
  sendRequest.mockRejectedValueOnce(new HttpError('[redacted]', { status, responseBody: body }));
}

function sent(index: number): SentRequest {
  return sendRequest.mock.calls[index][0];
}

function formOf(index: number): FormData {
  const body = sent(index).body;
  if (!(body instanceof FormData)) {
    throw new Error('expected a FormData body');
  }
  return body;
}

function fieldNames(index: number): string[] {
  return [...formOf(index).keys()].sort();
}

function expectMultipartImageRequest({ index, path }: { index: number; path: string }): void {
  const request = sent(index);
  expect(request.method).toBe(HttpMethod.POST);
  expect(request.url).toBe(`https://api.stability.ai${path}`);
  expect(request.headers).toEqual({
    Authorization: `Bearer ${API_KEY}`,
    'stability-client-id': 'activepieces',
    Accept: 'image/*',
  });
  expect(request.responseType).toBe('arraybuffer');
  expect(request.retries).toBe(0);
  expect(request.redactBodyInErrors).toBe(true);
  expect(request.timeout).toBeGreaterThan(0);
}

beforeEach(() => {
  sendRequest.mockReset();
  write.mockReset();
  write.mockImplementation(async ({ fileName }: { fileName: string }) => `https://files.test/${fileName}`);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('piece metadata', () => {
  const agentActions = [
    generateImage,
    imageToImage,
    upscaleImage,
    creativeUpscale,
    getGenerationResult,
    eraseObject,
    inpaint,
    outpaint,
    searchAndReplace,
    searchAndRecolor,
    removeBackground,
    replaceBackgroundAndRelight,
    sketchToImage,
    structureToImage,
    styleGuide,
    styleTransfer,
    getAccountBalance,
    getAccountDetails,
    listEngines,
  ];

  it.each(agentActions.map((action) => [action.name, action]))('%s is an agent tool with full metadata', (_name, action) => {
    expect(action.audience).toBe('both');
    expect(action.classification).toBeDefined();
    expect(action.aiMetadata?.description?.length).toBeGreaterThan(40);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
  });

  it('demotes the legacy text-to-image action to humans only', () => {
    expect(textToImage.audience).toBe('human');
    expect(textToImage.outputSchema?.itemLabel).toBeDefined();
  });

  it('classifies async generation as READ (not idempotent) and the engine list as SEARCH', () => {
    expect(creativeUpscale.classification).toBe('READ');
    expect(replaceBackgroundAndRelight.classification).toBe('READ');
    expect(creativeUpscale.aiMetadata?.idempotent).toBe(false);
    expect(replaceBackgroundAndRelight.aiMetadata?.idempotent).toBe(false);
    expect(listEngines.classification).toBe('SEARCH');
    expect(generateImage.classification).toBe('READ');
  });

  it('registers every action and raises the minimum release for agent tools', () => {
    const names = Object.keys(stabilityAi.actions());
    expect(names).toHaveLength(agentActions.length + 2);
    expect(names).toContain('text-to-image');
    expect(names).toContain('custom_api_call');
    expect(stabilityAi.minimumSupportedRelease).toBe('0.86.4');
  });

  it('names only registered actions in its prose', () => {
    const displayNames = new Set(Object.values(stabilityAi.actions()).map((action) => action.displayName));
    const referenced = [
      'Generate Image',
      'Image to Image',
      'Upscale Image',
      'Creative Upscale',
      'Get Generation Result',
      'Erase Object',
      'Inpaint',
      'Search and Replace',
      'Search and Recolor',
      'Remove Background',
      'Replace Background and Relight',
      'Sketch to Image',
      'Structure to Image',
      'Style Guide',
      'Style Transfer',
      'Get Account Balance',
      'Text to Image',
    ];
    referenced.forEach((name) => expect(displayNames.has(name)).toBe(true));
  });
});

describe('auth validate', () => {
  const server = {
    apiUrl: 'http://localhost:3000',
    publicUrl: 'http://localhost:4200',
    mintOidcToken: async () => 'token',
  };

  it('accepts a key the balance endpoint accepts', async () => {
    respondJson({ status: 200, body: { credits: 12.5 } });
    const result = await stabilityAiAuth.validate?.({ auth: { api_key: ` ${API_KEY} ` }, server });
    expect(result).toEqual({ valid: true });
    expect(sent(0).url).toBe('https://api.stability.ai/v1/user/balance');
    expect(sent(0).method).toBe(HttpMethod.GET);
    expect(sent(0).headers?.['Authorization']).toBe(`Bearer ${API_KEY}`);
  });

  it('reports a 401 as a rejected key with the vendor message', async () => {
    rejectWith({ status: 401, body: { id: 'x', name: 'unauthorized', message: 'missing authorization header' } });
    const result = await stabilityAiAuth.validate?.({ auth: { api_key: 'bad' }, server });
    expect(result).toEqual({
      valid: false,
      error: 'Stability AI rejected the API key. Stability AI request failed with status 401 (unauthorized): missing authorization header',
    });
  });

  it('never calls a server error an invalid key', async () => {
    rejectWith({ status: 503, body: 'upstream unavailable' });
    const result = await stabilityAiAuth.validate?.({ auth: { api_key: 'key' }, server });
    expect(result).toEqual({
      valid: false,
      error: 'Could not verify the API key. Stability AI request failed with status 503: upstream unavailable',
    });
  });

  it('refuses an empty key without calling the API', async () => {
    const result = await stabilityAiAuth.validate?.({ auth: { api_key: '  ' }, server });
    expect(result).toEqual({ valid: false, error: 'Enter your Stability AI API key.' });
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Text to Image', () => {
  const artifacts = [
    { base64: PNG_BYTES.toString('base64'), seed: 11, finishReason: 'SUCCESS' },
    { base64: PNG_BYTES.toString('base64'), seed: 12, finishReason: 'CONTENT_FILTERED' },
  ];

  it('sends the exact v1 request, keeping 0 values, and returns one item per artifact', async () => {
    respondJson({ status: 200, body: { artifacts } });
    const result = await runAction({
      action: textToImage,
      propsValue: {
        prompt: 'a lighthouse',
        engine_id: 'stable-diffusion-xl-1024-v1-0',
        cfg_scale: 0,
        weight: 0,
        samples: '2',
        steps: 30,
        width: 1344,
        height: 768,
        style_preset: 'photographic',
      },
    });
    expect(sent(0).url).toBe('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image');
    expect(sent(0).headers?.['Accept']).toBe('application/json');
    expect(sent(0).retries).toBe(0);
    expect(sent(0).body).toEqual({
      text_prompts: [{ text: 'a lighthouse', weight: 0 }],
      cfg_scale: 7,
      clip_guidance_preset: 'NONE',
      height: 768,
      width: 1344,
      samples: 2,
      steps: 30,
      style_preset: 'photographic',
    });
    expect(result).toEqual([
      { image: expect.stringMatching(/image-\d+-1\.png$/), seed: 11, finishReason: 'SUCCESS' },
      { image: expect.stringMatching(/image-\d+-2\.png$/), seed: 12, finishReason: 'CONTENT_FILTERED' },
    ]);
  });

  it('sends a cfg_scale between 1 and 35 as given', async () => {
    respondJson({ status: 200, body: { artifacts: [artifacts[0]] } });
    await runAction({ action: textToImage, propsValue: { prompt: 'p', engine_id: 'stable-diffusion-xl-1024-v1-0', cfg_scale: 1 } });
    expect(sent(0).body).toMatchObject({ cfg_scale: 1 });
  });

  it('keeps the old defaults when optional values are empty', async () => {
    respondJson({ status: 200, body: { artifacts: [artifacts[0]] } });
    await runAction({ action: textToImage, propsValue: { prompt: 'a cat', engine_id: 'stable-diffusion-xl-1024-v1-0' } });
    expect(sent(0).body).toEqual({
      text_prompts: [{ text: 'a cat', weight: 1 }],
      cfg_scale: 7,
      clip_guidance_preset: 'NONE',
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 50,
    });
  });

  it.each([
    [{ steps: 60 }, 'steps must be between 10 and 50.'],
    [{ samples: '11' }, 'samples must be between 1 and 10.'],
    [{ cfg_scale: 36 }, 'cfg_scale must be between 0 and 35.'],
    [{ cfg_scale: -1 }, 'cfg_scale must be between 0 and 35.'],
    [{ width: 1024, height: 768 }, 'SDXL 1.0 does not support 1024x768.'],
    [{ width: 1344 }, 'SDXL 1.0 does not support 1344x1024.'],
  ])('rejects %j before any request', async (extra, message) => {
    await expect(
      runAction({ action: textToImage, propsValue: { prompt: 'p', engine_id: 'stable-diffusion-xl-1024-v1-0', ...extra } }),
    ).rejects.toThrow(message);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('fails when every artifact errored', async () => {
    respondJson({ status: 200, body: { artifacts: [{ seed: 1, finishReason: 'ERROR' }] } });
    await expect(
      runAction({ action: textToImage, propsValue: { prompt: 'p', engine_id: 'stable-diffusion-xl-1024-v1-0' } }),
    ).rejects.toThrow('finish reason ERROR');
    expect(write).not.toHaveBeenCalled();
  });

  it('still sends a retired engine from a stored step and adds a hint to the vendor error', async () => {
    rejectWith({ status: 404, body: { id: 'e', name: 'not_found', message: 'engine not found' } });
    const error = await runAction({ action: textToImage, propsValue: { prompt: 'p', engine_id: 'stable-diffusion-v1-5' } }).catch(
      (caught: unknown) => caught,
    );
    expect(sent(0).url).toBe('https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image');
    expect(sent(0).body).toMatchObject({ width: 512, height: 512 });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      message:
        'Stability AI request failed with status 404 (not_found): engine not found. The engine "stable-diffusion-v1-5" is no longer in Stability AI\'s documentation; choose stable-diffusion-xl-1024-v1-0 or use the Generate Image action.',
      status: 404,
    });
    expect(error).not.toHaveProperty('body');
  });

  it.each([[401], [429], [500]])('adds no retired-engine hint on status %i', async (status) => {
    rejectWith({ status, body: { id: 'e', name: 'other', message: 'nope' } });
    const error = await runAction({ action: textToImage, propsValue: { prompt: 'p', engine_id: 'stable-diffusion-512-v2-1' } }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toMatchObject({ message: `Stability AI request failed with status ${status} (other): nope` });
  });

  it('does not double the period when the vendor detail already ends a sentence', async () => {
    rejectWith({ status: 404, body: { id: 'e', name: 'not_found', message: 'The specified engine was not found.' } });
    await expect(runAction({ action: textToImage, propsValue: { prompt: 'p', engine_id: 'stable-diffusion-512-v2-1' } })).rejects.toThrow(
      'Stability AI request failed with status 404 (not_found): The specified engine was not found. The engine "stable-diffusion-512-v2-1"',
    );
  });

  it('refuses an engine id that is not a plain path segment', async () => {
    await expect(runAction({ action: textToImage, propsValue: { prompt: 'p', engine_id: '../user/balance' } })).rejects.toThrow(
      'Engine ID may contain only',
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Generate Image', () => {
  it('posts core requests without model or unset optionals and maps the response headers', async () => {
    respondPng();
    const result = await runAction({
      action: generateImage,
      propsValue: { model: 'core', prompt: 'a red fox', seed: 0, aspect_ratio: '16:9' },
    });
    expectMultipartImageRequest({ index: 0, path: '/v2beta/stable-image/generate/core' });
    expect(fieldNames(0)).toEqual(['aspect_ratio', 'prompt', 'seed']);
    expect(formOf(0).get('seed')).toBe('0');
    expect(result).toEqual({
      fileName: expect.stringMatching(/^generated-image-\d+\.png$/),
      url: expect.stringMatching(/^https:\/\/files\.test\/generated-image-\d+\.png$/),
      mimeType: 'image/png',
      seed: 42,
      finishReason: 'SUCCESS',
      requestId: 'req-1',
    });
    expect(write).toHaveBeenCalledWith({ fileName: expect.any(String), data: PNG_BYTES });
  });

  it('routes SD 3.5 models to the sd3 endpoint with model and mode', async () => {
    respondImage({ contentType: 'image/jpeg', headers: { 'finish-reason': 'CONTENT_FILTERED', seed: '7' } });
    const result = await runAction({
      action: generateImage,
      propsValue: { model: 'sd3.5-medium', prompt: 'a red fox', cfg_scale: 4, output_format: 'jpeg', output_file_name: 'fox' },
    });
    expectMultipartImageRequest({ index: 0, path: '/v2beta/stable-image/generate/sd3' });
    expect(formOf(0).get('model')).toBe('sd3.5-medium');
    expect(formOf(0).get('mode')).toBe('text-to-image');
    expect(formOf(0).get('cfg_scale')).toBe('4');
    expect(result).toMatchObject({ fileName: 'fox.jpeg', finishReason: 'CONTENT_FILTERED', requestId: null });
  });

  it.each([['ultra'], ['core']])('rejects CFG Scale for %s instead of dropping it', async (model) => {
    await expect(runAction({ action: generateImage, propsValue: { model, prompt: 'p', cfg_scale: 5 } })).rejects.toThrow(
      'CFG Scale is only supported by the SD 3.5 models',
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it.each([
    [{ seed: 4294967295 }, 'Seed must be between 0 and 4294967294.'],
    [{ seed: 1.5 }, 'Seed must be a whole number.'],
    [{ aspect_ratio: '7:3' }, 'Aspect Ratio must be one of'],
    [{ model: 'sd3-large' }, 'Model must be one of'],
  ])('rejects %j before any request', async (extra, message) => {
    await expect(runAction({ action: generateImage, propsValue: { model: 'core', prompt: 'p', ...extra } })).rejects.toThrow(message);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('decodes a Buffer v2beta error body into status, name and errors', async () => {
    rejectWith({
      status: 403,
      body: Buffer.from(JSON.stringify({ id: 'abc', name: 'content_moderation', errors: ['Your request was flagged by our content moderation system, as a result your request was denied and you were not charged.'] })),
    });
    const error = await runAction({ action: generateImage, propsValue: { model: 'core', prompt: 'un renard' } }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toMatchObject({
      message:
        'Stability AI request failed with status 403 (content_moderation): Your request was flagged by our content moderation system, as a result your request was denied and you were not charged. Rephrase the prompt (English works best).',
      status: 403,
      responseBody: { id: 'abc', name: 'content_moderation', errors: ['Your request was flagged by our content moderation system, as a result your request was denied and you were not charged.'] },
    });
    expect(error).not.toHaveProperty('body');
    expect(JSON.stringify(error)).not.toContain('un renard');
  });

  it('tells the user to rephrase after a 403 content moderation refusal', async () => {
    rejectWith({
      status: 403,
      body: Buffer.from(
        JSON.stringify({
          id: 'm',
          name: 'content_moderation',
          errors: ['Your request was flagged by our content moderation system, as a result your request was denied and you were not charged.'],
        }),
      ),
    });
    const error = await runAction({ action: generateImage, propsValue: { model: 'core', prompt: 'un vélo rouge' } }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toMatchObject({
      message:
        'Stability AI request failed with status 403 (content_moderation): Your request was flagged by our content moderation system, as a result your request was denied and you were not charged. Rephrase the prompt (English works best).',
      status: 403,
    });
  });

  it('adds no moderation hint to other 403 errors', async () => {
    rejectWith({ status: 403, body: { id: 'f', name: 'forbidden', errors: ['no access'] } });
    await expect(runAction({ action: generateImage, propsValue: { model: 'core', prompt: 'p' } })).rejects.toThrow(
      /^Stability AI request failed with status 403 \(forbidden\): no access$/,
    );
  });

  it('fails when the response is not an image', async () => {
    respondJson({ status: 200, body: Buffer.from(JSON.stringify({ name: 'odd', errors: ['not an image'] })) });
    await expect(runAction({ action: generateImage, propsValue: { model: 'core', prompt: 'p' } })).rejects.toThrow(
      'Stability AI returned application/json instead of an image (odd): not an image',
    );
    expect(write).not.toHaveBeenCalled();
  });

  it('fails on finish reason ERROR', async () => {
    respondImage({ contentType: 'image/png', headers: { 'finish-reason': 'ERROR' } });
    await expect(runAction({ action: generateImage, propsValue: { model: 'core', prompt: 'p' } })).rejects.toThrow(
      'finish reason ERROR',
    );
    expect(write).not.toHaveBeenCalled();
  });

  it('reports a timeout without the request body', async () => {
    const abort = new Error('This operation was aborted');
    abort.name = 'AbortError';
    sendRequest.mockRejectedValueOnce(abort);
    await expect(runAction({ action: generateImage, propsValue: { model: 'core', prompt: 'p' } })).rejects.toThrow(
      'Stability AI did not respond within 150 seconds. The job may still have run and been charged; check your balance before running it again.',
    );
  });

  it('does not mention charges when a read-only request times out', async () => {
    const abort = new Error('This operation was aborted');
    abort.name = 'AbortError';
    sendRequest.mockRejectedValueOnce(abort);
    const error = await runAction({ action: getAccountBalance, propsValue: {} }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ message: expect.stringMatching(/did not respond within \d+ seconds\.$/) });
  });
});

describe('Image to Image', () => {
  it('sends the image and strength to ultra without model or mode', async () => {
    respondPng();
    await runAction({ action: imageToImage, propsValue: { model: 'ultra', image: PHOTO, prompt: 'winter', strength: 0 } });
    expectMultipartImageRequest({ index: 0, path: '/v2beta/stable-image/generate/ultra' });
    expect(fieldNames(0)).toEqual(['image', 'prompt', 'strength']);
    expect(formOf(0).get('strength')).toBe('0');
    const file = formOf(0).get('image');
    expect(file).toBeInstanceOf(Blob);
    expect(file instanceof File ? file.name : '').toBe('photo.png');
  });

  it('uses image-to-image mode on sd3', async () => {
    respondPng();
    await runAction({ action: imageToImage, propsValue: { model: 'sd3.5-large', image: PHOTO, prompt: 'winter', strength: 0.6 } });
    expectMultipartImageRequest({ index: 0, path: '/v2beta/stable-image/generate/sd3' });
    expect(formOf(0).get('mode')).toBe('image-to-image');
    expect(formOf(0).get('model')).toBe('sd3.5-large');
  });

  it('requires strength and a real file', async () => {
    await expect(runAction({ action: imageToImage, propsValue: { model: 'ultra', image: PHOTO, prompt: 'p' } })).rejects.toThrow(
      'Strength is required.',
    );
    await expect(
      runAction({ action: imageToImage, propsValue: { model: 'ultra', image: 'not-a-file', prompt: 'p', strength: 0.5 } }),
    ).rejects.toThrow('Image must be a file.');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('refuses uploads over 10 MiB before sending', async () => {
    const big = new ApFile('big.png', Buffer.alloc(10 * 1024 * 1024 + 1), 'png');
    await expect(
      runAction({ action: imageToImage, propsValue: { model: 'ultra', image: big, prompt: 'p', strength: 0.5 } }),
    ).rejects.toThrow('at most 10485760 bytes');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Upscale Image', () => {
  it('sends only the image and format in fast mode', async () => {
    respondImage({ contentType: 'image/webp', headers: {} });
    const result = await runAction({ action: upscaleImage, propsValue: { mode: 'fast', image: PHOTO, output_format: 'webp' } });
    expectMultipartImageRequest({ index: 0, path: '/v2beta/stable-image/upscale/fast' });
    expect(fieldNames(0)).toEqual(['image', 'output_format']);
    expect(result).toMatchObject({ mimeType: 'image/webp', fileName: expect.stringMatching(/\.webp$/), seed: null });
  });

  it('rejects conservative-only inputs in fast mode with correct grammar', async () => {
    await expect(runAction({ action: upscaleImage, propsValue: { mode: 'fast', image: PHOTO, prompt: 'p' } })).rejects.toThrow(
      'Prompt only applies to the Conservative mode. Clear it or switch the mode.',
    );
    await expect(
      runAction({ action: upscaleImage, propsValue: { mode: 'fast', image: PHOTO, prompt: 'p', creativity: 0.3 } }),
    ).rejects.toThrow('Prompt, Creativity only apply to the Conservative mode. Clear them or switch the mode.');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('defaults the output format to webp', async () => {
    respondImage({ contentType: 'image/webp', headers: {} });
    await runAction({ action: upscaleImage, propsValue: { mode: 'fast', image: PHOTO } });
    expect(formOf(0).get('output_format')).toBe('webp');
  });

  it.each([
    [pngOfSize({ width: 1536, height: 1536 }), '1536x1536'],
    [jpegOfSize({ width: 2000, height: 500 }), '2000x500'],
    [pngOfSize({ width: 16, height: 1024 }), '16x1024'],
  ])('%#: refuses fast-mode inputs outside the vendor pixel limits before any request', async (image, size) => {
    await expect(runAction({ action: upscaleImage, propsValue: { mode: 'fast', image } })).rejects.toThrow(
      `this image is ${size}`,
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it.each([[pngOfSize({ width: 1024, height: 1024 })], [jpegOfSize({ width: 1024, height: 768 })]])(
    '%#: sends fast-mode inputs within the limits',
    async (image) => {
      respondImage({ contentType: 'image/webp', headers: {} });
      await runAction({ action: upscaleImage, propsValue: { mode: 'fast', image } });
      expect(sendRequest).toHaveBeenCalledTimes(1);
    },
  );

  it('does not pre-check the size in conservative mode', async () => {
    respondPng();
    await runAction({ action: upscaleImage, propsValue: { mode: 'conservative', image: pngOfSize({ width: 1536, height: 1536 }), prompt: 'p' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('explains an image over the Activepieces file limit using the limit from the engine error', async () => {
    respondPng();
    write.mockRejectedValueOnce(
      fileSizeError('{"message":"File size is larger than maximum supported size","currentFileSize":"25.7 MB","maximumSupportSize":"25 MB"}'),
    );
    await expect(runAction({ action: upscaleImage, propsValue: { mode: 'fast', image: PHOTO, output_format: 'png' } })).rejects.toThrow(
      /generated the image and charged the credits, but the .* MB file is larger than the Activepieces file size limit \(25 MB\)\. Run the step again with Output Format set to WebP or JPEG\./,
    );
  });

  it('uses the 10 MB Cloud limit when the engine reports it', async () => {
    respondPng();
    write.mockRejectedValueOnce(
      fileSizeError('{"message":"File size is larger than maximum supported size","currentFileSize":"12 MB","maximumSupportSize":"10 MB"}'),
    );
    await expect(runAction({ action: upscaleImage, propsValue: { mode: 'fast', image: PHOTO } })).rejects.toThrow(
      'larger than the Activepieces file size limit (10 MB).',
    );
  });

  it('names no number when the limit cannot be read', async () => {
    respondPng();
    write.mockRejectedValueOnce(fileSizeError('File size is larger than maximum supported size'));
    const error = await runAction({ action: upscaleImage, propsValue: { mode: 'fast', image: PHOTO } }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ message: expect.stringContaining('larger than the Activepieces file size limit. Run the step again') });
  });

  it('rethrows other storage errors unchanged', async () => {
    respondPng();
    write.mockRejectedValueOnce(new Error('storage down'));
    await expect(runAction({ action: upscaleImage, propsValue: { mode: 'fast', image: PHOTO } })).rejects.toThrow('storage down');
  });

  it('requires a prompt in conservative mode', async () => {
    await expect(runAction({ action: upscaleImage, propsValue: { mode: 'conservative', image: PHOTO } })).rejects.toThrow(
      'Prompt is required for the Conservative mode.',
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('sends the conservative request with creativity in range', async () => {
    respondPng();
    await runAction({ action: upscaleImage, propsValue: { mode: 'conservative', image: PHOTO, prompt: 'a cat', creativity: 0.2 } });
    expectMultipartImageRequest({ index: 0, path: '/v2beta/stable-image/upscale/conservative' });
    expect(fieldNames(0)).toEqual(['creativity', 'image', 'output_format', 'prompt']);
    expect(formOf(0).get('output_format')).toBe('webp');
    await expect(
      runAction({ action: upscaleImage, propsValue: { mode: 'conservative', image: PHOTO, prompt: 'a cat', creativity: 0.6 } }),
    ).rejects.toThrow('Creativity must be between 0.2 and 0.5.');
  });
});

describe('Creative Upscale (async)', () => {
  it('returns the generation id without waiting when asked not to wait', async () => {
    respondJson({ status: 200, body: { id: GENERATION_ID } });
    const result = await runAction({
      action: creativeUpscale,
      propsValue: { image: PHOTO, prompt: 'a cat', wait_for_result: 'no', creativity: 0.1 },
    });
    const request = sent(0);
    expect(request.url).toBe('https://api.stability.ai/v2beta/stable-image/upscale/creative');
    expect(request.headers?.['Accept']).toBe('application/json');
    expect(request.retries).toBe(0);
    expect(request.redactBodyInErrors).toBe(true);
    expect(fieldNames(0)).toEqual(['creativity', 'image', 'output_format', 'prompt']);
    expect(formOf(0).get('output_format')).toBe('webp');
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 'in-progress',
      generationId: GENERATION_ID,
      fileName: null,
      url: null,
      mimeType: null,
      seed: null,
      finishReason: null,
      requestId: null,
    });
  });

  it('polls every 10 seconds until the image is ready', async () => {
    vi.useFakeTimers();
    respondJson({ status: 200, body: { id: GENERATION_ID } });
    sendRequest.mockResolvedValueOnce({
      status: 202,
      headers: { 'content-type': 'application/json' },
      body: Buffer.from(JSON.stringify({ id: GENERATION_ID, status: 'in-progress' })),
    });
    respondPng();
    const pending = runAction({ action: creativeUpscale, propsValue: { image: PHOTO, prompt: 'a cat', wait_for_result: 'yes' } });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await pending;
    expect(sendRequest).toHaveBeenCalledTimes(3);
    expect(sent(1).url).toBe(`https://api.stability.ai/v2beta/results/${GENERATION_ID}`);
    expect(sent(1).method).toBe(HttpMethod.GET);
    expect(sent(1).timeout).toBe(30_000);
    expect(result).toMatchObject({ status: 'complete', generationId: GENERATION_ID, seed: 42, mimeType: 'image/png' });
  });

  it('keeps the generation id in the error when a poll fails after the job was charged', async () => {
    vi.useFakeTimers();
    respondJson({ status: 200, body: { id: GENERATION_ID } });
    sendRequest.mockResolvedValueOnce({
      status: 202,
      headers: {},
      body: Buffer.from(JSON.stringify({ id: GENERATION_ID, status: 'in-progress' })),
    });
    rejectWith({ status: 503, body: Buffer.from(JSON.stringify({ id: 'x', name: 'service_unavailable', errors: ['try later'] })) });
    const pending = runAction({ action: creativeUpscale, propsValue: { image: PHOTO, prompt: 'a cat', wait_for_result: 'yes' } }).catch(
      (caught: unknown) => caught,
    );
    await vi.advanceTimersByTimeAsync(20_000);
    const error = await pending;
    expect(sendRequest).toHaveBeenCalledTimes(3);
    expect(error).toMatchObject({
      message: `Stability AI request failed with status 503 (service_unavailable): try later. The job was started and charged; its generation ID is ${GENERATION_ID}. Use Get Generation Result to fetch it within 24 hours.`,
      status: 503,
      responseBody: { id: 'x', name: 'service_unavailable', errors: ['try later'] },
    });
  });

  it('does not suggest Get Generation Result when the finished image is too large to save', async () => {
    vi.useFakeTimers();
    respondJson({ status: 200, body: { id: GENERATION_ID } });
    respondPng();
    write.mockRejectedValueOnce(
      fileSizeError('{"message":"File size is larger than maximum supported size","currentFileSize":"12 MB","maximumSupportSize":"10 MB"}'),
    );
    const pending = runAction({ action: creativeUpscale, propsValue: { image: PHOTO, prompt: 'a cat', wait_for_result: 'yes' } }).catch(
      (caught: unknown) => caught,
    );
    await vi.advanceTimersByTimeAsync(20_000);
    const error = await pending;
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(error).toMatchObject({
      message: expect.stringMatching(/larger than the Activepieces file size limit \(10 MB\)\. Run the step again with Output Format set to WebP or JPEG\.$/),
    });
    expect(error).not.toMatchObject({ message: expect.stringContaining('Get Generation Result') });
  });

  it('stops polling within the 240 second budget so agent tool calls get the id', async () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    respondJson({ status: 200, body: { id: GENERATION_ID } });
    sendRequest.mockResolvedValue({
      status: 202,
      headers: {},
      body: Buffer.from(JSON.stringify({ id: GENERATION_ID, status: 'in-progress' })),
    });
    let finishedAt = 0;
    const pending = runAction({ action: creativeUpscale, propsValue: { image: PHOTO, prompt: 'a cat', wait_for_result: 'yes' } }).then(
      (output) => {
        finishedAt = Date.now();
        return output;
      },
    );
    await vi.advanceTimersByTimeAsync(400_000);
    const result = await pending;
    expect(stabilityClient.waitBudgetMs).toBe(240_000);
    expect(sendRequest).toHaveBeenCalledTimes(22);
    expect(finishedAt - startedAt).toBeLessThanOrEqual(240_000);
    expect(result).toMatchObject({ status: 'in-progress', generationId: GENERATION_ID, url: null });
  });

  it('counts a slow job start against the wait budget', async () => {
    vi.useFakeTimers();
    sendRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ status: 200, headers: { 'content-type': 'application/json' }, body: { id: GENERATION_ID } }),
            215_000,
          );
        }),
    );
    const pending = runAction({ action: creativeUpscale, propsValue: { image: PHOTO, prompt: 'a cat', wait_for_result: 'yes' } });
    await vi.advanceTimersByTimeAsync(215_000);
    const result = await pending;
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: 'in-progress', generationId: GENERATION_ID, url: null });
  });

  it('fails when the start response has no id', async () => {
    respondJson({ status: 200, body: {} });
    await expect(
      runAction({ action: creativeUpscale, propsValue: { image: PHOTO, prompt: 'a cat', wait_for_result: 'no' } }),
    ).rejects.toThrow('returned no generation ID');
  });
});

describe('Replace Background and Relight', () => {
  it('needs a background prompt or reference', async () => {
    await expect(
      runAction({ action: replaceBackgroundAndRelight, propsValue: { subject_image: PHOTO, wait_for_result: 'no' } }),
    ).rejects.toThrow('Give a Background Prompt or a Background Reference image.');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('explains how to relight only when keeping the original background without a prompt', async () => {
    await expect(
      runAction({
        action: replaceBackgroundAndRelight,
        propsValue: {
          subject_image: PHOTO,
          keep_original_background: 'true',
          light_source_direction: 'left',
          wait_for_result: 'no',
        },
      }),
    ).rejects.toThrow('To only change the lighting, describe the lighting in Background Prompt');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('sends a lighting-only request that keeps the original background', async () => {
    respondJson({ status: 200, body: { id: GENERATION_ID } });
    const result = await runAction({
      action: replaceBackgroundAndRelight,
      propsValue: {
        subject_image: PHOTO,
        background_prompt: 'warm sunset light from the left',
        keep_original_background: 'true',
        light_source_direction: 'left',
        light_source_strength: 0.7,
        wait_for_result: 'no',
      },
    });
    expect(sent(0).url).toBe('https://api.stability.ai/v2beta/stable-image/edit/replace-background-and-relight');
    expect(fieldNames(0)).toEqual([
      'background_prompt',
      'keep_original_background',
      'light_source_direction',
      'light_source_strength',
      'subject_image',
    ]);
    expect(formOf(0).get('keep_original_background')).toBe('true');
    expect(formOf(0).get('background_prompt')).toBe('warm sunset light from the left');
    expect(result).toMatchObject({ status: 'in-progress', generationId: GENERATION_ID });
  });

  it('needs a light reference or direction for light strength', async () => {
    await expect(
      runAction({
        action: replaceBackgroundAndRelight,
        propsValue: { subject_image: PHOTO, background_prompt: 'beach', light_source_strength: 0.5, wait_for_result: 'no' },
      }),
    ).rejects.toThrow('Light Source Strength needs');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('starts the job with the given fields', async () => {
    respondJson({ status: 200, body: { id: GENERATION_ID } });
    const result = await runAction({
      action: replaceBackgroundAndRelight,
      propsValue: {
        subject_image: PHOTO,
        background_reference: MASK,
        keep_original_background: 'false',
        light_source_direction: 'left',
        light_source_strength: 0,
        preserve_original_subject: 0,
        wait_for_result: 'no',
      },
    });
    expect(sent(0).url).toBe('https://api.stability.ai/v2beta/stable-image/edit/replace-background-and-relight');
    expect(fieldNames(0)).toEqual([
      'background_reference',
      'keep_original_background',
      'light_source_direction',
      'light_source_strength',
      'preserve_original_subject',
      'subject_image',
    ]);
    expect(formOf(0).get('keep_original_background')).toBe('false');
    expect(formOf(0).get('light_source_strength')).toBe('0');
    expect(result).toMatchObject({ status: 'in-progress', generationId: GENERATION_ID });
  });
});

describe('Get Generation Result', () => {
  it('returns in-progress on 202', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 202,
      headers: {},
      body: Buffer.from(JSON.stringify({ id: GENERATION_ID, status: 'in-progress' })),
    });
    const result = await runAction({ action: getGenerationResult, propsValue: { generation_id: ` ${GENERATION_ID} ` } });
    expect(sent(0)).toMatchObject({
      method: HttpMethod.GET,
      url: `https://api.stability.ai/v2beta/results/${GENERATION_ID}`,
      responseType: 'arraybuffer',
      retries: 0,
    });
    expect(sent(0).headers?.['Accept']).toBe('*/*');
    expect(result).toMatchObject({ status: 'in-progress', generationId: GENERATION_ID });
    expect(write).not.toHaveBeenCalled();
  });

  it('saves the image on 200', async () => {
    respondPng();
    const result = await runAction({ action: getGenerationResult, propsValue: { generation_id: GENERATION_ID, output_file_name: 'done.png' } });
    expect(result).toEqual({
      status: 'complete',
      generationId: GENERATION_ID,
      fileName: 'done.png',
      url: 'https://files.test/done.png',
      mimeType: 'image/png',
      seed: 42,
      finishReason: 'SUCCESS',
      requestId: 'req-1',
    });
  });

  it('rethrows a 404 with the status and vendor errors', async () => {
    rejectWith({ status: 404, body: Buffer.from(JSON.stringify({ id: 'x', name: 'not_found', errors: ['generation not found'] })) });
    await expect(runAction({ action: getGenerationResult, propsValue: { generation_id: GENERATION_ID } })).rejects.toThrow(
      'Stability AI request failed with status 404 (not_found): generation not found. Results are kept for 24 hours after the job starts and can only be fetched with the same API key that started it.',
    );
  });

  it('rejects an id that is not a generation id before any request', async () => {
    await expect(runAction({ action: getGenerationResult, propsValue: { generation_id: '../../v1/user/balance' } })).rejects.toThrow(
      'Generation ID must be the 64-character ID',
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('edit and control actions', () => {
  it.each([
    [eraseObject, { image: PHOTO, mask: MASK, grow_mask: 0 }, '/v2beta/stable-image/edit/erase', ['grow_mask', 'image', 'mask']],
    [
      inpaint,
      { image: PHOTO, prompt: 'a hat', grow_mask: 100, style_preset: 'anime' },
      '/v2beta/stable-image/edit/inpaint',
      ['grow_mask', 'image', 'prompt', 'style_preset'],
    ],
    [outpaint, { image: PHOTO, right: 256, left: 0 }, '/v2beta/stable-image/edit/outpaint', ['image', 'left', 'right']],
    [
      searchAndReplace,
      { image: PHOTO, search_prompt: 'dog', prompt: 'cat' },
      '/v2beta/stable-image/edit/search-and-replace',
      ['image', 'prompt', 'search_prompt'],
    ],
    [
      searchAndRecolor,
      { image: PHOTO, select_prompt: 'car', prompt: 'red car' },
      '/v2beta/stable-image/edit/search-and-recolor',
      ['image', 'prompt', 'select_prompt'],
    ],
    [removeBackground, { image: PHOTO, output_format: 'webp' }, '/v2beta/stable-image/edit/remove-background', ['image', 'output_format']],
    [
      sketchToImage,
      { image: PHOTO, prompt: 'castle', control_strength: 0 },
      '/v2beta/stable-image/control/sketch',
      ['control_strength', 'image', 'prompt'],
    ],
    [structureToImage, { image: PHOTO, prompt: 'castle' }, '/v2beta/stable-image/control/structure', ['image', 'prompt']],
    [
      styleGuide,
      { image: PHOTO, prompt: 'castle', fidelity: 1, aspect_ratio: '9:16' },
      '/v2beta/stable-image/control/style',
      ['aspect_ratio', 'fidelity', 'image', 'prompt'],
    ],
    [
      styleTransfer,
      { init_image: PHOTO, style_image: MASK, change_strength: 0.1 },
      '/v2beta/stable-image/control/style-transfer',
      ['change_strength', 'init_image', 'style_image'],
    ],
  ])('%#: sends the documented request', async (action, propsValue, path, fields) => {
    respondPng();
    const result = await runAction({ action, propsValue });
    expectMultipartImageRequest({ index: 0, path });
    expect(fieldNames(0)).toEqual(fields);
    expect(result).toMatchObject({ mimeType: 'image/png', seed: 42, finishReason: 'SUCCESS' });
  });

  it.each([
    [eraseObject, { image: PHOTO, grow_mask: 21 }, 'Grow Mask must be between 0 and 20.'],
    [inpaint, { image: PHOTO, prompt: '  ' }, 'Prompt is required.'],
    [outpaint, { image: PHOTO, left: 0, right: 0 }, 'Set at least one of Left, Right, Up or Down'],
    [outpaint, { image: PHOTO, up: 2001 }, 'Up must be between 0 and 2000.'],
    [searchAndReplace, { image: PHOTO, prompt: 'cat' }, 'Search Prompt is required.'],
    [removeBackground, { image: PHOTO, output_format: 'jpeg' }, 'Output Format must be one of: png, webp.'],
    [sketchToImage, { image: PHOTO, prompt: 'p', control_strength: 1.5 }, 'Control Strength must be between 0 and 1.'],
    [styleTransfer, { init_image: PHOTO, style_image: MASK, change_strength: 0 }, 'Change Strength must be between 0.1 and 1.'],
    [styleTransfer, { init_image: PHOTO }, 'Style Image is required.'],
  ])('%#: validates before any request', async (action, propsValue, message) => {
    await expect(runAction({ action, propsValue })).rejects.toThrow(message);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('account and engine actions', () => {
  it('returns the credit balance', async () => {
    respondJson({ status: 200, body: { credits: 0 } });
    expect(await runAction({ action: getAccountBalance, propsValue: {} })).toEqual({ credits: 0 });
    expect(sent(0)).toMatchObject({ method: HttpMethod.GET, url: 'https://api.stability.ai/v1/user/balance', retries: 0 });
  });

  it('maps the account details', async () => {
    respondJson({
      status: 200,
      body: {
        id: 'user-1',
        email: 'a@b.test',
        profile_picture: 'https://img.test/a.png',
        organizations: [{ id: 'org-1', name: 'Acme', role: 'OWNER', is_default: true }],
      },
    });
    expect(await runAction({ action: getAccountDetails, propsValue: {} })).toEqual({
      id: 'user-1',
      email: 'a@b.test',
      profilePicture: 'https://img.test/a.png',
      organizations: [{ id: 'org-1', name: 'Acme', role: 'OWNER', isDefault: true }],
    });
    expect(sent(0).url).toBe('https://api.stability.ai/v1/user/account');
  });

  it('steers agents to Generate Image, not the human-only Text to Image', () => {
    expect(listEngines.aiMetadata?.description).toContain('Generate Image');
    expect(listEngines.aiMetadata?.description).not.toContain('Text to Image');
  });

  it('trims the key in the Custom API Call auth mapping', async () => {
    const customApiCall = stabilityAi.actions()['custom_api_call'];
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"credits":1}', { status: 200, headers: { 'content-type': 'application/json' } }));
    const base = createMockActionContext<InputPropertyMap>({
      propsValue: { url: { url: 'https://api.stability.ai/v1/user/balance' }, method: HttpMethod.GET, headers: {}, queryParams: {}, failsafe: false, timeout: 0 },
    });
    await customApiCall.run({ ...base, auth: { type: AppConnectionType.CUSTOM_AUTH, props: { api_key: `  ${API_KEY}  ` } } });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0][1];
    expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${API_KEY}`);
    fetchSpy.mockRestore();
  });

  it('lists engines as a top-level array', async () => {
    respondJson({
      status: 200,
      body: [{ id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', description: 'desc', type: 'PICTURE', extra: 1 }],
    });
    expect(await runAction({ action: listEngines, propsValue: {} })).toEqual([
      { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', description: 'desc', type: 'PICTURE' },
    ]);
    expect(sent(0).url).toBe('https://api.stability.ai/v1/engines/list');
  });

  it('rethrows a v1 error with its message', async () => {
    rejectWith({ status: 500, body: '{"id":"z","name":"server_error","message":"boom"}' });
    await expect(runAction({ action: listEngines, propsValue: {} })).rejects.toThrow(
      'Stability AI request failed with status 500 (server_error): boom',
    );
  });
});

type StabilityActionContext = ActionContext<typeof stabilityAiAuth, InputPropertyMap>;

type TestAction = {
  run(context: StabilityActionContext): Promise<unknown>;
};

type RunActionParams = {
  action: TestAction;
  propsValue: StaticPropsValue<InputPropertyMap>;
};

type SentRequest = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  responseType?: string;
  timeout?: number;
  retries?: number;
  redactBodyInErrors?: boolean;
};

