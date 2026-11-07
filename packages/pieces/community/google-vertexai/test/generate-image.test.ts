import { ApFile, createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateImage } from '../src/lib/actions/generate-image';

const generateContent = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@google/genai');
  class FakeGoogleGenAI {
    models = { generateContent };
  }
  return { ...actual, GoogleGenAI: FakeGoogleGenAI };
});

const AUTH = {
  props: {
    serviceAccountJson: JSON.stringify({
      type: 'service_account',
      project_id: 'p',
      private_key: 'k',
      client_email: 'e@x',
    }),
  },
};

function run({ modelOptions, write }: { modelOptions: Record<string, unknown>; write: ReturnType<typeof vi.fn> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = generateImage.run;
  const propsValue = { location: 'us-central1', model: 'gemini-2.5-flash-image', prompt: 'a fox', modelOptions };
  return Promise.resolve(
    Reflect.apply(runFn, generateImage, [{ ...base, propsValue, auth: AUTH, files: { ...base.files, write } }]),
  );
}

function inlinePart({ mimeType, buffer }: { mimeType: string; buffer: Buffer }) {
  return { inlineData: { mimeType, data: buffer.toString('base64') } };
}

beforeEach(() => {
  generateContent.mockReset();
});

describe('generateImage with Gemini', () => {
  it('sends every input image to generateContent', async () => {
    const first = Buffer.from('aaa');
    const second = Buffer.from('bbb');
    generateContent.mockResolvedValue({
      candidates: [{ content: { parts: [inlinePart({ mimeType: 'image/png', buffer: Buffer.from('out') })] } }],
    });
    const write = vi.fn().mockResolvedValue('file-url');

    await run({
      write,
      modelOptions: {
        inputImage: [
          { image: new ApFile('a.png', first, 'png') },
          { image: new ApFile('b.jpg', second, 'jpg') },
        ],
      },
    });

    expect(generateContent).toHaveBeenCalledTimes(1);
    const request = generateContent.mock.calls[0][0];
    expect(request.contents[0].parts).toEqual([
      { text: 'a fox' },
      inlinePart({ mimeType: 'image/png', buffer: first }),
      inlinePart({ mimeType: 'image/jpeg', buffer: second }),
    ]);
  });

  it('saves only the final image, named from its mime type, and skips thought images', async () => {
    const finalBuffer = Buffer.from('final-jpeg-bytes');
    generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              { thought: true, ...inlinePart({ mimeType: 'image/png', buffer: Buffer.from('thought') }) },
              { text: 'here is your image' },
              inlinePart({ mimeType: 'image/jpeg', buffer: finalBuffer }),
            ],
          },
        },
      ],
    });
    const write = vi.fn().mockResolvedValue('file-url');

    const result = await run({ write, modelOptions: {} });

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith({
      fileName: `generated-image-1.${mime.extension('image/jpeg')}`,
      data: finalBuffer,
    });
    expect(result).toMatchObject({ images: [{ image: 'file-url' }] });
    expect(result).toHaveProperty('images.length', 1);
  });

  it('rejects when the response has no image parts', async () => {
    generateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'sorry' }] } }] });
    const write = vi.fn();

    await expect(run({ write, modelOptions: {} })).rejects.toThrow('No images were generated');
    expect(write).not.toHaveBeenCalled();
  });
});
