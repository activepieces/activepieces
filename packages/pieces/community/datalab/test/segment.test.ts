import { httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiSegmentDocumentAction } from '../src/lib/actions/ai/segment-document';
import { segmentDocumentAction } from '../src/lib/actions/segment-document';
import { datalabAuth } from '../src/lib/auth';
import { DatalabTiming } from '../src/lib/common/client';
import { segmentOperation } from '../src/lib/operations/segment';

function fakeTiming(): DatalabTiming {
  let clock = 0;
  return {
    sleep: async (ms) => {
      clock += ms;
    },
    now: () => clock,
  };
}

function authFor(secret: string): AppConnectionValueForAuthProperty<typeof datalabAuth> {
  return { type: AppConnectionType.SECRET_TEXT, secret_text: secret };
}

function ok(body: unknown) {
  return { status: 200, body };
}

const submitted = ok({ success: true, error: null, request_id: 'req_seg', request_check_url: 'https://www.datalab.to/api/v1/segment/req_seg' });
const processing = ok({ status: 'processing', progress_percent: 13, success: null, error: null, result_url: null, segmentation_results: null });

const autoPageResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'json',
  markdown: null,
  json: null,
  segmentation_results: {
    segments: [
      { name: 'Invoice INV-2026-0042', pages: [0, 1], confidence: 'high' },
      { name: 'Letter from Acme Robotics', pages: [2], confidence: 'high' },
      { name: 'Supply Agreement', pages: [3, 4], confidence: 'high' },
    ],
    metadata: { total_pages: 5, segmentation_method: 'document_boundary', strategy: 'agent', turns: 3, finished: true, ocr_seconds: 0.29, windows: [[0, 5]] },
  },
  segmentation_schema: '{"segmentation_strategy": "document_boundary", "granularity": "page"}',
  metadata: { total_pages: 5, segmentation_method: 'document_boundary' },
  page_count: 5,
  total_cost: 0.25,
};

const customResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'markdown',
  markdown: '# Invoice\n\nINV-2026-0042 ...',
  json: null,
  segmentation_results: {
    segments: [
      { name: 'Invoice', pages: [0], confidence: 'medium' },
      { name: 'Contract', pages: [3], confidence: 'medium' },
    ],
    metadata: { total_pages: 5, segmentation_method: 'find', strategy: 'find', missing_segments: ['Letter'], unassigned_pages: [1, 2, 4] },
  },
  segmentation_schema: '{"segmentation_strategy": "custom", "segments": [{"name": "Invoice"}, {"name": "Letter"}, {"name": "Contract"}]}',
  metadata: { page_stats: [{ page_id: 0, num_blocks: 12 }], failed_pages: [] },
  page_count: 5,
  checkpoint_id: 'checkpoint_abc',
};

const blockResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'markdown',
  markdown: '# Invoice ...',
  segmentation_results: {
    segments: [
      {
        name: 'Invoice INV-2026-0042',
        segment_type: 'invoice',
        confidence: 'medium',
        start_block: { page_id: 0, block_id: 0 },
        end_block: { page_id: 1, block_id: 4 },
        pages: [0, 1],
        blocks: [
          { page_id: 0, block_id: 0 },
          { page_id: 0, block_id: 1 },
        ],
      },
      {
        name: 'Renewal Letter from Acme Robotics GmbH',
        segment_type: 'business_letter',
        confidence: 'medium',
        start_block: { page_id: 2, block_id: 0 },
        end_block: { page_id: 2, block_id: 5 },
        pages: [2],
        blocks: [{ page_id: 2, block_id: 0 }],
      },
    ],
    metadata: { total_blocks: 37, total_pages: 5, segmentation_method: 'block_boundary', granularity: 'block', strategy: 'boundary_detect', custom_prompt: true },
  },
  segmentation_schema: '{"segmentation_strategy": "document_boundary", "granularity": "block", "prompt": "Split wherever a new business document starts."}',
  page_count: 5,
};

const SEGMENT_KEYS = ['confidence', 'end_block_index', 'end_block_page', 'first_page', 'last_page', 'name', 'pages', 'segment_type', 'start_block_index', 'start_block_page'];

function mockJob(result: Record<string, unknown>) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(result));
}

function sentForm(spy: ReturnType<typeof mockJob>): FormData {
  const body = spy.mock.calls[0][0].body;
  if (!(body instanceof FormData)) {
    throw new Error('expected a multipart body');
  }
  return body;
}

function runParams(overrides: Partial<Parameters<typeof segmentOperation.run>[0]>): Parameters<typeof segmentOperation.run>[0] {
  return {
    apiKey: 'k',
    source: { type: 'url', url: 'https://example.com/batch.pdf' },
    method: undefined,
    sections: undefined,
    instructions: undefined,
    detailLevel: undefined,
    mode: undefined,
    pageRange: undefined,
    maxPages: undefined,
    skipCache: undefined,
    audience: 'human',
    timing: fakeTiming(),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildSchema', () => {
  const sections = [{ name: 'Invoice', description: 'The invoice' }, { name: 'Contract' }];

  it('sends page granularity for automatic detection with no detail level or Pages only', () => {
    expect(segmentOperation.buildSchema({ method: 'automatic', sections: [] })).toEqual({ segmentation_strategy: 'document_boundary', granularity: 'page' });
    expect(segmentOperation.buildSchema({ method: 'automatic', sections: [], detailLevel: 'pages' })).toEqual({ segmentation_strategy: 'document_boundary', granularity: 'page' });
  });

  it('sends no granularity for automatic detection with Pages with content', () => {
    expect(segmentOperation.buildSchema({ method: 'automatic', sections: [], detailLevel: 'pages_with_content' })).toEqual({ segmentation_strategy: 'document_boundary' });
  });

  it('sends block granularity for automatic detection at Block level', () => {
    expect(segmentOperation.buildSchema({ method: 'automatic', sections: [], detailLevel: 'blocks' })).toEqual({ segmentation_strategy: 'document_boundary', granularity: 'block' });
  });

  it('adds the prompt to automatic detection at every level', () => {
    expect(segmentOperation.buildSchema({ method: 'automatic', sections: [], instructions: 'Split by invoice.' })).toEqual({
      segmentation_strategy: 'document_boundary',
      granularity: 'page',
      prompt: 'Split by invoice.',
    });
    expect(segmentOperation.buildSchema({ method: 'automatic', sections: [], instructions: 'Split by invoice.', detailLevel: 'pages_with_content' })).toEqual({
      segmentation_strategy: 'document_boundary',
      prompt: 'Split by invoice.',
    });
    expect(segmentOperation.buildSchema({ method: 'automatic', sections: [], instructions: 'Split by invoice.', detailLevel: 'blocks' })).toEqual({
      segmentation_strategy: 'document_boundary',
      granularity: 'block',
      prompt: 'Split by invoice.',
    });
  });

  it('sends custom segments with no granularity when the detail level is empty or Pages with content', () => {
    const expected = { segmentation_strategy: 'custom', segments: [{ name: 'Invoice', description: 'The invoice' }, { name: 'Contract' }] };
    expect(segmentOperation.buildSchema({ method: 'sections', sections })).toEqual(expected);
    expect(segmentOperation.buildSchema({ method: 'sections', sections, detailLevel: 'pages_with_content' })).toEqual(expected);
  });

  it('sends block granularity with custom segments at Block level', () => {
    expect(segmentOperation.buildSchema({ method: 'sections', sections, detailLevel: 'blocks' })).toEqual({
      segmentation_strategy: 'custom',
      segments: [{ name: 'Invoice', description: 'The invoice' }, { name: 'Contract' }],
      granularity: 'block',
    });
  });

  it('never sends the prompt with named sections', () => {
    expect(segmentOperation.buildSchema({ method: 'sections', sections, instructions: 'Ignored here.' })).not.toHaveProperty('prompt');
  });

  it('stops named sections with an empty list', () => {
    expect(() => segmentOperation.buildSchema({ method: 'sections', sections: [] })).toThrow('Add at least one section to Sections, or set How to Split to Detect Documents.');
  });

  it('stops Pages only with named sections, naming Detail Level', () => {
    expect(() => segmentOperation.buildSchema({ method: 'sections', sections, detailLevel: 'pages' })).toThrow(/Detail Level "Pages only" works only with Detect Documents/);
  });

  it('stops instructions longer than 4,000 characters and accepts exactly 4,000', () => {
    expect(() => segmentOperation.buildSchema({ method: 'automatic', sections: [], instructions: 'a'.repeat(4001) })).toThrow('Instructions are 4,001 characters long. Datalab accepts up to 4,000.');
    expect(segmentOperation.buildSchema({ method: 'automatic', sections: [], instructions: 'a'.repeat(4000) })).toHaveProperty('prompt');
  });
});

describe('readSections', () => {
  it('trims names and descriptions and drops empty descriptions', () => {
    expect(segmentOperation.readSections([{ name: ' Invoice ', description: ' The invoice ' }, { name: 'Contract', description: '' }, 'Letter'])).toEqual([
      { name: 'Invoice', description: 'The invoice' },
      { name: 'Contract' },
      { name: 'Letter' },
    ]);
  });

  it('stops a section with no name', () => {
    expect(() => segmentOperation.readSections([{ name: 'Invoice' }, { name: '  ', description: 'x' }])).toThrow('Section 2 in Sections has no name.');
    expect(() => segmentOperation.readSections([{ description: 'x' }])).toThrow('Section 1 in Sections has no name.');
  });

  it('stops duplicate names, ignoring case', () => {
    expect(() => segmentOperation.readSections([{ name: 'Invoice' }, { name: 'invoice ' }])).toThrow('The section name "invoice" is used more than once in Sections.');
  });
});

describe('buildRequestSchema', () => {
  it('ignores a leftover section list when How to Split is Detect Documents', () => {
    expect(segmentOperation.buildRequestSchema({ method: 'automatic', sections: [{ name: 'Invoice' }, { name: 'Invoice' }], instructions: undefined, detailLevel: null })).toEqual({
      segmentation_strategy: 'document_boundary',
      granularity: 'page',
    });
  });

  it('infers named sections from a non-empty list when no method is given, as on the AI path', () => {
    expect(segmentOperation.buildRequestSchema({ method: undefined, sections: [{ name: 'Invoice' }], instructions: undefined, detailLevel: undefined })).toEqual({
      segmentation_strategy: 'custom',
      segments: [{ name: 'Invoice' }],
    });
    expect(segmentOperation.buildRequestSchema({ method: undefined, sections: [], instructions: undefined, detailLevel: undefined })).toEqual({
      segmentation_strategy: 'document_boundary',
      granularity: 'page',
    });
  });

  it('rejects an unknown detail level', () => {
    expect(() => segmentOperation.buildRequestSchema({ method: 'automatic', sections: [], instructions: undefined, detailLevel: 'page' })).toThrow('Detail Level "page" is not valid.');
  });
});

describe('run pre-checks', () => {
  const cases: Array<{ name: string; overrides: Partial<Parameters<typeof segmentOperation.run>[0]>; expected: RegExp }> = [
    { name: 'named sections with an empty list', overrides: { method: 'sections', sections: [] }, expected: /Add at least one section/ },
    { name: 'Pages only with named sections', overrides: { method: 'sections', sections: [{ name: 'Invoice' }], detailLevel: 'pages' }, expected: /Pages only" works only with Detect Documents/ },
    { name: 'instructions too long', overrides: { instructions: 'x'.repeat(4100) }, expected: /4,100 characters long/ },
    { name: 'an empty section name', overrides: { method: 'sections', sections: [{ name: '' }] }, expected: /Section 1 in Sections has no name/ },
    { name: 'a duplicate section name', overrides: { method: 'sections', sections: [{ name: 'A' }, { name: 'A' }] }, expected: /"A" is used more than once/ },
    { name: 'an unknown mode', overrides: { mode: 'turbo' }, expected: /Mode "turbo" is not valid/ },
  ];
  for (const entry of cases) {
    it(`stops ${entry.name} before calling Datalab`, async () => {
      const spy = vi.spyOn(httpClient, 'sendRequest');
      await expect(segmentOperation.run(runParams(entry.overrides))).rejects.toThrow(entry.expected);
      expect(spy).not.toHaveBeenCalled();
    });
  }
});

describe('Segment Document (human)', () => {
  it('sends the file, the schema as a JSON string and every option, and returns the shaped result', async () => {
    const spy = mockJob(customResult);
    const output = await segmentDocumentAction.run({
      ...createMockActionContext<typeof segmentDocumentAction.props>({
        propsValue: {
        source: 'file',
        file: { filename: 'batch.pdf', extension: 'pdf', data: Buffer.from('%PDF-1.4'), base64: '' },
        file_url: undefined,
        split_method: 'sections',
        sections: [{ name: 'Invoice', description: 'The invoice and its payment terms' }, { name: 'Letter' }, { name: 'Contract' }],
        instructions: 'Not sent with named sections.',
        detail_level: undefined,
        mode: 'balanced',
        page_range: '0-4',
        max_pages: 5,
        skip_cache: true,
        },
      }),
      auth: authFor('key_1'),
    });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://www.datalab.to/api/v1/segment');
    expect(request.headers).toEqual({ 'X-API-Key': 'key_1' });
    const form = sentForm(spy);
    const file = form.get('file');
    expect(file).toBeInstanceOf(Blob);
    expect(form.get('segmentation_schema')).toBe(
      JSON.stringify({ segmentation_strategy: 'custom', segments: [{ name: 'Invoice', description: 'The invoice and its payment terms' }, { name: 'Letter' }, { name: 'Contract' }] }),
    );
    expect(form.get('mode')).toBe('balanced');
    expect(form.get('page_range')).toBe('0-4');
    expect(form.has('max_pages')).toBe(false);
    expect(form.get('skip_cache')).toBe('true');
    expect(form.has('file_url')).toBe(false);
    expect(spy.mock.calls[1][0].url).toBe('https://www.datalab.to/api/v1/segment/req_seg');
    expect(output).toMatchObject({ completed: true, status: 'complete', request_id: 'req_seg', segment_count: 2, missing_sections: ['Letter'], unassigned_pages: [1, 2, 4] });
  });

  for (const sections of ['["Invoice","Letter"]', '[{"name":"Invoice"},{"name":"Letter"}]']) {
    it(`reads sections given as the JSON string ${sections} as named sections`, async () => {
      const spy = mockJob(customResult);
      const context = createMockActionContext<typeof segmentDocumentAction.props>({
        propsValue: {
          source: 'url',
          file: undefined,
          file_url: 'https://example.com/batch.pdf',
          split_method: 'sections',
          sections: [],
          instructions: undefined,
          detail_level: undefined,
          mode: undefined,
          page_range: undefined,
          max_pages: undefined,
          skip_cache: false,
        },
      });
      Reflect.set(context.propsValue, 'sections', sections);
      await segmentDocumentAction.run({ ...context, auth: authFor('key_1') });
      expect(sentForm(spy).get('segmentation_schema')).toBe('{"segmentation_strategy":"custom","segments":[{"name":"Invoice"},{"name":"Letter"}]}');
    });
  }

  it('throws with the request ID when Datalab is still working after the wait', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    await expect(segmentOperation.run(runParams({ audience: 'human' }))).rejects.toThrow(
      /Timed out waiting for Datalab: it is still processing request req_seg after 4 minutes.*Get Result action with Operation "Segment Document"/,
    );
  });
});

describe('Segment Document (AI)', () => {
  it('detects documents automatically and always sends mode fast when nothing optional is given', async () => {
    const spy = mockJob(autoPageResult);
    const output = await aiSegmentDocumentAction.run({
      ...createMockActionContext<typeof aiSegmentDocumentAction.props>({
        propsValue: {
        file_url: 'https://example.com/batch.pdf',
        sections: [],
        instructions: undefined,
        detail_level: undefined,
        mode: undefined,
        page_range: undefined,
        max_pages: undefined,
        skip_cache: false,
        },
      }),
      auth: authFor('key_2'),
    });
    const form = sentForm(spy);
    expect(form.get('file_url')).toBe('https://example.com/batch.pdf');
    expect(form.get('segmentation_schema')).toBe('{"segmentation_strategy":"document_boundary","granularity":"page"}');
    expect(form.get('mode')).toBe('fast');
    expect(form.get('skip_cache')).toBe('false');
    expect(form.has('file')).toBe(false);
    expect(form.has('page_range')).toBe(false);
    expect(form.has('max_pages')).toBe(false);
    expect(form.has('instructions')).toBe(false);
    expect(output).toMatchObject({ completed: true, request_id: 'req_seg', segment_count: 3, total_pages: 5, method: 'document_boundary' });
  });

  it('switches to named sections when sections has entries', async () => {
    const spy = mockJob(customResult);
    await aiSegmentDocumentAction.run({
      ...createMockActionContext<typeof aiSegmentDocumentAction.props>({
        propsValue: {
        file_url: 'https://example.com/batch.pdf',
        sections: [{ name: 'Invoice', description: 'The invoice' }, { name: 'Contract' }],
        instructions: 'Ignored.',
        detail_level: 'blocks',
        mode: 'accurate',
        page_range: undefined,
        max_pages: undefined,
        skip_cache: false,
        },
      }),
      auth: authFor('key_2'),
    });
    const form = sentForm(spy);
    expect(form.get('segmentation_schema')).toBe('{"segmentation_strategy":"custom","segments":[{"name":"Invoice","description":"The invoice"},{"name":"Contract"}],"granularity":"block"}');
    expect(form.get('mode')).toBe('accurate');
  });

  for (const sections of ['["Invoice","Letter"]', '[{"name":"Invoice"},{"name":"Letter"}]']) {
    it(`reads sections given as the JSON string ${sections} as named sections`, async () => {
      const spy = mockJob(customResult);
      const context = createMockActionContext<typeof aiSegmentDocumentAction.props>({
        propsValue: {
          file_url: 'https://example.com/batch.pdf',
          sections: [],
          instructions: undefined,
          detail_level: undefined,
          mode: undefined,
          page_range: undefined,
          max_pages: undefined,
          skip_cache: false,
        },
      });
      Reflect.set(context.propsValue, 'sections', sections);
      await aiSegmentDocumentAction.run({ ...context, auth: authFor('key_2') });
      expect(sentForm(spy).get('segmentation_schema')).toBe('{"segmentation_strategy":"custom","segments":[{"name":"Invoice"},{"name":"Letter"}]}');
    });
  }

  it('returns completed false with the request ID when Datalab is still working', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    const output = await segmentOperation.run(runParams({ audience: 'ai' }));
    expect(output).toMatchObject({ completed: false, status: 'processing', request_id: 'req_seg' });
    expect(output).toHaveProperty('message');
  });
});

describe('shape', () => {
  it('shapes the page-level automatic result', () => {
    const output = segmentOperation.shape({ result: autoPageResult });
    expect(output).toEqual({
      segments: [
        { name: 'Invoice INV-2026-0042', pages: [0, 1], first_page: 0, last_page: 1, confidence: 'high', segment_type: null, start_block_page: null, start_block_index: null, end_block_page: null, end_block_index: null },
        { name: 'Letter from Acme Robotics', pages: [2], first_page: 2, last_page: 2, confidence: 'high', segment_type: null, start_block_page: null, start_block_index: null, end_block_page: null, end_block_index: null },
        { name: 'Supply Agreement', pages: [3, 4], first_page: 3, last_page: 4, confidence: 'high', segment_type: null, start_block_page: null, start_block_index: null, end_block_page: null, end_block_index: null },
      ],
      segment_count: 3,
      total_pages: 5,
      method: 'document_boundary',
      missing_sections: [],
      unassigned_pages: [],
      markdown: null,
    });
  });

  it('shapes the named-sections result with missing sections, unassigned pages and the Markdown, dropping the JSON and the echoed schema', () => {
    const output = segmentOperation.shape({ result: customResult });
    expect(output.segments.map((segment) => segment.name)).toEqual(['Invoice', 'Contract']);
    expect(output.missing_sections).toEqual(['Letter']);
    expect(output.unassigned_pages).toEqual([1, 2, 4]);
    expect(output.total_pages).toBe(5);
    expect(output.method).toBe('find');
    expect(output.markdown).toBe('# Invoice\n\nINV-2026-0042 ...');
    expect(output).not.toHaveProperty('json');
    expect(output).not.toHaveProperty('segmentation_schema');
    expect(output).not.toHaveProperty('completed');
    expect(output).not.toHaveProperty('request_id');
  });

  it('shapes the block-level result with block positions and without the block list', () => {
    const output = segmentOperation.shape({ result: blockResult });
    expect(output.segments[0]).toEqual({
      name: 'Invoice INV-2026-0042',
      pages: [0, 1],
      first_page: 0,
      last_page: 1,
      confidence: 'medium',
      segment_type: 'invoice',
      start_block_page: 0,
      start_block_index: 0,
      end_block_page: 1,
      end_block_index: 4,
    });
    expect(output.segments[1]).toMatchObject({ segment_type: 'business_letter', start_block_page: 2, end_block_index: 5 });
    expect(output.method).toBe('block_boundary');
    expect(output.markdown).toBe('# Invoice ...');
  });

  it('gives every segment the same keys in every result shape', () => {
    for (const result of [autoPageResult, customResult, blockResult]) {
      for (const segment of segmentOperation.shape({ result }).segments) {
        expect(Object.keys(segment).sort()).toEqual(SEGMENT_KEYS);
      }
    }
  });

  it('falls back to page_count and empty lists when metadata is missing', () => {
    expect(segmentOperation.shape({ result: { segmentation_results: { segments: [{ name: 'A' }, 'junk'] }, page_count: 2 } })).toEqual({
      segments: [{ name: 'A', pages: [], first_page: null, last_page: null, confidence: null, segment_type: null, start_block_page: null, start_block_index: null, end_block_page: null, end_block_index: null }],
      segment_count: 1,
      total_pages: 2,
      method: null,
      missing_sections: [],
      unassigned_pages: [],
      markdown: null,
    });
  });
});

describe('hasOutput', () => {
  it('is true only when segmentation_results is present', () => {
    expect(segmentOperation.hasOutput(autoPageResult)).toBe(true);
    expect(segmentOperation.hasOutput({ status: 'complete', success: true, segmentation_results: null, markdown: '# converted' })).toBe(false);
    expect(segmentOperation.hasOutput({ status: 'complete', success: true })).toBe(false);
  });
});

describe('outputSchema', () => {
  it('starts with the envelope and describes every segment key', () => {
    const keys = segmentOperation.outputSchema.fields.map((field) => field.key);
    expect(keys.slice(0, 4)).toEqual(['completed', 'status', 'request_id', 'message']);
    expect(keys.slice(4)).toEqual(['segments', 'segment_count', 'total_pages', 'method', 'missing_sections', 'unassigned_pages', 'markdown']);
    const segments = segmentOperation.outputSchema.fields.find((field) => field.key === 'segments');
    expect(segments?.listItems?.map((field) => field.key).sort()).toEqual(SEGMENT_KEYS);
  });
});
