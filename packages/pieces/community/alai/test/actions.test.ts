import { httpClient, HttpError } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addSlide } from '../src/lib/actions/add-slide';
import { alaiCustomApiCall, urlOf } from '../src/lib/actions/custom-api-call';
import { deletePresentation } from '../src/lib/actions/delete-presentation';
import { deleteSlide } from '../src/lib/actions/delete-slide';
import { exportPresentation } from '../src/lib/actions/export-presentation';
import { generatePresentation } from '../src/lib/actions/generate-presentation';
import { generateSpeakerNotes } from '../src/lib/actions/generate-speaker-notes';
import { getGeneration } from '../src/lib/actions/get-generation';
import { listPresentations, listThemes } from '../src/lib/actions/list-resources';
import { uploadImages } from '../src/lib/actions/upload-images';
import { alaiAuth } from '../src/lib/common/auth';
import { addSlideAi, exportPresentationAi, generatePresentationAi, generateSpeakerNotesAi } from '../src/lib/actions/ai-actions';

const AUTH = { props: { apiKey: ' key123 ' } };

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

function mockResponses({ bodies = [] }: { bodies?: unknown[] } = {}) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) {
    if (body instanceof HttpError) {
      spy.mockRejectedValueOnce(body);
    } else {
      spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
    }
  }
  return spy;
}

const httpError = ({ status, body }: { status: number; body: unknown }) => new HttpError({}, { status, responseBody: body });

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('generatePresentation', () => {
  it('sends only spec fields and returns the normalized shape without waiting', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 'g1' }] });
    const out = await run({ action: generatePresentation, propsValue: {
      inputText: ' Hello ',
      slideRange: '2-5',
      language: 'German',
      themeId: 'th-1',
      vibeId: 'v1',
      includeAiImages: false,
      imageIds: ['img1'],
      exportFormats: ['pdf'],
    } });
    const [req, opts] = spy.mock.calls[0];
    expect(req.url).toBe('https://slides-api.getalai.com/api/v1/generations');
    expect(req.method).toBe('POST');
    expect(req.headers).toMatchObject({ Authorization: 'Bearer key123' });
    expect(req.followRedirects).toBe(false);
    expect(opts).toHaveProperty('dispatcher');
    expect(req.body).toEqual({
      input_text: 'Hello',
      export_formats: ['pdf'],
      image_ids: ['img1'],
      presentation_options: { theme_id: 'th-1', vibe_id: 'v1', slide_range: '2-5' },
      text_options: { language: 'German' },
      image_options: { include_ai_images: false },
    });
    expect(out).toMatchObject({ generation_id: 'g1', status: 'pending', completed: false, pdf_url: null });
  });

  it('turns legacy tone, content mode and density into instructions', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 'g9' }] });
    await run({ action: generatePresentation, propsValue: { inputText: 'x', tone: 'PERSUASIVE', contentMode: 'CONDENSE', amountMode: 'MINIMAL', additionalInstructions: 'Blue.' } });
    expect(spy.mock.calls[0][0].body).toMatchObject({
      additional_instructions: 'Use a persuasive tone. Condense the input text. Text density per slide: minimal. Blue.',
    });
    expect(spy.mock.calls[0][0].body).not.toHaveProperty('text_options');
  });

  it('requires style instructions for custom style', async () => {
    const spy = mockResponses();
    await expect(run({ action: generatePresentation, propsValue: { inputText: 'x', imageStyle: 'custom' } })).rejects.toThrow('Image Style Instructions');
    expect(spy).not.toHaveBeenCalled();
  });

  it('waits, flattens URLs and fails when a requested format failed', async () => {
    vi.useFakeTimers();
    mockResponses({ bodies: [
      { generation_id: 'g2' },
      httpError({ status: 404, body: { detail: 'not found' } }),
      { generation_id: 'g2', status: 'completed', formats: { link: { status: 'completed', url: 'https://l' }, pdf: { status: 'failed', error: 'boom' } } }
    ] });
    const promise = run({ action: generatePresentation, propsValue: { inputText: 'x', exportFormats: ['link', 'pdf'], waitForCompletion: true } });
    const assertion = expect(promise).rejects.toThrow('pdf: boom');
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('times out within the clamp and names the generation id', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { generation_id: 'g3' } });
    spy.mockResolvedValue({ status: 200, headers: {}, body: { generation_id: 'g3', status: 'in_progress' } });
    const promise = run({ action: generatePresentation, propsValue: { inputText: 'x', waitForCompletion: true, maxWaitTime: 99999 } });
    const assertion = expect(promise).rejects.toThrow(/g3 is still running/);
    await vi.runAllTimersAsync();
    await assertion;
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2 + 480 / 5);
  });

  it('treats empty Image Style, Language and Slide Type as unset', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 'g5' }, { generation_id: 'a7' }] });
    await run({ action: generatePresentation, propsValue: { inputText: 'x', imageStyle: '', language: '' } });
    expect(spy.mock.calls[0][0].body).not.toHaveProperty('image_options.style');
    expect(spy.mock.calls[0][0].body).not.toHaveProperty('text_options');
    await run({ action: addSlide, propsValue: { presentationId: 'p1', slide_context: 'S', slideType: '' } });
    expect(spy.mock.calls[1][0].body).not.toHaveProperty('options.slide_type');
  });

  it('treats an empty Slide Range and Max Wait Time 0 as unset', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { generation_id: 'g4' } });
    spy.mockResolvedValue({ status: 200, headers: {}, body: { generation_id: 'g4', status: 'in_progress' } });
    const promise = run({ action: generatePresentation, propsValue: { inputText: 'x', slideRange: '', waitForCompletion: true, maxWaitTime: 0 } });
    const assertion = expect(promise).rejects.toThrow(/g4 is still running/);
    await vi.runAllTimersAsync();
    await assertion;
    expect(spy.mock.calls[0][0].body).not.toHaveProperty('presentation_options.slide_range');
    expect(spy.mock.calls.length).toBeGreaterThan(2 + 240 / 5);
  });

  it('maps 402 and 422 errors to readable messages', async () => {
    mockResponses({ bodies: [httpError({ status: 402, body: { detail: 'Insufficient credits' } })] });
    await expect(run({ action: generatePresentation, propsValue: { inputText: 'x' } })).rejects.toThrow(/AI credits.*Insufficient credits/);
    mockResponses({ bodies: [httpError({ status: 422, body: { detail: [{ loc: ['body', 'input_text'], msg: 'field required' }] } })] });
    await expect(run({ action: generatePresentation, propsValue: { inputText: 'x' } })).rejects.toThrow('body.input_text: field required');
  });
});

describe('exportPresentation', () => {
  it('posts formats (not export_formats)', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 'e1' }] });
    await run({ action: exportPresentation, propsValue: { presentationId: 'p1', exportFormats: ['pdf', 'ppt'] } });
    expect(spy.mock.calls[0][0].url).toBe('https://slides-api.getalai.com/api/v1/presentations/p1/exports');
    expect(spy.mock.calls[0][0].body).toEqual({ formats: ['pdf', 'ppt'] });
  });

  it('rejects path traversal in IDs before any request', async () => {
    const spy = mockResponses();
    await expect(run({ action: exportPresentation, propsValue: { presentationId: '../ping', exportFormats: ['link'] } })).rejects.toThrow('not a valid Alai ID');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('addSlide', () => {
  it('sends integer slide_order and spec options only', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 's1' }] });
    await run({ action: addSlide, propsValue: { presentationId: 'p1', slide_context: 'Topic', slide_order: '2', slideType: 'creative', variantsPerSlide: 2 } });
    expect(spy.mock.calls[0][0].body).toEqual({
      slide_context: 'Topic',
      options: { slide_type: 'creative', slide_order: 2, total_variants_per_slide: 2 },
      export_formats: ['link'],
    });
  });

  it('omits slide_order to append (empty or legacy "end"), maps image hints and rejects negatives', async () => {
    const legacy = mockResponses({ bodies: [{ generation_id: 's3' }] });
    await run({ action: addSlide, propsValue: { presentationId: 'p1', slide_context: 'T', slide_order: 'end', includeAiImages: false } });
    expect(legacy.mock.calls[0][0].body).toMatchObject({ options: { additional_instructions: 'Do not use images on this slide.' } });
    vi.restoreAllMocks();
    const spy = mockResponses({ bodies: [{ generation_id: 's2' }] });
    await run({ action: addSlide, propsValue: { presentationId: 'p1', slide_context: 'Topic' } });
    expect(spy.mock.calls[0][0].body).toMatchObject({ options: {} });
    await expect(run({ action: addSlide, propsValue: { presentationId: 'p1', slide_context: 'T', slide_order: -1 } })).rejects.toThrow('Slide Position');
  });
});

describe('speaker notes, get, delete', () => {
  it('posts slide_ids when given', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 't1' }] });
    await run({ action: generateSpeakerNotes, propsValue: { presentationId: 'p1', slideIds: ['a', ' '] } });
    expect(spy.mock.calls[0][0].url).toBe('https://slides-api.getalai.com/api/v1/presentations/p1/transcripts');
    expect(spy.mock.calls[0][0].body).toEqual({ slide_ids: ['a'] });
  });

  it('get generation normalizes transcripts', async () => {
    mockResponses({ bodies: [{ generation_id: 't1', status: 'completed', transcripts: [{ slide_id: 'a', slide_order: 0, title: 'T', content: 'C', layout: 'L' }] }] });
    const out = await run({ action: getGeneration, propsValue: { generationId: 't1' } });
    expect(out).toMatchObject({ completed: true, transcripts: [{ slide_id: 'a', slide_order: 0, title: 'T', content: 'C', layout: 'L' }] });
  });

  it('delete presentation reports 404 as a named error', async () => {
    mockResponses({ bodies: [httpError({ status: 404, body: { detail: 'Presentation not found' } })] });
    await expect(run({ action: deletePresentation, propsValue: { presentationId: 'p1' } })).rejects.toThrow(/could not find.*Presentation not found/);
  });

  it('delete slide hits the slide path', async () => {
    const spy = mockResponses({ bodies: [{ success: true }] });
    const out = await run({ action: deleteSlide, propsValue: { presentationId: 'p1', slideId: 's9' } });
    expect(spy.mock.calls[0][0].url).toBe('https://slides-api.getalai.com/api/v1/presentations/p1/slides/s9');
    expect(spy.mock.calls[0][0].method).toBe('DELETE');
    expect(out).toEqual({ success: true, presentation_id: 'p1', slide_id: 's9' });
  });
});

describe('list actions', () => {
  it('maps id, filters and reports truncation', async () => {
    mockResponses({ bodies: [{ presentations: [{ id: '1', title: 'Sales Q1' }, { id: '2', title: 'sales Q2' }, { id: '3', title: 'Other' }] }] });
    const out = await run({ action: listPresentations, propsValue: { titleContains: 'SALES', limit: 1 } });
    expect(out).toEqual({ presentations: [{ id: '1', title: 'Sales Q1' }], count: 1, total: 2, truncated: true });
  });

  it('fails on an unexpected body instead of returning empty', async () => {
    mockResponses({ bodies: [{ nope: [] }] });
    await expect(run({ action: listThemes, propsValue: {} })).rejects.toThrow('unexpected response');
  });
});

describe('uploadImages', () => {
  it('rejects unsupported types and too many files before sending', async () => {
    const spy = mockResponses();
    await expect(run({ action: uploadImages, propsValue: { images: [{ file: { filename: 'a.txt', extension: 'txt', data: Buffer.from('x') } }] } })).rejects.toThrow('not a supported');
    const many = Array.from({ length: 11 }, () => ({ file: { filename: 'a.png', data: Buffer.from('x') } }));
    await expect(run({ action: uploadImages, propsValue: { images: many } })).rejects.toThrow('at most 10');
    await expect(run({ action: uploadImages, propsValue: { images: [{ file: { filename: 'a.png', data: Buffer.alloc(10 * 1024 * 1024 + 1) } }] } })).rejects.toThrow('10 MB');
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends multipart files and returns ids', async () => {
    const spy = mockResponses({ bodies: [{ image_ids: ['i1'] }] });
    const out = await run({ action: uploadImages, propsValue: { images: [{ file: { filename: 'a.png', data: Buffer.from('x') } }] } });
    expect(spy.mock.calls[0][0].body).toBeInstanceOf(FormData);
    expect(spy.mock.calls[0][0].headers).not.toHaveProperty('Content-Type');
    expect(out).toMatchObject({ image_ids: ['i1'] });
  });
});

describe('custom api call url guard', () => {
  it('accepts relative and same-host URLs', () => {
    expect(urlOf({ url: '/v1/themes' })).toBe('https://slides-api.getalai.com/api/v1/themes');
    expect(urlOf({ url: '/themes' })).toBe('https://slides-api.getalai.com/api/v1/themes');
    expect(urlOf({ url: 'presentations?x=1' })).toBe('https://slides-api.getalai.com/api/v1/presentations?x=1');
    expect(urlOf({ url: '/modern/v1/ping' })).toBe('https://slides-api.getalai.com/api/modern/v1/ping');
    expect(urlOf({ url: 'https://slides-api.getalai.com/api/modern/v1/ping' })).toBe('https://slides-api.getalai.com/api/modern/v1/ping');
  });

  it.each([
    'https://slides-api.getalai.com.evil.io/api/v1',
    '//evil.io/api',
    'https://user@slides-api.getalai.com/api/v1',
    '/v1/../../x',
    '/v1/%2e%2e/x',
    'http://slides-api.getalai.com/api/v1',
    'https://slides-api.getalai.com/other',
  ])('rejects %s', (url) => {
    expect(() => urlOf({ url })).toThrow();
  });
});

describe('auth validate', () => {
  it('reports invalid credentials on 401 and 403 only', async () => {
    const validateFn = alaiAuth.validate;
    if (!validateFn) {
      throw new Error('no validate');
    }
    const validate = (args: unknown): Promise<unknown> => Promise.resolve(Reflect.apply(validateFn, alaiAuth, [args]));
    mockResponses({ bodies: [httpError({ status: 403, body: {} })] });
    expect(await validate({ auth: { apiKey: 'k' } })).toEqual({ valid: false, error: 'Invalid Alai API key.' });
    mockResponses({ bodies: [httpError({ status: 500, body: {} })] });
    expect(await validate({ auth: { apiKey: 'k' } })).toMatchObject({ error: expect.stringMatching(/Could not reach/) });
    const spy = mockResponses({ bodies: [{ user_id: 'u' }] });
    expect(await validate({ auth: { apiKey: ' k ' } })).toEqual({ valid: true });
    expect(spy.mock.calls[0][0].headers).toMatchObject({ Authorization: 'Bearer k' });
  });
});

describe('agent tools', () => {
  it('generate_presentation_ai sends one request, maps tone and never waits', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 'a1' }] });
    const out = await run({ action: generatePresentationAi, propsValue: { inputText: 'x', tone: 'CASUAL', slideRange: '1', themeId: 't1' } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].body).toEqual({
      input_text: 'x',
      export_formats: ['link'],
      additional_instructions: 'Use a casual tone.',
      presentation_options: { theme_id: 't1', slide_range: '1' },
    });
    expect(out).toMatchObject({ generation_id: 'a1', status: 'pending' });
  });

  it('add_slide_ai sends an integer slideOrder', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 'a2' }] });
    await run({ action: addSlideAi, propsValue: { presentationId: 'p1', slideContext: 'S', slideOrder: 0, slideType: 'classic' } });
    expect(spy.mock.calls[0][0].url).toBe('https://slides-api.getalai.com/api/v1/presentations/p1/slides');
    expect(spy.mock.calls[0][0].body).toEqual({ slide_context: 'S', options: { slide_type: 'classic', slide_order: 0 }, export_formats: ['link'] });
  });

  it('add_slide_ai keeps images when the agent leaves Include Images out', async () => {
    expect(addSlideAi.props.includeAiImages.defaultValue).toBe(true);
    const spy = mockResponses({ bodies: [{ generation_id: 'a5' }, { generation_id: 'a6' }] });
    await run({ action: addSlideAi, propsValue: { presentationId: 'p1', slideContext: 'S', includeAiImages: addSlideAi.props.includeAiImages.defaultValue } });
    expect(JSON.stringify(spy.mock.calls[0][0].body)).not.toContain('Do not use images');
    await run({ action: addSlideAi, propsValue: { presentationId: 'p1', slideContext: 'S', includeAiImages: false } });
    expect(JSON.stringify(spy.mock.calls[1][0].body)).toContain('Do not use images');
  });

  it('export_presentation_ai posts formats and requires one', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 'a3' }] });
    await run({ action: exportPresentationAi, propsValue: { presentationId: 'p1', formats: ['pdf'] } });
    expect(spy.mock.calls[0][0].body).toEqual({ formats: ['pdf'] });
    await expect(run({ action: exportPresentationAi, propsValue: { presentationId: 'p1', formats: [] } })).rejects.toThrow('at least one format');
  });

  it('generate_speaker_notes_ai posts all slides when none given', async () => {
    const spy = mockResponses({ bodies: [{ generation_id: 'a4' }] });
    await run({ action: generateSpeakerNotesAi, propsValue: { presentationId: 'p1' } });
    expect(spy.mock.calls[0][0].body).toEqual({});
  });
});

describe('custom api call binary download', () => {
  it('keeps the file extension from content-type', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({ status: 200, headers: { 'content-type': 'application/pdf; charset=binary' }, body: Buffer.from('%PDF') });
    const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
    const write = vi.fn(async ({ fileName }: { fileName: string }) => `file://${fileName}`);
    const out = await Promise.resolve(
      Reflect.apply(alaiCustomApiCall.run, alaiCustomApiCall, [
        { ...base, files: { write }, auth: AUTH, propsValue: { method: 'GET', url: { url: '/presentations/p1/file' }, headers: {}, queryParams: {}, response_is_binary: true } },
      ])
    );
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ fileName: 'output.pdf' }));
    expect(out).toMatchObject({ status: 200, body: 'file://output.pdf' });
  });
});
