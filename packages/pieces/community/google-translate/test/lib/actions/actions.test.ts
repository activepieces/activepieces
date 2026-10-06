import { beforeEach, describe, expect, it, vi } from 'vitest';

const translate = vi.fn<() => Promise<unknown>>();
const detect = vi.fn<() => Promise<unknown>>();
const languages = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleTranslateApi: { translate, detect, languages } };
});

const { translateText } = await import('../../../src/lib/actions/translate-text');
const { detectLanguage } = await import('../../../src/lib/actions/detect-language');
const { listLanguages } = await import('../../../src/lib/actions/list-languages');

const TOKEN = 'ya29.test-token';

function actionContext(propsValue: Record<string, unknown>) {
  return { auth: { access_token: TOKEN }, propsValue } as never;
}

describe('translateText', () => {
  beforeEach(() => {
    translate.mockReset();
  });

  it('should translate with the connection token and the selected languages', async () => {
    translate.mockResolvedValue([{ translatedText: 'Olá mundo', detectedSourceLanguage: 'en' }]);

    const output = await translateText.run(
      actionContext({ text: 'Hello world', targetLanguage: 'pt', sourceLanguage: '', format: undefined })
    );

    expect(translate).toHaveBeenCalledWith({
      accessToken: TOKEN,
      q: 'Hello world',
      target: 'pt',
      source: undefined,
      format: 'text',
    });
    expect(output).toEqual({
      translatedText: 'Olá mundo',
      detectedSourceLanguage: 'en',
      targetLanguage: 'pt',
    });
  });

  it('should pass an explicit source language and html format through', async () => {
    translate.mockResolvedValue([{ translatedText: '<b>Hola</b>' }]);

    const output = await translateText.run(
      actionContext({ text: '<b>Hi</b>', targetLanguage: 'es', sourceLanguage: 'en', format: 'html' })
    );

    expect(translate).toHaveBeenCalledWith({
      accessToken: TOKEN,
      q: '<b>Hi</b>',
      target: 'es',
      source: 'en',
      format: 'html',
    });
    expect(output).toEqual({
      translatedText: '<b>Hola</b>',
      detectedSourceLanguage: 'en',
      targetLanguage: 'es',
    });
  });

  it('should fail loudly when Google returns no translation', async () => {
    translate.mockResolvedValue([]);

    await expect(
      translateText.run(actionContext({ text: 'x', targetLanguage: 'pt' }))
    ).rejects.toThrow('Google Translate returned no translation for the given text.');
  });
});

describe('detectLanguage', () => {
  beforeEach(() => {
    detect.mockReset();
  });

  it('should return the top detection with null confidence when Google omits it', async () => {
    detect.mockResolvedValue([{ language: 'pt' }]);

    const output = await detectLanguage.run(actionContext({ text: 'Olá' }));

    expect(detect).toHaveBeenCalledWith({ accessToken: TOKEN, q: 'Olá' });
    expect(output).toEqual({ language: 'pt', confidence: null });
  });

  it('should drop the deprecated isReliable flag from the output', async () => {
    detect.mockResolvedValue([{ language: 'en', confidence: 1, isReliable: false }]);

    const output = await detectLanguage.run(actionContext({ text: 'Hello' }));

    expect(output).toEqual({ language: 'en', confidence: 1 });
  });

  it('should fail loudly when nothing was detected', async () => {
    detect.mockResolvedValue([]);

    await expect(detectLanguage.run(actionContext({ text: '' }))).rejects.toThrow(
      'Google Translate could not detect a language for the given text.'
    );
  });
});

describe('listLanguages', () => {
  beforeEach(() => {
    languages.mockReset();
  });

  it('should default the display language to en', async () => {
    languages.mockResolvedValue([{ language: 'pt', name: 'Portuguese' }]);

    const output = await listLanguages.run(actionContext({ displayLanguage: undefined }));

    expect(languages).toHaveBeenCalledWith({ accessToken: TOKEN, target: 'en' });
    expect(output).toEqual({ languages: [{ language: 'pt', name: 'Portuguese' }] });
  });

  it('should render names in the requested display language', async () => {
    languages.mockResolvedValue([]);

    await listLanguages.run(actionContext({ displayLanguage: 'pt' }));

    expect(languages).toHaveBeenCalledWith({ accessToken: TOKEN, target: 'pt' });
  });
});
