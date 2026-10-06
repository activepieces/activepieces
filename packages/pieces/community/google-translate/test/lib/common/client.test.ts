import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { HttpError } = await import('@activepieces/pieces-common');
const { GoogleTranslateApi, GoogleTranslateApiError, TRANSLATE_V2_URL } = await import('../../../src/lib/common/client');

const TOKEN = 'ya29.test-token';

function httpError(status: number, data: unknown): InstanceType<typeof HttpError> {
  return new HttpError({ q: 'x' }, { status, responseBody: data });
}

describe('GoogleTranslateApi', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  describe('translate()', () => {
    it('should POST to v2 with the bearer token and only the fields that were set', async () => {
      sendRequest.mockResolvedValue({
        body: { data: { translations: [{ translatedText: 'Olá', detectedSourceLanguage: 'en' }] } },
      });

      const result = await GoogleTranslateApi.translate({ accessToken: TOKEN, q: 'Hello', target: 'pt' });

      expect(result).toEqual([{ translatedText: 'Olá', detectedSourceLanguage: 'en' }]);
      expect(sendRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: TRANSLATE_V2_URL,
        body: { q: 'Hello', target: 'pt', format: 'text' },
        authentication: { type: 'BEARER_TOKEN', token: TOKEN },
      });
    });

    it('should forward source and html format when given', async () => {
      sendRequest.mockResolvedValue({ body: { data: { translations: [] } } });

      await GoogleTranslateApi.translate({
        accessToken: TOKEN,
        q: ['<b>Hi</b>'],
        target: 'es',
        source: 'en',
        format: 'html',
      });

      expect(sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { q: ['<b>Hi</b>'], target: 'es', source: 'en', format: 'html' },
        })
      );
    });
  });

  describe('detect()', () => {
    it('should keep the top candidate for each input', async () => {
      sendRequest.mockResolvedValue({
        body: {
          data: {
            detections: [
              [{ language: 'pt', confidence: 0.9, isReliable: false }, { language: 'es', confidence: 0.1 }],
              [{ language: 'en', confidence: 1 }],
            ],
          },
        },
      });

      const result = await GoogleTranslateApi.detect({ accessToken: TOKEN, q: ['Olá', 'Hello'] });

      expect(result).toEqual([
        { language: 'pt', confidence: 0.9, isReliable: false },
        { language: 'en', confidence: 1 },
      ]);
      expect(sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST', url: `${TRANSLATE_V2_URL}/detect`, body: { q: ['Olá', 'Hello'] } })
      );
    });
  });

  describe('languages()', () => {
    it('should GET the supported languages rendered in the target language', async () => {
      sendRequest.mockResolvedValue({
        body: { data: { languages: [{ language: 'pt', name: 'Portuguese' }] } },
      });

      const result = await GoogleTranslateApi.languages({ accessToken: TOKEN, target: 'en' });

      expect(result).toEqual([{ language: 'pt', name: 'Portuguese' }]);
      expect(sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: `${TRANSLATE_V2_URL}/languages`,
          queryParams: { target: 'en' },
        })
      );
    });
  });

  describe('when Google answers with an error', () => {
    it("should surface Google's message and status instead of the request body", async () => {
      sendRequest.mockRejectedValue(
        httpError(403, { error: { code: 403, message: 'Cloud Translation API has not been used', status: 'PERMISSION_DENIED' } })
      );

      await expect(GoogleTranslateApi.detect({ accessToken: TOKEN, q: 'x' })).rejects.toMatchObject({
        name: 'GoogleTranslateApiError',
        status: 403,
        googleStatus: 'PERMISSION_DENIED',
        message: 'Google Translate API returned 403 (PERMISSION_DENIED): Cloud Translation API has not been used',
      });
    });

    it('should fall back to the raw body when it is not a Google error envelope', async () => {
      sendRequest.mockRejectedValue(httpError(502, 'Bad Gateway'));

      await expect(GoogleTranslateApi.languages({ accessToken: TOKEN })).rejects.toBeInstanceOf(GoogleTranslateApiError);
      await expect(GoogleTranslateApi.languages({ accessToken: TOKEN })).rejects.toThrow('Google Translate API returned 502: Bad Gateway');
    });

    it('should rethrow errors that are not HttpError untouched', async () => {
      const boom = new Error('socket hang up');
      sendRequest.mockRejectedValue(boom);

      await expect(GoogleTranslateApi.languages({ accessToken: TOKEN })).rejects.toBe(boom);
    });
  });
});
