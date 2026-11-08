import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ApFile } from '@activepieces/pieces-framework';
import {
  PHOTOROOM_IMAGE_API_BASE_URL,
  PHOTOROOM_SEGMENT_URL,
  PhotoroomApiError,
  photoroomClient,
} from '../src/lib/common/client';
import { photoroomAuth } from '../src/lib/auth';
import { editImage } from '../src/lib/actions/edit-image';
import { generateImage } from '../src/lib/actions/generate-image';
import { getAccountDetails } from '../src/lib/actions/get-account-details';
import { removeBackground } from '../src/lib/actions/remove-background';

const imageBytes = Buffer.from('fake-image-bytes');

function makeFile(name: string): ApFile {
  return new ApFile(name, imageBytes, 'png');
}

async function readFilePart({ form, name }: { form: FormData; name: string }) {
  const entry = form.get(name);
  expect(entry).toBeInstanceOf(File);
  if (!(entry instanceof File)) {
    throw new Error(`form field ${name} is not a file`);
  }
  return {
    fileName: entry.name,
    content: Buffer.from(await entry.arrayBuffer()),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildRemoveBackgroundFormData', () => {
  it('appends the image under image_file with its real filename and content', async () => {
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: makeFile('cat.png'),
    });
    const part = await readFilePart({ form, name: 'image_file' });
    expect(part.fileName).toBe('cat.png');
    expect(part.content.equals(imageBytes)).toBe(true);
  });

  it('omits every optional field that is unset', () => {
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: makeFile('cat.png'),
    });
    for (const name of [
      'format',
      'channels',
      'bg_color',
      'size',
      'crop',
      'despill',
    ]) {
      expect(form.has(name)).toBe(false);
    }
  });

  it('sends optional fields under the documented names, including explicit false', () => {
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: makeFile('cat.png'),
      format: 'jpg',
      channels: 'alpha',
      bgColor: 'white',
      size: 'preview',
      crop: true,
      despill: false,
    });
    expect(form.get('format')).toBe('jpg');
    expect(form.get('channels')).toBe('alpha');
    expect(form.get('bg_color')).toBe('white');
    expect(form.get('size')).toBe('preview');
    expect(form.get('crop')).toBe('true');
    expect(form.get('despill')).toBe('false');
  });

  it('drops empty-string values instead of sending them', () => {
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: makeFile('cat.png'),
      bgColor: '',
    });
    expect(form.has('bg_color')).toBe(false);
  });
});

describe('buildEditImageFormData', () => {
  it('always sends removeBackground explicitly, defaulting to true', () => {
    const form = photoroomClient.buildEditImageFormData({
      image: makeFile('product.png'),
    });
    expect(form.get('removeBackground')).toBe('true');
  });

  it('skips a cleared background image that the engine resolves to null', () => {
    const form = photoroomClient.buildEditImageFormData({
      image: makeFile('product.png'),
      backgroundImage: null,
    });
    expect(form.has('background.imageFile')).toBe(false);
    expect(form.has('imageFile')).toBe(true);
  });

  it('round-trips an explicit removeBackground=false', () => {
    const form = photoroomClient.buildEditImageFormData({
      image: makeFile('product.png'),
      removeBackground: false,
    });
    expect(form.get('removeBackground')).toBe('false');
  });

  it('uses the documented dot-notation field names and stringifies numbers', async () => {
    const form = photoroomClient.buildEditImageFormData({
      image: makeFile('product.png'),
      backgroundPrompt: 'on a marble table',
      backgroundColor: 'FF0000',
      backgroundImage: makeFile('backdrop.jpg'),
      backgroundSeed: 42,
      shadowMode: 'ai.soft',
      lightingMode: 'ai.auto',
      textRemovalMode: 'ai.all',
      upscaleMode: 'ai.fast',
      expandMode: 'ai.auto',
      uncropMode: 'ai.auto',
      beautifyMode: 'ai.food',
      padding: '10%',
      margin: '100px',
      outputSize: '1600x1600',
      exportFormat: 'webp',
      exportDpi: 300,
    });
    const imagePart = await readFilePart({ form, name: 'imageFile' });
    expect(imagePart.fileName).toBe('product.png');
    const backgroundPart = await readFilePart({
      form,
      name: 'background.imageFile',
    });
    expect(backgroundPart.fileName).toBe('backdrop.jpg');
    expect(form.get('background.prompt')).toBe('on a marble table');
    expect(form.get('background.color')).toBe('FF0000');
    expect(form.get('background.seed')).toBe('42');
    expect(form.get('shadow.mode')).toBe('ai.soft');
    expect(form.get('lighting.mode')).toBe('ai.auto');
    expect(form.get('textRemoval.mode')).toBe('ai.all');
    expect(form.get('upscale.mode')).toBe('ai.fast');
    expect(form.get('expand.mode')).toBe('ai.auto');
    expect(form.get('uncrop.mode')).toBe('ai.auto');
    expect(form.get('beautify.mode')).toBe('ai.food');
    expect(form.get('padding')).toBe('10%');
    expect(form.get('margin')).toBe('100px');
    expect(form.get('outputSize')).toBe('1600x1600');
    expect(form.get('export.format')).toBe('webp');
    expect(form.get('export.dpi')).toBe('300');
  });

  it('omits unset optional fields entirely', () => {
    const form = photoroomClient.buildEditImageFormData({
      image: makeFile('product.png'),
    });
    const names = [...form.keys()];
    expect(names.sort()).toEqual(['imageFile', 'removeBackground']);
  });
});

describe('buildGenerateImageFormData', () => {
  it('sends the imageFromPrompt fields and no input image', () => {
    const form = photoroomClient.buildGenerateImageFormData({
      prompt: 'a red bicycle on a beach',
      seed: 7,
      size: 'SQUARE_HD',
      exportFormat: 'png',
    });
    expect(form.get('imageFromPrompt.prompt')).toBe('a red bicycle on a beach');
    expect(form.get('imageFromPrompt.seed')).toBe('7');
    expect(form.get('imageFromPrompt.size')).toBe('SQUARE_HD');
    expect(form.get('export.format')).toBe('png');
    expect(form.has('imageFile')).toBe(false);
  });

  it('sends only the prompt when the optionals are unset', () => {
    const form = photoroomClient.buildGenerateImageFormData({
      prompt: 'a red bicycle',
    });
    expect([...form.keys()]).toEqual(['imageFromPrompt.prompt']);
  });
});

describe('sendRemoveBackgroundRequest', () => {
  it('requests the segment endpoint as binary and parses the uncertainty header', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: { 'x-uncertainty-score': '0.12' },
      body: imageBytes,
    });
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: makeFile('cat.png'),
    });
    const result = await photoroomClient.sendRemoveBackgroundRequest({
      apiKey: 'test-key',
      form,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe(PHOTOROOM_SEGMENT_URL);
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.responseType).toBe('arraybuffer');
    expect(request.headers?.['x-api-key']).toBe('test-key');
    expect(request.body).toBe(form);
    expect(result.data.equals(imageBytes)).toBe(true);
    expect(result.uncertaintyScore).toBe(0.12);
  });

  it('rethrows HTTP failures with the status and the decoded vendor detail', async () => {
    const vendorBody = Buffer.from(
      JSON.stringify({
        detail: 'You ran out of credits.',
        status_code: 402,
        type: 'payment_required',
      })
    );
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError(undefined, { status: 402, responseBody: vendorBody })
    );
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: makeFile('cat.png'),
    });
    const promise = photoroomClient.sendRemoveBackgroundRequest({
      apiKey: 'test-key',
      form,
    });
    await expect(promise).rejects.toBeInstanceOf(PhotoroomApiError);
    await expect(promise).rejects.toMatchObject({
      status: 402,
      message: expect.stringContaining('402'),
    });
    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining('You ran out of credits.'),
    });
  });
});

describe('sendEditRequest', () => {
  it('requests /v2/edit as binary and parses the edit response headers', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {
        'x-uncertainty-score': '0.5',
        'pr-ai-background-seed': '12345',
      },
      body: imageBytes,
    });
    const form = photoroomClient.buildEditImageFormData({
      image: makeFile('product.png'),
    });
    const result = await photoroomClient.sendEditRequest({
      apiKey: 'test-key',
      form,
    });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe(`${PHOTOROOM_IMAGE_API_BASE_URL}/v2/edit`);
    expect(request.responseType).toBe('arraybuffer');
    expect(result.aiBackgroundSeed).toBe(12345);
    expect(result.uncertaintyScore).toBe(0.5);
  });
});

describe('decodeErrorBody', () => {
  it('decodes a Buffer of vendor JSON to the detail message', () => {
    const body = Buffer.from(
      JSON.stringify({
        detail: 'Image is too large',
        status_code: 400,
        type: 'bad_request',
      })
    );
    expect(photoroomClient.decodeErrorBody({ body })).toBe(
      'Image is too large'
    );
  });

  it('decodes a JSON string body to the detail message', () => {
    const body = JSON.stringify({ detail: 'Invalid API key' });
    expect(photoroomClient.decodeErrorBody({ body })).toBe('Invalid API key');
  });

  it('reads the detail from an already-parsed object body', () => {
    expect(
      photoroomClient.decodeErrorBody({ body: { detail: 'Forbidden' } })
    ).toBe('Forbidden');
  });

  it('falls back to the raw text when the body is not JSON', () => {
    expect(photoroomClient.decodeErrorBody({ body: 'Gateway timeout' })).toBe(
      'Gateway timeout'
    );
    expect(photoroomClient.decodeErrorBody({ body: '' })).toBeUndefined();
    expect(
      photoroomClient.decodeErrorBody({ body: undefined })
    ).toBeUndefined();
  });

  it('extracts the nested error.message the live /v2/account 401 returns', () => {
    const accountErrorShape = {
      error: { message: 'The API key could not be authenticated.' },
    };
    expect(photoroomClient.decodeErrorBody({ body: accountErrorShape })).toBe(
      'The API key could not be authenticated.'
    );
    expect(
      photoroomClient.decodeErrorBody({
        body: JSON.stringify(accountErrorShape),
      })
    ).toBe('The API key could not be authenticated.');
    expect(
      photoroomClient.decodeErrorBody({
        body: Buffer.from(JSON.stringify(accountErrorShape)),
      })
    ).toBe('The API key could not be authenticated.');
  });

  it('extracts a top-level message when detail and error.message are absent', () => {
    expect(
      photoroomClient.decodeErrorBody({
        body: { message: 'Too many requests' },
      })
    ).toBe('Too many requests');
  });

  it('prefers detail over error.message over message when several are present', () => {
    expect(
      photoroomClient.decodeErrorBody({
        body: {
          detail: 'detail wins',
          error: { message: 'nested loses' },
          message: 'top-level loses',
        },
      })
    ).toBe('detail wins');
    expect(
      photoroomClient.decodeErrorBody({
        body: {
          error: { message: 'nested wins' },
          message: 'top-level loses',
        },
      })
    ).toBe('nested wins');
  });
});

describe('toPhotoroomError', () => {
  it('keeps non-HTTP failures without inventing a status', () => {
    const error = photoroomClient.toPhotoroomError({
      error: new Error('socket hang up'),
    });
    expect(error.status).toBeUndefined();
    expect(error.message).toContain('socket hang up');
  });
});

describe('fetchAccountDetails', () => {
  it('maps the v2 account body and drops unmodelled keys', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: {
        plan: 'basic',
        images: { available: 95, subscription: 100, somethingElse: true },
        extraneous: 'x',
      },
    });
    const result = await photoroomClient.fetchAccountDetails({
      apiKey: 'test-key',
    });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe(`${PHOTOROOM_IMAGE_API_BASE_URL}/v2/account`);
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.headers?.['x-api-key']).toBe('test-key');
    expect(result).toEqual({
      plan: 'basic',
      images: { available: 95, subscription: 100 },
    });
  });
});

describe('auth validate', () => {
  const authServer = {
    apiUrl: 'http://localhost:3000/api/',
    publicUrl: 'http://localhost:3000/',
    mintOidcToken: async () => 'test-token',
  };

  async function runValidate(apiKey: string) {
    const validate = photoroomAuth.validate;
    if (validate === undefined) {
      throw new Error('photoroomAuth has no validate function');
    }
    return validate({ auth: { apiKey }, server: authServer });
  }

  it('returns valid for a key the account endpoint accepts', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { plan: 'basic', images: { available: 10, subscription: 100 } },
    });
    const result = await runValidate('good-key');
    expect(result).toEqual({ valid: true });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe(`${PHOTOROOM_IMAGE_API_BASE_URL}/v2/account`);
    expect(request.headers?.['x-api-key']).toBe('good-key');
  });

  it.each([[401], [403]])(
    'reports a %d as an invalid key with the vendor detail',
    async (status) => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        new HttpError(undefined, {
          status,
          responseBody: { detail: 'Invalid API key provided' },
        })
      );
      const result = await runValidate('bad-key');
      expect(result.valid).toBe(false);
      if (result.valid) {
        throw new Error('expected an invalid result');
      }
      expect(result.error).toContain('Invalid API key provided');
      expect(result.error).toContain(String(status));
      expect(result.error).not.toContain('Could not verify');
    }
  );

  it('surfaces the vendor text of the live 401 error.message shape', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError(undefined, {
        status: 401,
        responseBody: {
          error: { message: 'The API key could not be authenticated.' },
        },
      })
    );
    const result = await runValidate('bad-key');
    expect(result.valid).toBe(false);
    if (result.valid) {
      throw new Error('expected an invalid result');
    }
    expect(result.error).toContain('401');
    expect(result.error).toContain('The API key could not be authenticated.');
  });

  it.each([[429], [500]])(
    'reports a %d as unverifiable, never as an invalid key',
    async (status) => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        new HttpError(undefined, {
          status,
          responseBody: { detail: 'Try again later' },
        })
      );
      const result = await runValidate('good-key');
      expect(result.valid).toBe(false);
      if (result.valid) {
        throw new Error('expected an invalid result');
      }
      expect(result.error).toContain('Could not verify');
      expect(result.error).toContain(String(status));
      expect(result.error).toContain('Try again later');
      expect(result.error.toLowerCase()).not.toContain('invalid');
    }
  );

  it('reports a network failure as unverifiable with the cause', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new Error('getaddrinfo ENOTFOUND image-api.photoroom.com')
    );
    const result = await runValidate('good-key');
    expect(result.valid).toBe(false);
    if (result.valid) {
      throw new Error('expected an invalid result');
    }
    expect(result.error).toContain('Could not verify');
    expect(result.error).toContain('getaddrinfo ENOTFOUND');
    expect(result.error.toLowerCase()).not.toContain('invalid');
  });
});

describe('zero and negative values are never truthiness-gated', () => {
  it('sends a zero background seed and a zero export dpi', () => {
    const form = photoroomClient.buildEditImageFormData({
      image: makeFile('product.png'),
      backgroundSeed: 0,
      exportDpi: 0,
    });
    expect(form.get('background.seed')).toBe('0');
    expect(form.get('export.dpi')).toBe('0');
  });

  it('parses the -1 uncertainty score returned for images with humans', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: { 'x-uncertainty-score': '-1' },
      body: imageBytes,
    });
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: makeFile('person.png'),
    });
    const result = await photoroomClient.sendRemoveBackgroundRequest({
      apiKey: 'test-key',
      form,
    });
    expect(result.uncertaintyScore).toBe(-1);
  });

  it('returns no score when the header is absent or not numeric', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: { 'x-uncertainty-score': 'not-a-number' },
      body: imageBytes,
    });
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: makeFile('cat.png'),
    });
    const result = await photoroomClient.sendRemoveBackgroundRequest({
      apiKey: 'test-key',
      form,
    });
    expect(result.uncertaintyScore).toBeUndefined();
    expect(result.aiBackgroundSeed).toBeUndefined();
  });
});

describe('shipped action contract', () => {
  it('keeps the published action and prop names', () => {
    expect(removeBackground.name).toBe('removeBackground');
    expect(Object.keys(removeBackground.props)).toContain('file');
    expect(Object.keys(removeBackground.props)).toContain('filename');
    expect(editImage.name).toBe('edit_image');
    expect(generateImage.name).toBe('generate_image');
    expect(getAccountDetails.name).toBe('get_account_details');
  });
});
