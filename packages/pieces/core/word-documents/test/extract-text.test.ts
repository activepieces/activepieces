/// <reference types="vitest/globals" />

import { readFileSync } from 'fs';
import { join } from 'path';
import { extractText } from '../src/lib/actions/extract-text';
import { createMockActionContext, ApFile } from '@activepieces/pieces-framework';

function runWithFile({ data, password }: { data: Buffer; password?: string }) {
  const file = new ApFile('document.docx', data, 'docx');
  return extractText.run(createMockActionContext({ propsValue: { file, password } }));
}

function fixture(name: string): Buffer {
  return readFileSync(join(__dirname, 'data', name));
}

describe('extractText', () => {
  test('returns body, tables, footnotes, headers and footers', async () => {
    const result = await runWithFile({ data: fixture('sample.docx') });
    expect(result.text).toContain('Body with footnote');
    expect(result.text).toContain('LINK_TEXT');
    expect(result.text).toContain('Unicode: héllo — 日本語 — مرحبا — 😀');
    expect(result.text).toMatch(/A1\s*\|\s*B1/);
    expect(result.text).toMatch(/Line one\nLine two/);
    expect(result.text).toContain('FOOTNOTE_TEXT');
    expect(result.headers).toBe('HEADER_TEXT');
    expect(result.footers).toBe('FOOTER_TEXT');
  });

  test('opens a password-protected document with its password', async () => {
    const result = await runWithFile({ data: fixture('password-protected.docx'), password: 'secret' });
    expect(result.text).toContain('Body with footnote');
  });

  test('asks for the password when it is missing', async () => {
    await expect(runWithFile({ data: fixture('password-protected.docx') })).rejects.toThrow(
      'This document is password-protected. Enter its password in the Password field.',
    );
  });

  test('reports a wrong password', async () => {
    await expect(runWithFile({ data: fixture('password-protected.docx'), password: 'wrong' })).rejects.toThrow(
      'The password is incorrect for this document.',
    );
  });

  test('rejects legacy .doc files with a save-as hint', async () => {
    const legacyDoc = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(504)]);
    await expect(runWithFile({ data: legacyDoc })).rejects.toThrow('save it as .docx');
  });

  test('rejects files that are not Word documents', async () => {
    await expect(runWithFile({ data: Buffer.from('plain text, not a document') })).rejects.toThrow(
      'This file could not be read as a Word document (.docx).',
    );
  });
});
