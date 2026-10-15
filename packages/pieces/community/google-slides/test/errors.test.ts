import { describe, expect, it } from 'vitest';
import { HttpError } from '@activepieces/pieces-common';
import { slidesApi } from '../src/lib/commons/common';

function gaxiosError({ status, data }: { status: number; data: unknown }) {
  return Object.assign(new Error('Request failed'), { code: status, response: { status, data } });
}

describe('googleApiError', () => {
  it('reads Google message from gaxios data when body is an already-read stream', () => {
    const error = Object.assign(new Error('Request failed'), {
      code: 403,
      response: {
        status: 403,
        body: { locked: true, readable: false },
        data: { error: { code: 403, message: "The user's Drive storage quota has been exceeded.", errors: [{ reason: 'storageQuotaExceeded' }] } },
      },
    });
    expect(slidesApi.googleApiError({ error, action: 'create the presentation' }).message).toBe(
      "Could not create the presentation: the account has no Google Drive storage left. A service account has no storage of its own, so pick a folder in a Shared Drive it is a member of. Google says: The user's Drive storage quota has been exceeded."
    );
  });

  it('keeps Google message for a gaxios 403 with a stream body', () => {
    const error = Object.assign(new Error('Request failed'), {
      code: 403,
      response: { status: 403, body: { locked: true }, data: { error: { code: 403, message: 'The caller does not have permission' } } },
    });
    expect(slidesApi.googleApiError({ error, action: 'add the slide' }).message).toMatch(/permission denied \(403\).*Google says: The caller does not have permission/);
  });

  it('maps httpClient errors with Google message', () => {
    const error = new HttpError({}, { status: 404, responseBody: { error: { code: 404, message: 'Requested entity was not found.' } } });
    const mapped = slidesApi.googleApiError({ error, action: 'get the presentation' });
    expect(mapped.message).toBe(
      'Could not get the presentation: not found (404). Check the ID, and that the file is shared with the connected account. Google says: Requested entity was not found.'
    );
  });

  it.each([
    [400, /rejected the request \(400\)/],
    [401, /Reconnect the account/],
    [403, /permission denied \(403\)/],
    [429, /rate limit/],
    [500, /\(HTTP 500\)/],
  ])('maps gaxios status %i', (status, pattern) => {
    expect(slidesApi.googleApiError({ error: gaxiosError({ status, data: { error: { message: 'x' } } }), action: 'copy' }).message).toMatch(pattern);
  });

  it('explains a stale revision instead of a generic 400', () => {
    const error = new HttpError(
      {},
      { status: 400, responseBody: { error: { code: 400, message: "The required revision ID 'abc' does not match the latest revision." } } }
    );
    expect(slidesApi.googleApiError({ error, action: 'move the slide' }).message).toBe(
      "Could not move the slide: the presentation changed since it was read, so nothing was changed. Run the step again (for Batch Update, first get a fresh Required Revision ID from Get Presentation Outline). Google says: The required revision ID 'abc' does not match the latest revision."
    );
    const other = new HttpError({}, { status: 400, responseBody: { error: { code: 400, message: 'Invalid requests[0].createShape' } } });
    expect(slidesApi.googleApiError({ error: other, action: 'x' }).message).toMatch(/rejected the request \(400\)/);
  });

  it('decodes an arraybuffer error body and spots the export size limit', () => {
    const body = Buffer.from(JSON.stringify({ error: { message: 'too big', errors: [{ reason: 'exportSizeLimitExceeded' }] } }));
    const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    expect(slidesApi.googleApiError({ error: gaxiosError({ status: 403, data: arrayBuffer }), action: 'export the presentation' }).message).toMatch(
      /10 MB export limit/
    );
  });

  it('returns errors without an HTTP status unchanged', () => {
    const original = new Error('Set both X and Y, or leave both empty.');
    expect(slidesApi.googleApiError({ error: original, action: 'x' })).toBe(original);
    expect(slidesApi.googleApiError({ error: 'boom', action: 'x' }).message).toBe('boom');
  });

  it('builds slide URLs', () => {
    expect(slidesApi.slideUrl({ presentationId: 'abc', slideObjectId: 'p' })).toBe('https://docs.google.com/presentation/d/abc/edit#slide=id.p');
  });
});
