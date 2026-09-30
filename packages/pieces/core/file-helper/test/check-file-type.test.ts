/// <reference types="vitest/globals" />

import { checkFileType } from '../src/lib/actions/check-file-type';
import { createMockActionContext, ApFile } from '@activepieces/pieces-framework';

describe('checkFileType', () => {
  test('matches correct MIME type', async () => {
    const file = new ApFile('photo.png', Buffer.from('fake-png'), 'png');
    const ctx = createMockActionContext({
      propsValue: {
        file,
        mimeTypes: ['image/png', 'image/jpeg'],
      },
    });
    const result = await checkFileType.run(ctx);
    expect(result).toEqual({
      mimeType: 'image/png',
      isMatch: true,
    });
  });

  test('matches a single selected MIME type exactly', async () => {
    const file = new ApFile('photo.png', Buffer.from('fake-png'), 'png');
    const ctx = createMockActionContext({
      propsValue: {
        file,
        mimeTypes: 'image/png',
      },
    });
    const result = await checkFileType.run(ctx);
    expect(result).toEqual({
      mimeType: 'image/png',
      isMatch: true,
    });
  });

  test('does not match a different single MIME type', async () => {
    const file = new ApFile('photo.png', Buffer.from('fake-png'), 'png');
    const ctx = createMockActionContext({
      propsValue: {
        file,
        mimeTypes: 'image/jpeg',
      },
    });
    const result = await checkFileType.run(ctx);
    expect(result).toEqual({
      mimeType: 'image/png',
      isMatch: false,
    });
  });

  test('does not match incorrect MIME type', async () => {
    const file = new ApFile('doc.pdf', Buffer.from('fake-pdf'), 'pdf');
    const ctx = createMockActionContext({
      propsValue: {
        file,
        mimeTypes: ['image/png', 'image/jpeg'],
      },
    });
    const result = await checkFileType.run(ctx);
    expect(result).toHaveProperty('isMatch', false);
  });
});
