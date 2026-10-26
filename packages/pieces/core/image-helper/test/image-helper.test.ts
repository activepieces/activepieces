/// <reference types="vitest/globals" />

import jimp from 'jimp';
import { imageToBase64 } from '../src/lib/actions/image-to-base64.action';
import { cropImage } from '../src/lib/actions/crop-image.action';
import { rotateImage } from '../src/lib/actions/rotate-image.action';
import { resizeImage } from '../src/lib/actions/resize-Image.action';
import { compressImage } from '../src/lib/actions/compress-image.actions';
import { createMockActionContext, ApFile } from '@activepieces/pieces-framework';

async function createTestImage(width = 10, height = 10): Promise<ApFile> {
  const image = new jimp(width, height, 0xff0000ff);
  const buffer = await image.getBufferAsync('image/png');
  return new ApFile('test.png', buffer, 'png');
}

describe('imageToBase64', () => {
  test('converts image to base64 data URI', async () => {
    const file = await createTestImage();
    const ctx = createMockActionContext({
      propsValue: { image: file, override_mime_type: undefined },
    });
    const result = await imageToBase64.run(ctx);
    expect(result).toBe(`data:image/png;base64,${file.base64}`);
  });

  test('uses override MIME type', async () => {
    const file = await createTestImage();
    const ctx = createMockActionContext({
      propsValue: { image: file, override_mime_type: 'image/jpeg' },
    });
    const result = await imageToBase64.run(ctx);
    expect((result as string).startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  test('falls back to image/png for an unknown extension', async () => {
    const file = await createNamedImageFile({ fileName: 'photo.unknownext', extension: 'unknownext' });
    const ctx = createMockActionContext({
      propsValue: { image: file, override_mime_type: undefined },
    });
    const result = await imageToBase64.run(ctx);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  test('reads the MIME type from the file name when there is no extension', async () => {
    const file = await createNamedImageFile({ fileName: 'photo.jpg', extension: undefined });
    const ctx = createMockActionContext({
      propsValue: { image: file, override_mime_type: undefined },
    });
    const result = await imageToBase64.run(ctx);
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  test('override MIME type wins over an unknown extension', async () => {
    const file = await createNamedImageFile({ fileName: 'photo.unknownext', extension: 'unknownext' });
    const ctx = createMockActionContext({
      propsValue: { image: file, override_mime_type: 'image/webp' },
    });
    const result = await imageToBase64.run(ctx);
    expect(result).toMatch(/^data:image\/webp;base64,/);
  });

  test('falls back to image/png when neither the extension nor the file name gives a type', async () => {
    const file = await createNamedImageFile({ fileName: 'photo', extension: undefined });
    const ctx = createMockActionContext({
      propsValue: { image: file, override_mime_type: undefined },
    });
    const result = await imageToBase64.run(ctx);
    expect(result).toBe(`data:image/png;base64,${file.base64}`);
  });

  test('override MIME type wins over a missing extension', async () => {
    const file = await createNamedImageFile({ fileName: 'photo', extension: undefined });
    const ctx = createMockActionContext({
      propsValue: { image: file, override_mime_type: 'image/gif' },
    });
    const result = await imageToBase64.run(ctx);
    expect(result).toBe(`data:image/gif;base64,${file.base64}`);
  });
});

async function createNamedImageFile({ fileName, extension }: { fileName: string; extension: string | undefined }): Promise<ApFile> {
  const image = new jimp(10, 10, 0xff0000ff);
  const buffer = await image.getBufferAsync('image/png');
  return new ApFile(fileName, buffer, extension);
}

describe('cropImage', () => {
  test('crops image to specified dimensions', async () => {
    const file = await createTestImage(20, 20);
    const ctx = createMockActionContext({
      propsValue: {
        image: file,
        left: 0,
        top: 0,
        width: 10,
        height: 10,
        resultFileName: 'cropped',
      },
    });
    const result = await cropImage.run(ctx);
    expect(result).toBe('test-file-url');
  });
});

describe('rotateImage', () => {
  test('rotates image 90 degrees', async () => {
    const file = await createTestImage();
    const ctx = createMockActionContext({
      propsValue: {
        image: file,
        degree: 90,
        resultFileName: 'rotated',
      },
    });
    const result = await rotateImage.run(ctx);
    expect(result).toBe('test-file-url');
  });

});

describe('resizeImage', () => {
  test('resizes image to specified dimensions', async () => {
    const file = await createTestImage(20, 20);
    const ctx = createMockActionContext({
      propsValue: {
        image: file,
        width: 10,
        height: 10,
        aspectRatio: false,
        resultFileName: 'resized',
      },
    });
    const result = await resizeImage.run(ctx);
    expect(result).toBe('test-file-url');
  });

});

describe('compressImage', () => {
  test('compresses image as JPEG', async () => {
    const file = await createTestImage();
    const ctx = createMockActionContext({
      propsValue: {
        image: file,
        quality: 90,
        format: 'image/jpeg',
        resultFileName: 'compressed',
      },
    });
    const result = await compressImage.run(ctx);
    expect(result).toBe('test-file-url');
  });

});
