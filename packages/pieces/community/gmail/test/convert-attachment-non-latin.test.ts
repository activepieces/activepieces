import { describe, expect, it, vi } from 'vitest';
import { FilesService } from '@activepieces/pieces-framework';
import { Attachment } from 'mailparser';
import { convertAttachment } from '../src/lib/common/data';

function createMockFilesService() {
  const calls: { fileName: string; data: Buffer }[] = [];
  const files: FilesService = {
    write: vi.fn(
      async ({ fileName, data }: { fileName: string; data: Buffer }) => {
        calls.push({ fileName, data });
        // Simulate Node fetch / ByteString header constraint: character code > 255 throws TypeError
        for (let i = 0; i < fileName.length; i++) {
          const code = fileName.charCodeAt(i);
          if (code > 255) {
            throw new TypeError(
              `Cannot convert argument to a ByteString because the character at index ${i} has a value of ${code} which is greater than 255.`
            );
          }
        }
        return `https://files.activepieces.com/${fileName}`;
      }
    ),
    upload: vi.fn(),
  };
  return { files, calls };
}

function makeAttachment(filename: string): Attachment {
  return {
    filename,
    contentType: 'application/pdf',
    content: Buffer.from('dummy pdf content'),
    size: 17,
  } as unknown as Attachment;
}

describe('convertAttachment non-Latin filenames (Issue #16640)', () => {
  it.each([
    { lang: 'Hebrew', name: 'מסמך.pdf' },
    { lang: 'Arabic', name: 'تقرير.pdf' },
    { lang: 'Russian', name: 'отчет.pdf' },
    { lang: 'Chinese', name: '報告書.pdf' },
    { lang: 'Emoji', name: 'invoice_📑.pdf' },
  ])(
    'does not drop attachment with $lang filename ($name)',
    async ({ name }) => {
      const { files, calls } = createMockFilesService();
      const attachments = [makeAttachment(name)];

      const result = await convertAttachment(attachments, files);

      expect(result).toHaveLength(1);
      expect(result[0]?.fileName).toBe(name);
      expect(result[0]?.mimeType).toBe('application/pdf');
      expect(result[0]?.size).toBe(17);
      expect(result[0]?.data).toBeDefined();

      // Verify files.write was called with an ASCII-safe name (no charCode > 255)
      expect(calls).toHaveLength(1);
      for (let i = 0; i < calls[0].fileName.length; i++) {
        expect(calls[0].fileName.charCodeAt(i)).toBeLessThanOrEqual(255);
      }
    }
  );

  it('keeps standard ASCII filenames untouched', async () => {
    const { files, calls } = createMockFilesService();
    const attachments = [makeAttachment('invoice.pdf')];

    const result = await convertAttachment(attachments, files);

    expect(result).toHaveLength(1);
    expect(result[0]?.fileName).toBe('invoice.pdf');
    expect(calls[0].fileName).toBe('invoice.pdf');
  });

  it('falls back to safe ASCII filename if files.write throws on encoded name', async () => {
    const calls: string[] = [];
    let firstCall = true;
    const files: FilesService = {
      write: vi.fn(async ({ fileName }: { fileName: string }) => {
        calls.push(fileName);
        if (firstCall) {
          firstCall = false;
          throw new Error('Upload header error');
        }
        return `https://files.activepieces.com/${fileName}`;
      }),
      upload: vi.fn(),
    };

    const attachments = [makeAttachment('מסמך.pdf')];
    const result = await convertAttachment(attachments, files);

    expect(result).toHaveLength(1);
    expect(result[0]?.fileName).toBe('מסמך.pdf');
    expect(result[0]?.data).toContain('https://files.activepieces.com/');
    expect(calls.length).toBe(2);
    expect(calls[1]).toMatch(/^attachment-\d+\.pdf$/);
  });
});
