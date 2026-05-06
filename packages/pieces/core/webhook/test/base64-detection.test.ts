import { convertBase64FieldsToUrls } from '@activepieces/pieces-common';
import { describe, expect, it, vi } from 'vitest';

const mockFiles = {
  write: vi.fn(async ({ fileName }: { fileName: string; data: Buffer }) =>
    `https://cdn.example.com/${fileName}`
  ),
};

function resetMock() {
  mockFiles.write.mockClear();
}

describe('base64 detection — should NOT convert', () => {
  it('ignores a SHA-256 hex hash (64 chars, all hex)', async () => {
    resetMock();
    const hash = '7e92c6a5559657afcd058d13384f32952d3daeb43accb7878deb31cd64f79367';
    const result = await convertBase64FieldsToUrls({ document_hash: hash }, mockFiles);
    expect(result).toEqual({ document_hash: hash });
    expect(mockFiles.write).not.toHaveBeenCalled();
  });

  it('ignores a SHA-512 hex hash (128 chars, all hex)', async () => {
    resetMock();
    const hash = 'a'.repeat(128);
    const result = await convertBase64FieldsToUrls({ hash }, mockFiles);
    expect(result).toEqual({ hash });
    expect(mockFiles.write).not.toHaveBeenCalled();
  });

  it('ignores a UUID (36 chars with hyphens)', async () => {
    resetMock();
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = await convertBase64FieldsToUrls({ id: uuid }, mockFiles);
    expect(result).toEqual({ id: uuid });
    expect(mockFiles.write).not.toHaveBeenCalled();
  });

  it('ignores a short base64 string under 200 chars', async () => {
    resetMock();
    const short = Buffer.alloc(100).toString('base64'); // ~137 chars
    const result = await convertBase64FieldsToUrls({ token: short }, mockFiles);
    expect(result).toEqual({ token: short });
    expect(mockFiles.write).not.toHaveBeenCalled();
  });

  it('ignores a long all-hex string (looks like base64 charset but is a hash)', async () => {
    resetMock();
    // 256 hex chars — long enough to pass the length check, but all-hex so rejected
    const longHex = 'deadbeef'.repeat(32);
    const result = await convertBase64FieldsToUrls({ fingerprint: longHex }, mockFiles);
    expect(result).toEqual({ fingerprint: longHex });
    expect(mockFiles.write).not.toHaveBeenCalled();
  });
});

describe('base64 detection — should convert', () => {
  it('converts a large raw base64 binary string (PDF magic bytes)', async () => {
    resetMock();
    // %PDF magic bytes followed by enough padding to exceed 200 chars
    const pdfBuffer = Buffer.concat([Buffer.from([0x25, 0x50, 0x44, 0x46]), Buffer.alloc(300)]);
    const pdfBase64 = pdfBuffer.toString('base64'); // ~405 chars, contains non-hex chars
    const result = await convertBase64FieldsToUrls({ document: pdfBase64 }, mockFiles) as Record<string, unknown>;
    expect(mockFiles.write).toHaveBeenCalledOnce();
    expect(typeof result['document']).toBe('string');
    expect(result['document']).toContain('cdn.example.com');
  });

  it('converts a data URI regardless of size', async () => {
    resetMock();
    const small = Buffer.alloc(10).toString('base64');
    const dataUri = `data:application/pdf;base64,${small}`;
    const result = await convertBase64FieldsToUrls({ doc: dataUri }, mockFiles) as Record<string, unknown>;
    expect(mockFiles.write).toHaveBeenCalledOnce();
    expect(result['doc']).toContain('cdn.example.com');
  });

  it('converts nested base64 fields recursively', async () => {
    resetMock();
    const pdfBuffer = Buffer.concat([Buffer.from([0x25, 0x50, 0x44, 0x46]), Buffer.alloc(300)]);
    const pdfBase64 = pdfBuffer.toString('base64');
    const input = { data: { components: [{ masked_document: pdfBase64, document_hash: '7e92c6a5559657afcd058d13384f32952d3daeb43accb7878deb31cd64f79367' }] } };
    const result = await convertBase64FieldsToUrls(input, mockFiles) as any;
    expect(mockFiles.write).toHaveBeenCalledOnce(); // only the PDF, not the hash
    expect(result.data.components[0].masked_document).toContain('cdn.example.com');
    expect(result.data.components[0].document_hash).toBe('7e92c6a5559657afcd058d13384f32952d3daeb43accb7878deb31cd64f79367');
  });
});
