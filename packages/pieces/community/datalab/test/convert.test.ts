import { FilesService } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatalabTiming } from '../src/lib/common/client';
import { convertOperation } from '../src/lib/operations/convert';
import { convertDocumentAction } from '../src/lib/actions/convert-document';
import { aiConvertDocumentAction } from '../src/lib/actions/ai/convert-document';

function fakeTiming(): DatalabTiming {
  let clock = 0;
  return {
    sleep: async (ms) => {
      clock += ms;
    },
    now: () => clock,
  };
}

function fakeFiles(): FilesService & { written: Array<{ fileName: string; data: Buffer }> } {
  const written: Array<{ fileName: string; data: Buffer }> = [];
  return {
    written,
    write: async ({ fileName, data }) => {
      written.push({ fileName, data: Buffer.isBuffer(data) ? data : Buffer.alloc(0) });
      return `https://cloud.activepieces.com/api/v1/files/${fileName}`;
    },
    upload: async ({ fileName }) => ({ id: fileName, url: `https://cloud.activepieces.com/api/v1/files/${fileName}` }),
  };
}

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

const submitted = ok({ success: true, error: null, request_id: 'iqilYAg0NH8LSVOYCN30AA', request_check_url: 'https://www.datalab.to/api/v1/convert/iqilYAg0NH8LSVOYCN30AA' });
const processing = ok({ status: 'processing', progress_percent: 5, success: null, error: null, result_url: null });

const commonResultFields = {
  progress_percent: 100,
  status: 'complete',
  result_url: null,
  expires_in: null,
  extraction_schema_json: null,
  extraction_score_average: null,
  extraction_scoring_status: null,
  extraction_mode: null,
  segmentation_results: null,
  segmentation_schema: null,
  success: true,
  error: '',
  checkpoint_id: null,
  versions: null,
};

const markdownResult = {
  ...commonResultFields,
  output_format: 'markdown',
  chunks: null,
  json: null,
  markdown: '\n\n{0}------------------------------------------------\n\n# INVOICE\n\nInvoice Number: INV-2026-0042\n\n**Total Due: 586.67 EUR**\n\n{1}------------------------------------------------\n\n## Payment Terms',
  html: null,
  images: {},
  metadata: { page_stats: [{ page_id: 0, num_blocks: 12 }, { page_id: 1, num_blocks: 5 }], failed_pages: [] },
  parse_quality_score: 5.0,
  page_count: 2,
  total_cost: 0.8,
  cost_breakdown: { final_cost_cents: 0.8 },
  runtime: 1.0791521072387695,
};

const block = {
  id: '/page/0/SectionHeader/0',
  block_type: 'SectionHeader',
  html: '<h1><p><b>Dummy PDF file</b></p></h1>',
  page: 0,
  polygon: [
    [143.0, 179.0],
    [491.0, 179.0],
    [491.0, 244.0],
    [143.0, 244.0],
  ],
  bbox: [143.0, 179.0, 491.0, 244.0],
  section_hierarchy: {},
  images: {},
  markdown: null,
  inference_failed: false,
  metadata: null,
};

const multiFormatResult = {
  ...commonResultFields,
  output_format: 'markdown',
  chunks: { blocks: [block], page_info: { '0': { bbox: [0.0, 0.0, 1596.0, 2240.0] } }, metadata: { page_stats: [{ page_id: 0, num_blocks: 1 }], failed_pages: [] } },
  json: {
    children: [{ html: '<h1><p><b>Dummy PDF file</b></p></h1>', bbox: [0.0, 0.0, 1596.0, 2240.0], id: '/page/0/Page/0', block_type: 'Page', children: [block], section_hierarchy: {} }],
    metadata: { page_stats: [{ page_id: 0, num_blocks: 1 }], failed_pages: [] },
  },
  markdown: '\n\n{0}------------------------------------------------\n\n# **Dummy PDF file**',
  html: '<!DOCTYPE html>\n<html>\n <head>\n  <meta charset="utf-8"/>\n </head>\n <body>\n  <h1><p><b>Dummy PDF file</b></p></h1>\n </body>\n</html>',
  images: {},
  metadata: { page_stats: [{ page_id: 0, num_blocks: 1 }], failed_pages: [] },
  parse_quality_score: null,
  page_count: 1,
};

const imageBase64 = Buffer.from('fake-jpeg-bytes').toString('base64');

const imageResult = {
  ...commonResultFields,
  output_format: 'markdown',
  chunks: null,
  json: null,
  markdown: '\n\n![Flowchart: Architecture of a multi-head attention mechanism.](b230b8f21d8e82d55c0d311c8c32ef73_img.jpg)\n\nOutput\nProbabilities',
  html: null,
  images: { 'b230b8f21d8e82d55c0d311c8c32ef73_img.jpg': imageBase64 },
  metadata: { page_stats: [{ page_id: 2, num_blocks: 9 }], failed_pages: [] },
  parse_quality_score: null,
  page_count: 1,
};

const fillResult = {
  progress_percent: 100,
  status: 'complete',
  success: true,
  error: null,
  output_format: 'pdf',
  output_base64: 'JVBERi0xLjMK',
  fields_filled: ['Name'],
  fields_not_found: [],
  page_count: 1,
  result_url: null,
};

const pdfFile = { filename: 'invoice.pdf', extension: 'pdf', data: Buffer.from('%PDF-1.4 test'), base64: '' };

function humanContext(propsValue: Record<string, unknown>) {
  return { auth: { type: 'SECRET_TEXT', secret_text: 'key_1' }, propsValue, files: fakeFiles() };
}

function requestForm(spy: ReturnType<typeof vi.spyOn<typeof httpClient, 'sendRequest'>>): FormData {
  const body = spy.mock.calls[0][0].body;
  if (!(body instanceof FormData)) {
    throw new Error('expected a FormData body');
  }
  return body;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('convert request', () => {
  it('sends the file part, mode and output format for a typical human run', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(markdownResult));
    const files = fakeFiles();
    const values = { source: 'file', document: { file: pdfFile }, output_format: 'markdown', mode: 'balanced' };
    const output = await convertOperation.run({
      apiKey: 'key_1',
      source: { type: 'file', filename: 'invoice.pdf', data: pdfFile.data },
      values,
      audience: 'human',
      files,
      timing: fakeTiming(),
    });
    const form = requestForm(spy);
    const part = form.get('file');
    expect(part).toBeInstanceOf(Blob);
    expect(part instanceof File ? part.name : undefined).toBe('invoice.pdf');
    expect(form.get('file_url')).toBeNull();
    expect(form.get('mode')).toBe('balanced');
    expect(form.get('output_format')).toBe('markdown');
    expect(form.get('disable_image_extraction')).toBe('true');
    expect([...form.keys()].sort()).toEqual(['disable_image_extraction', 'file', 'mode', 'output_format']);
    expect(spy.mock.calls[0][0].url).toBe('https://www.datalab.to/api/v1/convert');
    expect(spy.mock.calls[1][0].url).toBe('https://www.datalab.to/api/v1/convert/iqilYAg0NH8LSVOYCN30AA');
    expect(output).toMatchObject({ completed: true, status: 'complete', request_id: 'iqilYAg0NH8LSVOYCN30AA', output_format: 'markdown', page_count: 2 });
  });

  it('sends every advanced option with the right names and encodings', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(markdownResult));
    await convertOperation.run({
      apiKey: 'key_1',
      source: { type: 'url', url: 'https://example.com/files/report.pdf' },
      values: {
        output_format: 'html',
        mode: 'accurate',
        page_range: '0, 5-10',
        max_pages: 4,
        paginate: true,
        include_images: true,
        keep_headers_footers: true,
        exact_transcription: true,
        token_efficient_markdown: true,
        extras: ['chart_understanding', 'extract_links'],
        skip_cache: true,
      },
      audience: 'human',
      files: fakeFiles(),
      timing: fakeTiming(),
    });
    const form = requestForm(spy);
    expect(Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]))).toEqual({
      file_url: 'https://example.com/files/report.pdf',
      mode: 'accurate',
      output_format: 'html',
      disable_image_extraction: 'false',
      page_range: '0,5-10',
      paginate: 'true',
      exact_transcription: 'true',
      token_efficient_markdown: 'true',
      additional_config: '{"keep_pageheader_in_output":true,"keep_pagefooter_in_output":true}',
      extras: 'chart_understanding,extract_links',
      skip_cache: 'true',
    });
  });

  it('sends file_url and falls back to balanced and markdown for an AI run that leaves the dropdowns out', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(markdownResult));
    const output = await aiConvertDocumentAction.run(
      humanContext({
        file_url: ' https://example.com/files/invoice.pdf ',
        paginate: false,
        include_images: false,
        keep_headers_footers: false,
        exact_transcription: false,
        token_efficient_markdown: false,
        skip_cache: false,
        save_as_file: false,
      }),
    );
    const form = requestForm(spy);
    expect(form.get('file')).toBeNull();
    expect(form.get('file_url')).toBe('https://example.com/files/invoice.pdf');
    expect(form.get('mode')).toBe('balanced');
    expect(form.get('output_format')).toBe('markdown');
    expect(form.get('disable_image_extraction')).toBe('true');
    expect([...form.keys()].sort()).toEqual(['disable_image_extraction', 'file_url', 'mode', 'output_format']);
    expect(output).toMatchObject({ completed: true, output_format: 'markdown' });
  });

  it('runs the human action end to end from its props', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(markdownResult));
    const output = await convertDocumentAction.run(humanContext({ source: 'url', document: { file_url: 'https://example.com/a.pdf' }, output_format: 'markdown', mode: 'fast' }));
    expect(requestForm(spy).get('mode')).toBe('fast');
    expect(spy.mock.calls[0][0].headers).toEqual({ 'X-API-Key': 'key_1' });
    expect(output).toMatchObject({ completed: true, content: markdownResult.markdown });
  });

  it('rejects an unknown mode or output format before calling Datalab', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(aiConvertDocumentAction.run(humanContext({ file_url: 'https://example.com/a.pdf', mode: 'turbo' }))).rejects.toThrow('mode "turbo" is not supported. Use one of: lite, fast, balanced, accurate.');
    await expect(aiConvertDocumentAction.run(humanContext({ file_url: 'https://example.com/a.pdf', output_format: 'pdf' }))).rejects.toThrow('output_format "pdf" is not supported');
    await expect(aiConvertDocumentAction.run(humanContext({ file_url: 'https://example.com/a.pdf', extras: ['infographic'] }))).rejects.toThrow('extras "infographic" is not supported');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('lite mode check', () => {
  it('stops a human run with exact transcription and names the option in the form words', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      convertDocumentAction.run(humanContext({ source: 'url', document: { file_url: 'https://example.com/a.pdf' }, mode: 'lite', exact_transcription: true })),
    ).rejects.toThrow('Lite mode does not support Exact Transcription. Either turn off Exact Transcription, or pick Fast, Balanced or Accurate as the Mode.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('names both options when exact transcription and extras are on', async () => {
    await expect(
      convertDocumentAction.run(humanContext({ source: 'url', document: { file_url: 'https://example.com/a.pdf' }, mode: 'lite', exact_transcription: true, extras: ['extract_links'] })),
    ).rejects.toThrow('Lite mode does not support Exact Transcription and Extras. Either turn off Exact Transcription and clear Extras');
  });

  it('uses parameter names for the AI twin', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(aiConvertDocumentAction.run(humanContext({ file_url: 'https://example.com/a.pdf', mode: 'lite', extras: ['chart_understanding'] }))).rejects.toThrow(
      'mode lite does not support extras. Either leave extras empty, or use mode fast, balanced or accurate.',
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('lets lite mode through without those options', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(markdownResult));
    await aiConvertDocumentAction.run(humanContext({ file_url: 'https://example.com/a.pdf', mode: 'lite', exact_transcription: false, extras: [] }));
    expect(requestForm(spy).get('mode')).toBe('lite');
  });
});

describe('shape', () => {
  it('returns markdown content, page count, quality score and failed pages without page stats or cost', async () => {
    const output = await convertOperation.shape({ result: markdownResult, files: fakeFiles(), options: { outputFormat: 'markdown' } });
    expect(output).toEqual({
      output_format: 'markdown',
      content: markdownResult.markdown,
      page_count: 2,
      parse_quality_score: 5,
      failed_pages: [],
      bookmarks: null,
      images: [],
      file: null,
      file_name: null,
      size: null,
    });
    expect(JSON.stringify(output)).not.toMatch(/page_stats|total_cost|cost_breakdown/);
  });

  it('picks the json and chunks objects by the chosen format and keeps a null quality score', async () => {
    const json = await convertOperation.shape({ result: multiFormatResult, files: fakeFiles(), options: { outputFormat: 'json' } });
    expect(json.output_format).toBe('json');
    expect(json.content).toEqual(multiFormatResult.json);
    expect(json.parse_quality_score).toBeNull();
    const chunks = await convertOperation.shape({ result: multiFormatResult, files: fakeFiles(), options: { outputFormat: 'chunks' } });
    expect(chunks.content).toEqual(multiFormatResult.chunks);
    const html = await convertOperation.shape({ result: multiFormatResult, files: fakeFiles(), options: { outputFormat: 'html' } });
    expect(html.content).toBe(multiFormatResult.html);
  });

  it('parses json content that arrives as a string', async () => {
    const output = await convertOperation.shape({ result: { ...multiFormatResult, json: JSON.stringify(multiFormatResult.json) }, files: fakeFiles(), options: { outputFormat: 'json' } });
    expect(output.content).toEqual(multiFormatResult.json);
  });

  it('picks the format by the result itself when no options are given, as Get Result does', async () => {
    const echoed = await convertOperation.shape({ result: multiFormatResult, files: fakeFiles() });
    expect(echoed.output_format).toBe('markdown');
    expect(echoed.content).toBe(multiFormatResult.markdown);
    const jsonOnly = await convertOperation.shape({ result: { ...multiFormatResult, output_format: 'markdown', markdown: null, html: null, chunks: null }, files: fakeFiles() });
    expect(jsonOnly.output_format).toBe('json');
    expect(jsonOnly.content).toEqual(multiFormatResult.json);
    expect(jsonOnly.file).toBeNull();
  });

  it('saves images as files and never returns their base64', async () => {
    const files = fakeFiles();
    const output = await convertOperation.shape({ result: imageResult, files, options: { outputFormat: 'markdown' } });
    expect(output.images).toEqual([
      {
        file: 'https://cloud.activepieces.com/api/v1/files/b230b8f21d8e82d55c0d311c8c32ef73_img.jpg',
        file_name: 'b230b8f21d8e82d55c0d311c8c32ef73_img.jpg',
        size: Buffer.from('fake-jpeg-bytes').length,
      },
    ]);
    expect(files.written[0].data.toString()).toBe('fake-jpeg-bytes');
    expect(JSON.stringify(output)).not.toContain(imageBase64);
  });

  it('replaces images inside json blocks with saved file links, saving each image once', async () => {
    const files = fakeFiles();
    const blockWithImage = { ...block, images: { 'img_1.jpg': imageBase64 } };
    const result = { ...multiFormatResult, images: { 'img_1.jpg': imageBase64 }, json: { children: [{ ...multiFormatResult.json.children[0], children: [blockWithImage] }], metadata: {} } };
    const output = await convertOperation.shape({ result, files, options: { outputFormat: 'json' } });
    expect(files.written.map((entry) => entry.fileName)).toEqual(['img_1.jpg']);
    expect(JSON.stringify(output)).not.toContain(imageBase64);
    expect(JSON.stringify(output.content)).toContain('"img_1.jpg":"https://cloud.activepieces.com/api/v1/files/img_1.jpg"');
  });

  it('also saves the content as a file with the right extension when asked', async () => {
    const files = fakeFiles();
    const markdown = await convertOperation.shape({ result: markdownResult, files, options: { outputFormat: 'markdown', saveAsFile: true, fileName: 'invoice.pdf' } });
    expect(markdown).toMatchObject({ file: 'https://cloud.activepieces.com/api/v1/files/invoice.md', file_name: 'invoice.md', size: Buffer.byteLength(markdownResult.markdown) });
    expect(markdown.content).toBe(markdownResult.markdown);
    const json = await convertOperation.shape({ result: multiFormatResult, files, options: { outputFormat: 'chunks', saveAsFile: true } });
    expect(json.file_name).toBe('converted-document.json');
    expect(JSON.parse(files.written[1].data.toString())).toEqual(multiFormatResult.chunks);
    const html = await convertOperation.shape({ result: multiFormatResult, files, options: { outputFormat: 'html', saveAsFile: true, fileName: 'report' } });
    expect(html.file_name).toBe('report.html');
  });

  it('returns only the file when the saved content is over 4 MB', async () => {
    const big = 'a'.repeat(4_000_001);
    const output = await convertOperation.shape({ result: { ...markdownResult, markdown: big }, files: fakeFiles(), options: { outputFormat: 'markdown', saveAsFile: true } });
    expect(output.content).toBeNull();
    expect(output.size).toBe(4_000_001);
  });

  it('saves a result over 4 MB as a file even when Also Save as File is off, as Get Result calls it', async () => {
    const files = fakeFiles();
    const big = 'a'.repeat(4_000_001);
    const output = await convertOperation.shape({ result: { ...markdownResult, markdown: big }, files });
    expect(output.content).toBeNull();
    expect(output.file).toBeTruthy();
    expect(output.file_name).toBe('converted-document.md');
    expect(output.size).toBe(4_000_001);
    expect(files.written.length).toBe(1);
  });

  it('returns a result under 4 MB inline and saves no file when Also Save as File is off', async () => {
    const files = fakeFiles();
    const output = await convertOperation.shape({ result: markdownResult, files, options: { outputFormat: 'markdown', saveAsFile: false } });
    expect(output.content).toBe(markdownResult.markdown);
    expect(output.file).toBeNull();
    expect(files.written.length).toBe(0);
  });

  it('names the saved file after the URL when the link has a file name', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(markdownResult));
    const context = humanContext({ file_url: 'https://example.com/files/q3-report.pdf?sig=abc', save_as_file: true });
    const output = await aiConvertDocumentAction.run(context);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(output).toMatchObject({ file_name: 'q3-report.md' });
  });

  it('reads failed pages from the metadata', async () => {
    const output = await convertOperation.shape({ result: { ...markdownResult, metadata: { page_stats: [], failed_pages: [3, 7] } }, files: fakeFiles() });
    expect(output.failed_pages).toEqual([3, 7]);
  });
});

describe('hasOutput', () => {
  it('is true for a convert result and false for a fill result or an empty one', () => {
    expect(convertOperation.hasOutput(markdownResult)).toBe(true);
    expect(convertOperation.hasOutput({ ...multiFormatResult, markdown: null, html: null, chunks: null })).toBe(true);
    expect(convertOperation.hasOutput(fillResult)).toBe(false);
    expect(convertOperation.hasOutput({ ...markdownResult, markdown: null })).toBe(false);
  });
});

describe('waiting', () => {
  it('fails the human action with the request ID when Datalab is still working after the wait', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    await expect(
      convertOperation.run({
        apiKey: 'k',
        source: { type: 'url', url: 'https://example.com/a.pdf' },
        values: {},
        audience: 'human',
        files: fakeFiles(),
        timing: fakeTiming(),
      }),
    ).rejects.toThrow(/still processing request iqilYAg0NH8LSVOYCN30AA.*Get Result.*Convert Document/);
  });

  it('returns completed false and the request ID from the AI twin', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    const output = await convertOperation.run({
      apiKey: 'k',
      source: { type: 'url', url: 'https://example.com/a.pdf' },
      values: {},
      audience: 'ai',
      files: fakeFiles(),
      timing: fakeTiming(),
    });
    expect(output).toMatchObject({ completed: false, status: 'processing', request_id: 'iqilYAg0NH8LSVOYCN30AA' });
  });
});

describe('action metadata', () => {
  it('pairs the human action and its AI twin', () => {
    expect(convertDocumentAction).toMatchObject({ name: 'convert_document', displayName: 'Convert Document', audience: 'human', classification: 'READ', aiMetadata: { idempotent: true } });
    expect(aiConvertDocumentAction).toMatchObject({ name: 'ai_convert_document', displayName: 'Convert Document', audience: 'ai', classification: 'READ', aiMetadata: { idempotent: true } });
    expect(aiConvertDocumentAction.props['file_url'].required).toBe(true);
    for (const prop of Object.values(aiConvertDocumentAction.props)) {
      expect(prop.defaultValue).toBeUndefined();
    }
  });
});
