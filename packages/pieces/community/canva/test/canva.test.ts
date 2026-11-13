import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { canva } from '../src/index';
import { canvaClient } from '../src/lib/common/client';
import { exportDesign } from '../src/lib/actions/export-design';
import { findDesign } from '../src/lib/actions/find-design';
import { uploadAsset } from '../src/lib/actions/upload-asset';
import { moveFolderItem } from '../src/lib/actions/move-folder-item';
import { getJobStatus } from '../src/lib/actions/get-job-status';
import { canvaExportDesignAi } from '../src/lib/actions/ai/export-design';
import { canvaUpdateAssetAi } from '../src/lib/actions/ai/update-asset';
import { canvaDeleteAssetAi } from '../src/lib/actions/ai/delete-asset';
import { canvaCreateDesignAi } from '../src/lib/actions/ai/create-design';
import { canvaGetExportFormatsAi } from '../src/lib/actions/ai/get-export-formats';
import { canvaImportDesignFromUrlAi } from '../src/lib/actions/ai/import-design-from-url';

const AUTH = { access_token: 'tok', type: 'OAUTH2' };

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

function mockResponses(bodies: unknown[]) {
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

function noSleep() {
  return vi.spyOn(canvaClient, 'sleep').mockResolvedValue(undefined);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('piece metadata', () => {
  const actions = Object.values(canva.actions());

  it('has 13 human and 17 ai actions and no both', () => {
    const count = (a: string) => actions.filter((x) => (x.audience ?? 'both') === a).length;
    expect(count('human')).toBe(13);
    expect(count('ai')).toBe(17);
    expect(count('both')).toBe(0);
  });

  it('gives every action except custom api call an outputSchema and a classification', () => {
    for (const action of actions) {
      if (action.name === 'custom_api_call') continue;
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.classification, action.name).toBeDefined();
    }
  });

  it('classifies export as READ and delete asset as DESTRUCTIVE', () => {
    expect(exportDesign.classification).toBe('READ');
    expect(canvaExportDesignAi.classification).toBe('READ');
    expect(canvaDeleteAssetAi.classification).toBe('DESTRUCTIVE');
  });

  it('lists every top-level and nested key the human actions return in their outputSchema', () => {
    const expected: Record<string, string[]> = {
      export_design: ['success', 'job', 'job.urls', 'download_urls', 'export_info', 'export_info.format', 'export_info.dimensions', 'message'],
      upload_asset: ['success', 'job', 'job.asset', 'asset', 'asset.import_status', 'file_info', 'file_info.size_mb', 'file_info.format', 'message'],
      import_design: ['success', 'job', 'job.result', 'designs', 'designs.design_types', 'file_info', 'file_info.mime_type', 'message'],
      get_design: ['success', 'design', 'design.design_types', 'message'],
      create_design: ['success', 'design', 'message'],
      find_design: ['designs', 'total_found', 'has_more', 'continuation_token', 'search_query', 'ownership_filter', 'sort_order', 'design_ids', 'design_titles'],
      get_folder: ['folder', 'folder_id', 'folder_name', 'created_date', 'updated_date', 'has_thumbnail', 'thumbnail_url'],
      get_asset: ['asset', 'asset_id', 'asset_name', 'asset_type', 'tags_count', 'tags_list', 'created_date', 'updated_date', 'has_thumbnail', 'thumbnail_url', 'thumbnail_dimensions', 'is_imported_successfully', 'import_status_state', 'import_error_message'],
      move_folder_item: ['success', 'message', 'moved_item_id', 'destination_folder_id'],
      create_folder: ['folder'],
      list_folder_items: ['items', 'has_more', 'continuation'],
    };
    const actions = canva.actions();
    for (const [name, keys] of Object.entries(expected)) {
      const fields = actions[name]?.outputSchema?.fields ?? [];
      const paths = fields.flatMap((field) => [field.key, ...[...(field.children ?? []), ...(field.listItems ?? [])].map((child) => `${field.key}.${child.key}`)]);
      for (const key of keys) {
        expect(paths, `${name} ${key}`).toContain(key);
      }
    }
  });

  it('requires engine 0.86.4', () => {
    expect(canva.minimumSupportedRelease).toBe('0.86.4');
  });

  it('never points an agent at a removed or missing action name', () => {
    const names = new Set(actions.map((a) => a.name));
    const text = JSON.stringify(actions.map((a) => [a.description, a.aiMetadata?.description]));
    for (const ref of text.match(/canva_[a-z_]+/g) ?? []) {
      expect(names.has(ref), ref).toBe(true);
    }
    expect(text).not.toContain('Get Design Export Job');
    expect(text).not.toContain('Get Asset Upload Job" action');
  });
});

describe('find design', () => {
  it('sends limit, sort and continuation to the API', async () => {
    const spy = mockResponses([{ items: [{ id: 'D1', title: 'One' }], continuation: 'next' }]);
    const out = await run({ action: findDesign, propsValue: { query: ' cats ', sort_by: 'relevance', limit: 5, ownership: 'owned', continuation: 'c0' } });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://api.canva.com/rest/v1/designs');
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.queryParams).toEqual({ query: 'cats', sort_by: 'relevance', limit: '5', ownership: 'owned', continuation: 'c0' });
    expect(req.headers?.['Authorization']).toBe('Bearer tok');
    expect(out).toMatchObject({ total_found: 1, has_more: true, continuation_token: 'next', design_ids: ['D1'] });
  });

  it('rejects an out-of-range limit before calling Canva', async () => {
    const spy = mockResponses([]);
    await expect(run({ action: findDesign, propsValue: { limit: 500 } })).rejects.toThrow('between 1 and 100');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('export design (human)', () => {
  it('polls until success and returns the download urls', async () => {
    noSleep();
    const spy = mockResponses([
      { job: { id: 'E1', status: 'in_progress' } },
      { job: { id: 'E1', status: 'in_progress' } },
      { job: { id: 'E1', status: 'success', urls: ['https://x/1.png'] } },
    ]);
    const out = await run({ action: exportDesign, propsValue: { designId: 'D1', exportFormat: 'jpg', pages: ['1', 2] } });
    expect(spy.mock.calls[0][0].body).toEqual({ design_id: 'D1', format: { type: 'jpg', quality: 80, pages: [1, 2] } });
    expect(spy.mock.calls[1][0].url).toBe('https://api.canva.com/rest/v1/exports/E1');
    expect(out).toMatchObject({ download_urls: ['https://x/1.png'], job: { status: 'success' } });
  });

  it('fails with the job id when the deadline passes', async () => {
    noSleep();
    mockResponses(Array.from({ length: 200 }, () => ({ job: { id: 'E2', status: 'in_progress' } })));
    await expect(run({ action: exportDesign, propsValue: { designId: 'D1', exportFormat: 'pdf', maxWaitSeconds: 5 } })).rejects.toThrow(/E2.*Get Job Status/);
  });

  it('fails with Canva\'s reason when the job fails', async () => {
    noSleep();
    mockResponses([{ job: { id: 'E3', status: 'failed', error: { code: 'license_required', message: 'Buy it' } } }]);
    await expect(run({ action: exportDesign, propsValue: { designId: 'D1', exportFormat: 'pdf' } })).rejects.toThrow(/Buy it \(license_required\)/);
  });

  it('keeps the job id and http details when a status poll fails', async () => {
    noSleep();
    mockResponses([
      { job: { id: 'E6', status: 'in_progress' } },
      new HttpError({}, { status: 429, responseBody: { code: 'too_many_requests', message: 'Slow down' } }),
    ]);
    const error: unknown = await run({ action: exportDesign, propsValue: { designId: 'D1', exportFormat: 'pdf' } }).catch((e: unknown) => e);
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).toContain('job E6');
    expect(message).toContain('Get Job Status');
    expect(message).toContain('rate limit');
    expect(Reflect.get(Object(error), 'status')).toBe(429);
    expect(Reflect.get(Object(error), 'code')).toBe('too_many_requests');
  });

  it('returns the job immediately when waiting is off', async () => {
    const spy = mockResponses([{ job: { id: 'E4', status: 'in_progress' } }]);
    const out = await run({ action: exportDesign, propsValue: { designId: 'D1', exportFormat: 'pdf', waitForCompletion: false } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(out).toMatchObject({ job: { id: 'E4', status: 'in_progress' } });
  });

  it('rejects non-numeric pages', async () => {
    await expect(run({ action: exportDesign, propsValue: { designId: 'D1', exportFormat: 'pdf', pages: ['abc'] } })).rejects.toThrow('whole numbers');
  });
});

describe('tls', () => {
  it('passes a verifying undici dispatcher on every Canva request', async () => {
    const spy = mockResponses([{ design: { id: 'D1' } }]);
    await run({ action: canvaCreateDesignAi, propsValue: { presetName: 'doc' } });
    const dispatcher: unknown = spy.mock.calls[0][1]?.dispatcher;
    const { Agent } = await import('undici');
    expect(dispatcher).toBeInstanceOf(Agent);
    expect(await canvaClient.verifiedTls()).toBe(dispatcher);
  });
});

describe('errors', () => {
  it('keeps Canva\'s message and exposes responseBody but no body field', async () => {
    mockResponses([new HttpError({}, { status: 404, responseBody: { code: 'design_not_found', message: 'Design not found' } })]);
    const error: unknown = await run({ action: canvaGetExportFormatsAi, propsValue: { designId: 'X' } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('Canva says: Design not found (design_not_found)');
    expect(Reflect.get(Object(error), 'responseBody')).toEqual({ code: 'design_not_found', message: 'Design not found' });
    expect(Reflect.has(Object(error), 'body')).toBe(false);
  });
});

describe('upload asset (human)', () => {
  it('sends octet-stream with base64 name metadata and waits for the asset', async () => {
    noSleep();
    const spy = mockResponses([
      { job: { id: 'U1', status: 'in_progress' } },
      { job: { id: 'U1', status: 'success', asset: { id: 'A1', name: 'Logo' } } },
    ]);
    const out = await run({ action: uploadAsset, propsValue: { file: { filename: 'logo.png', base64: Buffer.from('abc').toString('base64') }, assetName: 'Logo' } });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://api.canva.com/rest/v1/asset-uploads');
    expect(req.headers?.['Content-Type']).toBe('application/octet-stream');
    expect(req.headers?.['Asset-Upload-Metadata']).toBe(JSON.stringify({ name_base64: Buffer.from('Logo').toString('base64') }));
    expect(req.redactBodyInErrors).toBe(true);
    expect(spy.mock.calls[1][0].url).toBe('https://api.canva.com/rest/v1/asset-uploads/U1');
    expect(out).toMatchObject({ asset: { id: 'A1' } });
  });
});

describe('move folder item', () => {
  it('handles the 204 response', async () => {
    const spy = mockResponses([undefined]);
    const out = await run({ action: moveFolderItem, propsValue: { to_folder_id: 'F1', item_type: 'design', item_id: 'D1' } });
    expect(spy.mock.calls[0][0].body).toEqual({ to_folder_id: 'F1', item_id: 'D1' });
    expect(out).toMatchObject({ moved_item_id: 'D1', destination_folder_id: 'F1' });
  });
});

describe('get job status', () => {
  it('routes url imports to /url-imports and flattens the result', async () => {
    const spy = mockResponses([{ job: { id: 'J1', status: 'success', result: { designs: [{ id: 'D9' }] } } }]);
    const out = await run({ action: getJobStatus, propsValue: { jobType: 'url_import', jobId: 'J1' } });
    expect(spy.mock.calls[0][0].url).toBe('https://api.canva.com/rest/v1/url-imports/J1');
    expect(out).toMatchObject({ job_type: 'url_import', status: 'success', designs: [{ id: 'D9' }], error_code: null });
  });
});

describe('ai atomics', () => {
  it('export returns in_progress with the job id after the short wait instead of failing', async () => {
    noSleep();
    mockResponses(Array.from({ length: 200 }, () => ({ job: { id: 'E5', status: 'in_progress' } })));
    const out = await run({ action: canvaExportDesignAi, propsValue: { designId: 'D1', format: 'png' } });
    expect(out).toMatchObject({ job_id: 'E5', status: 'in_progress', urls: [] });
  });

  it('export names the job id when a status poll fails', async () => {
    noSleep();
    mockResponses([
      { job: { id: 'E7', status: 'in_progress' } },
      new HttpError({}, { status: 500, responseBody: { code: 'internal_error', message: 'Oops' } }),
    ]);
    await expect(run({ action: canvaExportDesignAi, propsValue: { designId: 'D1', format: 'png' } })).rejects.toThrow(/E7.*the canva_get_export_job tool/);
  });

  it('update asset sends only provided fields and supports clearing tags', async () => {
    const spy = mockResponses([{ asset: { id: 'A1' } }, { asset: { id: 'A1' } }]);
    await run({ action: canvaUpdateAssetAi, propsValue: { assetId: 'A1', tags: ['a', ' b '] } });
    expect(spy.mock.calls[0][0].method).toBe(HttpMethod.PATCH);
    expect(spy.mock.calls[0][0].body).toEqual({ tags: ['a', 'b'] });
    await run({ action: canvaUpdateAssetAi, propsValue: { assetId: 'A1', clearTags: true } });
    expect(spy.mock.calls[1][0].body).toEqual({ tags: [] });
  });

  it('update asset refuses an empty update', async () => {
    await expect(run({ action: canvaUpdateAssetAi, propsValue: { assetId: 'A1' } })).rejects.toThrow('Nothing to update');
  });

  it('delete asset calls DELETE and reports the id', async () => {
    const spy = mockResponses([undefined]);
    const out = await run({ action: canvaDeleteAssetAi, propsValue: { assetId: 'A1' } });
    expect(spy.mock.calls[0][0].method).toBe(HttpMethod.DELETE);
    expect(spy.mock.calls[0][0].url).toBe('https://api.canva.com/rest/v1/assets/A1');
    expect(out).toEqual({ deleted: true, asset_id: 'A1' });
  });

  it('create design builds a custom design body', async () => {
    const spy = mockResponses([{ design: { id: 'D1' } }]);
    await run({ action: canvaCreateDesignAi, propsValue: { width: 800, height: 600, title: ' Hi ' } });
    expect(spy.mock.calls[0][0].body).toEqual({ type: 'type_and_asset', design_type: { type: 'custom', width: 800, height: 600 }, title: 'Hi' });
  });

  it('create design refuses preset plus size', async () => {
    await expect(run({ action: canvaCreateDesignAi, propsValue: { presetName: 'doc', width: 800, height: 600 } })).rejects.toThrow('not both');
  });

  it('export formats flattens page support', async () => {
    mockResponses([{ formats: { pdf: {}, png: { page_numbers: [1, 3] } } }]);
    const out = await run({ action: canvaGetExportFormatsAi, propsValue: { designId: 'D1' } });
    expect(out).toEqual({
      formats: [
        { format: 'pdf', all_pages: true, page_numbers: [] },
        { format: 'png', all_pages: false, page_numbers: [1, 3] },
      ],
    });
  });

  it('import from url posts json to /url-imports', async () => {
    const spy = mockResponses([{ job: { id: 'I1', status: 'success', result: { designs: [{ id: 'D2' }] } } }]);
    await run({ action: canvaImportDesignFromUrlAi, propsValue: { url: 'https://example.com/a.pdf', title: 'Doc' } });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://api.canva.com/rest/v1/url-imports');
    expect(req.body).toEqual({ title: 'Doc', url: 'https://example.com/a.pdf' });
    expect(req.headers?.['Content-Type']).toBe('application/json');
  });
});

describe('job failure error', () => {
  it('keeps Canva reason and code without a success http status', () => {
    const error = canvaClient.jobFailureError({
      jobLabel: 'asset upload from URL',
      jobId: 'job-1',
      error: { code: 'fetch_failed', message: 'Failed to download file' },
    });
    expect(error.message).toBe('The Canva asset upload from URL job job-1 failed. Canva says: Failed to download file (fetch_failed)');
    expect(error.code).toBe('fetch_failed');
    expect(error.status).toBeUndefined();
  });
});
