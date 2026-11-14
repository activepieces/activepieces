import { describe, expect, it, vi } from 'vitest';
import { datalabFiles } from '../src/lib/common/files';
import { datalabGuards } from '../src/lib/common/guards';
import { datalabProps } from '../src/lib/common/props';
import { datalabSource } from '../src/lib/common/source';

describe('document source', () => {
  it('reads a file from a previous step and keeps its name and bytes', () => {
    const source = datalabSource.fromHuman({ source: 'file', input: { file: { filename: 'invoice.pdf', data: Buffer.from('%PDF'), extension: 'pdf' } }, noun: 'document' });
    expect(source).toEqual({ type: 'file', filename: 'invoice.pdf', data: Buffer.from('%PDF') });
  });

  it('adds the extension when the file name has none', () => {
    const source = datalabSource.fromHuman({ source: 'file', input: { file: { filename: 'scan', data: Buffer.from('x'), extension: 'png' } }, noun: 'form' });
    expect(source).toMatchObject({ filename: 'scan.png' });
  });

  it('says what to do when File is chosen but no file arrived', () => {
    for (const file of [undefined, null, 'https://example.com/a.pdf', { filename: 'a.pdf', data: Buffer.alloc(0) }]) {
      expect(() => datalabSource.fromHuman({ source: 'file', input: { file, file_url: 'https://example.com/a.pdf' }, noun: 'document' })).toThrow('Pick the document file to process, or switch Document Source to URL');
    }
  });

  it('reads a URL source and trims it', () => {
    expect(datalabSource.fromHuman({ source: 'url', input: { file_url: '  https://example.com/a.pdf ' }, noun: 'document' })).toEqual({ type: 'url', url: 'https://example.com/a.pdf' });
    expect(datalabSource.fromAi({ fileUrl: 'http://example.com/a.pdf', noun: 'document' })).toEqual({ type: 'url', url: 'http://example.com/a.pdf' });
  });

  it('shows only the field that matches the chosen source, under its own key, and requires it', () => {
    const fileProps = datalabSource.fileInputProps({ noun: 'form', fileTypes: 'PDF or image' });
    const urlProps = datalabSource.urlInputProps({ noun: 'form' });
    expect(Object.keys(fileProps)).toEqual(['file']);
    expect(fileProps.file).toMatchObject({ type: 'FILE', required: true });
    expect(Object.keys(urlProps)).toEqual(['file_url']);
    expect(urlProps.file_url).toMatchObject({ type: 'SHORT_TEXT', required: true });
    const props = datalabSource.humanProps({ noun: 'form' });
    expect(Object.keys(props)).toEqual(['source', 'document']);
    expect(props.document).toMatchObject({ type: 'DYNAMIC', required: true, refreshers: ['source'] });
  });

  it('asks for the missing value when the group is empty or was never loaded', () => {
    expect(() => datalabSource.fromHuman({ source: 'file', input: undefined, noun: 'form' })).toThrow('Pick the form file to process');
    expect(() => datalabSource.fromHuman({ source: 'url', input: {}, noun: 'form' })).toThrow('Give the File URL');
    expect(() => datalabSource.fromHuman({ source: 'url', input: 'https://example.com/a.pdf', noun: 'form' })).toThrow('Give the File URL');
  });

  it('rejects an empty URL and a URL that is not http or https', () => {
    expect(() => datalabSource.fromHuman({ source: 'url', input: { file_url: ' ' }, noun: 'form' })).toThrow('Give the File URL, a public link to the form, or switch Form Source to File');
    expect(() => datalabSource.fromAi({ fileUrl: undefined, noun: 'document' })).toThrow('Give file_url');
    expect(() => datalabSource.fromAi({ fileUrl: 'ftp://example.com/a.pdf', noun: 'document' })).toThrow('must start with http:// or https://');
    expect(() => datalabSource.fromAi({ fileUrl: 'data:application/pdf;base64,AAAA', noun: 'document' })).toThrow('must start with http:// or https://');
  });

  it('sends a file as a named Blob part with its type, and a URL as file_url', async () => {
    const fileForm = datalabSource.newForm({ source: { type: 'file', filename: 'form.PNG', data: Buffer.from('png-bytes') }, fields: { mode: 'fast' } });
    const part = fileForm.get('file');
    expect(part).toBeInstanceOf(Blob);
    if (part instanceof File) {
      expect(part.name).toBe('form.PNG');
      expect(part.type).toBe('image/png');
      expect(Buffer.from(await part.arrayBuffer()).toString()).toBe('png-bytes');
    }
    expect(fileForm.get('mode')).toBe('fast');
    expect(fileForm.has('file_url')).toBe(false);

    const urlForm = datalabSource.newForm({ source: { type: 'url', url: 'https://example.com/a.pdf' }, fields: {} });
    expect(urlForm.get('file_url')).toBe('https://example.com/a.pdf');
    expect(urlForm.has('file')).toBe(false);
  });

  it('falls back to a generic type for an unknown extension', () => {
    expect(datalabSource.mimeType('notes.xyz')).toBe('application/octet-stream');
    expect(datalabSource.mimeType('no-extension')).toBe('application/octet-stream');
    expect(datalabSource.mimeType('report.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });
});

describe('shared option readers', () => {
  it('accepts zero-based page ranges and strips spaces', () => {
    expect(datalabProps.readPageRange('0, 5-10 ,20')).toBe('0,5-10,20');
    expect(datalabProps.readPageRange('')).toBeUndefined();
    expect(datalabProps.readPageRange(undefined)).toBeUndefined();
  });

  it('rejects a page range that Datalab would refuse', () => {
    for (const value of ['abc', '1-', '-3', '1,,2', '1;2']) {
      expect(() => datalabProps.readPageRange(value), value).toThrow('is not valid');
    }
  });

  it('reads max pages and rejects zero, negatives and fractions', () => {
    expect(datalabProps.readMaxPages(3)).toBe(3);
    expect(datalabProps.readMaxPages('4')).toBe(4);
    expect(datalabProps.readMaxPages(null)).toBeUndefined();
    for (const value of [0, -1, 1.5, 'x']) {
      expect(() => datalabProps.readMaxPages(value), String(value)).toThrow('Max Pages must be a whole number');
    }
  });
});

describe('page range and max pages together', () => {
  it('drops max pages when a page range is set, because Datalab rejects a request that carries both', () => {
    expect(datalabProps.readPaging({ pageRange: '0-2', maxPages: 5 })).toEqual({ page_range: '0-2', max_pages: undefined });
    expect(datalabProps.readPaging({ pageRange: '', maxPages: 5 })).toEqual({ page_range: undefined, max_pages: 5 });
    expect(datalabProps.readPaging({ pageRange: undefined, maxPages: undefined })).toEqual({ page_range: undefined, max_pages: undefined });
  });

  it('still rejects a bad max pages value when a page range is set', () => {
    expect(() => datalabProps.readPaging({ pageRange: '0', maxPages: 0 })).toThrow('Max Pages must be a whole number');
  });
});

describe('saving result files', () => {
  it('decodes base64, writes the bytes once and returns the link, name and size', async () => {
    const write = vi.fn().mockResolvedValue('https://ap.example/v1/files/abc?token=t');
    const saved = await datalabFiles.saveBase64({ files: { write, upload: vi.fn() }, base64: Buffer.from('hello world').toString('base64'), fileName: 'filled form.pdf' });
    expect(saved).toEqual({ file: 'https://ap.example/v1/files/abc?token=t', file_name: 'filled form.pdf', size: 11 });
    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0][0].data.toString()).toBe('hello world');
  });

  it('keeps path separators and odd characters out of file names', () => {
    expect(datalabFiles.sanitizeFileName('../../etc/passwd')).toBe('.._.._etc_passwd');
    expect(datalabFiles.sanitizeFileName('quarter: 1?.docx')).toBe('quarter_ 1_.docx');
    expect(datalabFiles.sanitizeFileName('   ')).toBe('file');
  });

  it('adds or swaps the extension', () => {
    expect(datalabFiles.withExtension({ fileName: 'report', extension: 'docx', fallback: 'document' })).toBe('report.docx');
    expect(datalabFiles.withExtension({ fileName: 'report.DOCX', extension: 'docx', fallback: 'document' })).toBe('report.DOCX');
    expect(datalabFiles.withExtension({ fileName: 'form.pdf', extension: 'png', fallback: 'filled-form' })).toBe('form.png');
    expect(datalabFiles.withExtension({ fileName: undefined, extension: 'pdf', fallback: 'filled-form' })).toBe('filled-form.pdf');
  });
});

describe('guards', () => {
  it('parses JSON text and passes other values through', () => {
    expect(datalabGuards.parseJsonText('{"a":1}')).toEqual({ a: 1 });
    expect(datalabGuards.parseJsonText('{not json')).toBeUndefined();
    expect(datalabGuards.parseJsonText({ a: 1 })).toEqual({ a: 1 });
  });

  it('reads a list that arrives as a JSON string, as an Array prop does under the dynamic-value toggle', () => {
    expect(datalabGuards.list('[{"name":"Invoice"},"Letter"]')).toEqual([{ name: 'Invoice' }, 'Letter']);
    expect(datalabGuards.list('{"name":"Invoice"}')).toEqual([]);
    expect(datalabGuards.list('not json')).toEqual([]);
    expect(datalabGuards.list(undefined)).toEqual([]);
  });

  it('treats blank strings as missing and arrays as not records', () => {
    expect(datalabGuards.text('  ')).toBeUndefined();
    expect(datalabGuards.text('x')).toBe('x');
    expect(datalabGuards.isRecord([])).toBe(false);
    expect(datalabGuards.record(null)).toBeUndefined();
    expect(datalabGuards.numberList([0, '1', 2, Number.NaN])).toEqual([0, 2]);
  });
});
