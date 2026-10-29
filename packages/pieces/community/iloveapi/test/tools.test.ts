import { afterEach, describe, expect, it, vi } from 'vitest';
import { fileToUploadInput } from '../src/lib/common/props';
import { compressPdfAction } from '../src/lib/actions/compress-pdf';
import { mergePdfAction } from '../src/lib/actions/merge-pdf';
import { splitPdfAction } from '../src/lib/actions/split-pdf';
import { pdfToJpgAction } from '../src/lib/actions/pdf-to-jpg';
import { jpgToPdfAction } from '../src/lib/actions/jpg-to-pdf';
import { officeToPdfAction } from '../src/lib/actions/office-to-pdf';
import { htmlToPdfAction } from '../src/lib/actions/html-to-pdf';
import { ocrPdfAction } from '../src/lib/actions/ocr-pdf';
import { watermarkPdfAction } from '../src/lib/actions/watermark-pdf';
import { protectPdfAction } from '../src/lib/actions/protect-pdf';
import { unlockPdfAction } from '../src/lib/actions/unlock-pdf';
import { pageNumbersPdfAction } from '../src/lib/actions/page-numbers';
import { rotatePdfAction } from '../src/lib/actions/rotate-pdf';
import { extractTextPdfAction } from '../src/lib/actions/extract-text';
import { repairPdfAction } from '../src/lib/actions/repair-pdf';
import { convertPdfaAction } from '../src/lib/actions/convert-pdf-to-pdfa';
import { validatePdfaAction } from '../src/lib/actions/validate-pdfa';
import { compressImageAction } from '../src/lib/actions/compress-image';
import { resizeImageAction } from '../src/lib/actions/resize-image';
import { cropImageAction } from '../src/lib/actions/crop-image';
import { convertImageAction } from '../src/lib/actions/convert-image';
import { upscaleImageAction } from '../src/lib/actions/upscale-image';
import { removeBackgroundImageAction } from '../src/lib/actions/remove-background-image';
import { watermarkImageAction } from '../src/lib/actions/watermark-image';
import { rotateImageAction } from '../src/lib/actions/rotate-image';
import { Readable } from 'stream';
import { httpClient } from '@activepieces/pieces-common';
import { SERVER, defaultRoutes, fakeContext, mockHttp, pdf, png, processBody, record, run, loose } from './helpers';

afterEach(() => vi.restoreAllMocks());

type Case = {
  name: string;
  action: { run: (ctx: never) => Promise<unknown>; classification?: string; outputSchema?: unknown };
  props: Record<string, unknown>;
  tool: string;
  expect: Record<string, unknown>;
  host?: string;
};

const cases: Case[] = [
  { name: 'compress', action: compressPdfAction, props: { file: pdf, compression_level: 'extreme' }, tool: 'compress', expect: { compression_level: 'extreme' } },
  { name: 'merge', action: mergePdfAction, props: { files: [{ file: pdf }, { file: pdf }] }, tool: 'merge', expect: {} },
  { name: 'split', action: splitPdfAction, props: { file: pdf, split_mode: 'ranges', ranges: '1-2, 4' }, tool: 'split', expect: { split_mode: 'ranges', ranges: '1-2,4', merge_after: false } },
  { name: 'pdfjpg', action: pdfToJpgAction, props: { file: pdf }, tool: 'pdfjpg', expect: { pdfjpg_mode: 'pages' } },
  { name: 'imagepdf', action: jpgToPdfAction, props: { images: [{ file: png }] }, tool: 'imagepdf', expect: { orientation: 'portrait', pagesize: 'fit', merge_after: true } },
  { name: 'officepdf', action: officeToPdfAction, props: { file: { ...pdf, filename: 'a.docx' } }, tool: 'officepdf', expect: {} },
  { name: 'ocr', action: ocrPdfAction, props: { file: pdf, ocr_languages: ['eng', { 0: 'f', 1: 'r', 2: 'a' }] }, tool: 'pdfocr', expect: { ocr_languages: ['eng', 'fra'] } },
  { name: 'watermark', action: watermarkPdfAction, props: { file: pdf, mode: 'text', text: 'DRAFT' }, tool: 'watermark', expect: { mode: 'text', text: 'DRAFT', pages: 'all' } },
  { name: 'protect', action: protectPdfAction, props: { file: pdf, password: 's3cret' }, tool: 'protect', expect: { password: 's3cret' } },
  { name: 'pagenumber', action: pageNumbersPdfAction, props: { file: pdf }, tool: 'pagenumber', expect: { pages: 'all', starting_number: 1 } },
  { name: 'repair', action: repairPdfAction, props: { file: pdf }, tool: 'repair', expect: {} },
  { name: 'pdfa', action: convertPdfaAction, props: { file: pdf, conformance: 'pdfa-1b' }, tool: 'pdfa', expect: { conformance: 'pdfa-1b', allow_downgrade: true } },
  { name: 'compressimage', action: compressImageAction, props: { file: png }, tool: 'compressimage', expect: { compression_level: 'recommended' }, host: 'api.iloveimg.com' },
  { name: 'resizeimage', action: resizeImageAction, props: { file: png, resize_mode: 'percentage', percentage: 50 }, tool: 'resizeimage', expect: { resize_mode: 'percentage', percentage: 50 }, host: 'api.iloveimg.com' },
  { name: 'cropimage', action: cropImageAction, props: { file: png, width: 10, height: 20 }, tool: 'cropimage', expect: { width: 10, height: 20, x: 0, y: 0 }, host: 'api.iloveimg.com' },
  { name: 'convertimage', action: convertImageAction, props: { file: png, to: 'heic' }, tool: 'convertimage', expect: { to: 'heic' }, host: 'api.iloveimg.com' },
  { name: 'upscaleimage', action: upscaleImageAction, props: { file: png, multiplier: 4 }, tool: 'upscaleimage', expect: { multiplier: 4 }, host: 'api.iloveimg.com' },
  { name: 'removebg', action: removeBackgroundImageAction, props: { file: png }, tool: 'removebackgroundimage', expect: {}, host: 'api.iloveimg.com' },
];

describe('tool actions', () => {
  it.each(cases)('$name sends the exact process body and stores the result', async (c) => {
    const calls = mockHttp(defaultRoutes());
    const { context, written } = fakeContext({ ...c.props, region: 'eu', webhook_url: ' https://hooks.example.com/api/v1/webhooks/F1?ap_secret=abc ' });
    const out = await run(c.action)(context);
    expect(c.action.classification).toBe('READ');
    expect(c.action.outputSchema).toBeDefined();
    const start = calls.find((x) => x.url.includes('/v1/start/'));
    expect(start?.url).toBe(`https://${c.host ?? 'api.ilovepdf.com'}/v1/start/${c.tool}/eu`);
    expect(start?.headers['Authorization']).toBe('Bearer jwt-1');
    const body = processBody(calls);
    expect(body).toMatchObject({ task: 'TASK1', tool: c.tool, webhook: 'https://hooks.example.com/api/v1/webhooks/F1?ap_secret=abc', ...c.expect });
    expect(calls.every((x) => x.redact === true || x.responseType === 'stream')).toBe(true);
    expect(calls.every((x) => x.hasDispatcher && x.followRedirects === false)).toBe(true);
    const download = calls.find((x) => x.url.includes('/v1/download/'));
    expect(download?.responseType).toBe('stream');
    expect(written[0].data.toString()).toBe('RESULT');
    expect(out).toMatchObject({ output_file: 'https://files.example/out.pdf', task: 'TASK1', remaining_credits: 2400, status: 'TaskSuccess' });
  });

  it('html to pdf uploads a cloud URL', async () => {
    const calls = mockHttp(defaultRoutes());
    const { context } = fakeContext({ url: 'https://example.com/page' });
    await run(htmlToPdfAction)(context);
    expect(calls.find((x) => x.url.endsWith('/v1/upload'))?.body).toEqual({ task: 'TASK1', cloud_file: 'https://example.com/page' });
    expect(calls.find((x) => x.url.includes('/v1/start/'))?.url).toBe('https://api.ilovepdf.com/v1/start/htmlpdf');
  });

  it('unlock and rotate put per-file overrides on the file', async () => {
    let calls = mockHttp(defaultRoutes());
    await run(unlockPdfAction)(fakeContext({ file: pdf, password: 'pw' }).context);
    expect(processBody(calls)['files']).toEqual([{ server_filename: 'sf-1', filename: 'in.pdf', password: 'pw' }]);
    vi.restoreAllMocks();
    calls = mockHttp(defaultRoutes());
    await run(rotatePdfAction)(fakeContext({ file: pdf, rotation: 180 }).context);
    expect(processBody(calls)['files']).toEqual([{ server_filename: 'sf-1', filename: 'in.pdf', rotate: 180 }]);
    vi.restoreAllMocks();
    calls = mockHttp(defaultRoutes());
    await run(rotateImageAction)(fakeContext({ file: png, rotation: 90 }).context);
    expect(processBody(calls)['files']).toEqual([{ server_filename: 'sf-1', filename: 'in.png', rotate: 90 }]);
  });

  it('watermark image sends one image element referencing the uploaded stamp', async () => {
    const calls = mockHttp(defaultRoutes());
    await run(watermarkImageAction)(fakeContext({ file: png, image: png, gravity: 'SouthEast' }).context);
    expect(calls.find((x) => x.url.includes('/v1/start/'))?.url).toBe('https://api.iloveimg.com/v1/start/watermarkimage');
    expect(processBody(calls)['elements']).toEqual([
      { type: 'image', server_filename: 'sf-2', gravity: 'SouthEast', width_percent: 30, height_percent: 30, x_pos_percent: 0, y_pos_percent: 0, rotation: 0, transparency: 100, mosaic: false },
    ]);
    expect(processBody(calls)['files']).toEqual([{ server_filename: 'sf-1', filename: 'in.png' }]);
  });

  it('no webhook key is sent when the prop is empty', async () => {
    const calls = mockHttp(defaultRoutes());
    await run(compressPdfAction)(fakeContext({ file: pdf, webhook_url: '' }).context);
    expect(processBody(calls)).not.toHaveProperty('webhook');
  });

  it('watermark pdf image mode references the uploaded stamp', async () => {
    const calls = mockHttp(defaultRoutes());
    await run(watermarkPdfAction)(fakeContext({ file: pdf, mode: 'image', image: png }).context);
    expect(processBody(calls)).toMatchObject({ mode: 'image', image: 'sf-2' });
  });

  it('wrong password 400 gives a clear error with responseBody and no body field', async () => {
    mockHttp(
      defaultRoutes([
        {
          method: 'POST',
          match: (u) => u.endsWith('/v1/process'),
          status: 400,
          body: { error: { type: 'ProcessingError', message: 'WrongPassword', code: '400' } },
        },
      ])
    );
    const error = await run(unlockPdfAction)(fakeContext({ file: pdf, password: 'bad' }).context).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(String(Reflect.get(Object(error), 'message'))).toMatch(/password is wrong/);
    expect(error).toHaveProperty('responseBody');
    expect(error).not.toHaveProperty('body');
  });

  it('validate pdfa reads validations and skips the download', async () => {
    const calls = mockHttp(
      defaultRoutes([
        {
          method: 'POST',
          match: (u) => u.endsWith('/v1/process'),
          body: { status: 'TaskSuccess', validations: [{ server_filename: 'sf-1', status: 'Conformant' }] },
        },
      ])
    );
    const out = await run(validatePdfaAction)(fakeContext({ file: pdf }).context);
    expect(validatePdfaAction.classification).toBe('READ');
    expect(out).toMatchObject({ conformant: true, task: 'TASK1' });
    expect(calls.some((x) => x.url.includes('/download/'))).toBe(false);
  });

  it('extract text returns text and parses detailed rows', async () => {
    const csv = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('PageNo,XPos,YPos,XWidth,YWidth,FontName,FontSize,Length,Text\r\n1,56.8,1,2,3,"Arial",12,12,Hello, world\r\n', 'utf16le')]);
    mockHttp(
      defaultRoutes([
        { method: 'GET', match: (u) => u.includes('/v1/download/'), reply: () => ({ body: Readable.from([csv]) }) },
      ])
    );
    const out = await run(extractTextPdfAction)(fakeContext({ file: pdf, detailed: true }).context);
    expect(out['text_truncated']).toBe(false);
    expect(out['text']).toMatch(/^PageNo,XPos/);
    expect(out['detailed']).toEqual([{ PageNo: 1, XPos: 56.8, YPos: 1, XWidth: 2, YWidth: 3, FontName: 'Arial', FontSize: 12, Length: 12, Text: 'Hello, world' }]);
  });

  it('extract text flags detailed rows past the row limit', async () => {
    const lines = Array.from({ length: 5002 }, (_, i) => `1,${i},1,2,3,"Arial",12,1,w${i}`);
    const csv = Buffer.from(['PageNo,XPos,YPos,XWidth,YWidth,FontName,FontSize,Length,Text', ...lines].join('\n'));
    mockHttp(defaultRoutes([{ method: 'GET', match: (u) => u.includes('/v1/download/'), reply: () => ({ body: Readable.from([csv]) }) }]));
    const out = await run(extractTextPdfAction)(fakeContext({ file: pdf, detailed: true }).context);
    expect(out['detailed']).toHaveLength(5000);
    expect(out['detailed_total_rows']).toBe(5002);
    expect(out['detailed_truncated']).toBe(true);
  });

  it('extract text surfaces an unparseable detailed result', async () => {
    mockHttp(defaultRoutes([{ method: 'GET', match: (u) => u.includes('/v1/download/'), reply: () => ({ body: Readable.from([Buffer.from('garbage line')]) }) }]));
    const out = await run(extractTextPdfAction)(fakeContext({ file: pdf, detailed: true }).context);
    expect(out['detailed']).toBeNull();
    expect(out['detailed_parse_error']).toMatch(/unexpected header/);
  });

  it.each([
    ['merge with one file', mergePdfAction, { files: [{ file: pdf }] }, /At least two/],
    ['split bad ranges', splitPdfAction, { file: pdf, split_mode: 'ranges', ranges: '1-a' }, /must look like/],
    ['split fixed range zero', splitPdfAction, { file: pdf, split_mode: 'fixed_range', fixed_range: 0 }, /whole number/],
    ['ocr bad language', ocrPdfAction, { file: pdf, ocr_languages: ['english'] }, /ISO 639-2/],
    ['resize without size', resizeImageAction, { file: png, resize_mode: 'pixels' }, /width, a height/],
    ['upscale 3x', upscaleImageAction, { file: png, multiplier: 3 }, /2 or 4/],
    ['empty file', compressPdfAction, { file: { base64: '', filename: 'x.pdf' } }, /empty/],
    ['bad region', compressPdfAction, { file: pdf, region: 'mars' }, /Processing Region/],
    ['html not http', htmlToPdfAction, { url: 'ftp://x' }, /http/],
    ['webhook not https', compressPdfAction, { file: pdf, webhook_url: 'http://x.co/h' }, /Webhook URL must use https/],
    ['watermark image size', watermarkImageAction, { file: png, image: png, width_percent: 0 }, /between 1 and 100/],
  ])('%s fails before any request', async (_name, action, props, message) => {
    const calls = mockHttp(defaultRoutes());
    await expect(run(loose(action))(fakeContext(props).context)).rejects.toThrow(message);
    expect(calls).toHaveLength(0);
  });

  it('watermark text mode ignores a leftover image', async () => {
    const calls = mockHttp(defaultRoutes());
    await run(loose(watermarkPdfAction))(fakeContext({ file: pdf, mode: 'text', text: 'x', image: png }).context);
    expect(processBody(calls)['text']).toBe('x');
    expect(processBody(calls)['image']).toBeUndefined();
    expect(calls.filter((x) => x.url.includes('/upload'))).toHaveLength(1);
  });

  it('split ignores leftover inputs from other modes', async () => {
    const calls = mockHttp(defaultRoutes());
    await run(loose(splitPdfAction))(fakeContext({ file: pdf, split_mode: 'ranges', ranges: '1-2', fixed_range: 0, filesize: 0, remove_pages: 'x' }).context);
    expect(processBody(calls)['ranges']).toBe('1-2');
    expect(processBody(calls)['fixed_range']).toBeUndefined();
  });

  it('split by file size sends bytes', async () => {
    const calls = mockHttp(defaultRoutes());
    await run(splitPdfAction)(fakeContext({ file: pdf, split_mode: 'filesize', filesize: 2 }).context);
    expect(processBody(calls)['filesize']).toBe(2 * 1024 * 1024);
  });

  it('refuses a start response that points to a foreign server', async () => {
    const calls = mockHttp(
      defaultRoutes([{ method: 'GET', match: (u) => u.includes('/v1/start/'), body: { server: `${SERVER}.evil.io`, task: 'T' } }])
    );
    await expect(run(compressPdfAction)(fakeContext({ file: pdf }).context)).rejects.toThrow(/unexpected server/);
    expect(calls.some((x) => x.url.includes('evil'))).toBe(false);
  });
});

describe('step time budget', () => {
  it('fails a task that does not finish before the step limit', async () => {
    vi.useFakeTimers();
    try {
      mockHttp(defaultRoutes());
      const mocked = httpClient.sendRequest;
      vi.spyOn(httpClient, 'sendRequest').mockImplementation((request, options) =>
        request.url.endsWith('/v1/process') ? new Promise(() => undefined) : mocked(request, options)
      );
      const pending = run(compressPdfAction)(fakeContext({ file: pdf }).context);
      const assertion = expect(pending).rejects.toThrow(/step time limit/);
      await vi.advanceTimersByTimeAsync(520_000);
      await assertion;
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });

  it('sends no further request after the step limit is hit', async () => {
    mockHttp(defaultRoutes());
    await run(mergePdfAction)(fakeContext({ files: [{ file: pdf }, { file: pdf }] }).context);
    vi.restoreAllMocks();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const urls: string[] = [];
      const reply = (body: unknown) => ({ status: 200, headers: {}, body });
      vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
        urls.push(request.url);
        if (request.url.endsWith('/v1/auth')) return reply({ token: 'jwt-1' });
        if (request.url.includes('/v1/start/')) return reply({ server: SERVER, task: 'TASK1' });
        if (request.url.endsWith('/v1/upload')) {
          await new Promise((resolve) => setTimeout(resolve, 530_000));
          return reply({ server_filename: 'sf-1' });
        }
        return reply({});
      });
      const pending = run(mergePdfAction)(fakeContext({ files: [{ file: pdf }, { file: pdf }] }).context);
      const assertion = expect(pending).rejects.toThrow(/step time limit/);
      for (let i = 0; i < 1000 && !urls.some((url) => url.endsWith('/v1/upload')); i++) {
        await new Promise((resolve) => setImmediate(resolve));
      }
      await vi.advanceTimersByTimeAsync(600_000);
      await assertion;
      for (let i = 0; i < 200; i++) {
        await new Promise((resolve) => setImmediate(resolve));
        await vi.advanceTimersByTimeAsync(1_000);
      }
      expect(urls.filter((url) => url.endsWith('/v1/upload'))).toHaveLength(1);
      expect(urls.some((url) => url.endsWith('/v1/process') || url.includes('/v1/download/'))).toBe(false);
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});

describe('fileToUploadInput', () => {
  it('passes the file Buffer through without a base64 round trip', () => {
    const data = Buffer.from('%PDF-1.7');
    const out = fileToUploadInput({ file: { data, base64: 'ignored', filename: 'a.pdf' } });
    expect(out).toEqual({ kind: 'file', file: { data, filename: 'a.pdf' } });
    expect(out.kind === 'file' && out.file.data).toBe(data);
  });
  it('falls back to base64 when the file has no data', () => {
    const out = fileToUploadInput({ file: { base64: Buffer.from('x').toString('base64') } });
    expect(out).toEqual({ kind: 'file', file: { data: Buffer.from('x'), filename: 'file' } });
  });
  it('rejects an empty Buffer', () => {
    expect(() => fileToUploadInput({ file: { data: Buffer.alloc(0), filename: 'a.pdf' }, label: 'PDF' })).toThrow(/PDF is empty/);
  });
});
