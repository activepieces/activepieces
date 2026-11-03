import { beforeEach, describe, expect, it, vi } from 'vitest';

const translate = vi.fn<() => Promise<unknown>>();
const detect = vi.fn<() => Promise<unknown>>();
const languages = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/api', () => ({
  googleTranslateApi: { translate, detect, listLanguages: languages },
}));

const { translateTextAction } = await import('../../../src/lib/actions/translate-text');
const { detectLanguageAction } = await import('../../../src/lib/actions/detect-language');
const { listLanguagesAction } = await import('../../../src/lib/actions/list-languages');

const AUTH = { access_token: 'ya29.test-token' };

function actionContext(propsValue: Record<string, unknown>) {
  return { auth: AUTH, propsValue } as never;
}

describe('translateTextAction', () => {
  beforeEach(() => {
    translate.mockReset();
  });

  it('should translate with the connection token and the selected languages', async () => {
    translate.mockResolvedValue([{ translatedText: 'Olá mundo', detectedSourceLanguage: 'en' }]);

    const output = await translateTextAction.run(
      actionContext({ text: 'Hello world', targetLanguage: 'pt', sourceLanguage: '', format: undefined })
    );

    expect(translate).toHaveBeenCalledWith({
      auth: AUTH,
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

    const output = await translateTextAction.run(
      actionContext({ text: '<b>Hi</b>', targetLanguage: 'es', sourceLanguage: 'en', format: 'html' })
    );

    expect(translate).toHaveBeenCalledWith({
      auth: AUTH,
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
      translateTextAction.run(actionContext({ text: 'x', targetLanguage: 'pt' }))
    ).rejects.toThrow('Google Translate returned no translation for the given text.');
  });
});

describe('detectLanguageAction', () => {
  beforeEach(() => {
    detect.mockReset();
    languages.mockReset();
    languages.mockResolvedValue([
      { language: 'pt', name: 'Portuguese' },
      { language: 'en', name: 'English' },
    ]);
  });

  it('should return the top detection with null confidence when Google omits it', async () => {
    detect.mockResolvedValue([{ language: 'pt' }]);

    const output = await detectLanguageAction.run(actionContext({ text: 'Olá' }));

    expect(detect).toHaveBeenCalledWith({ auth: AUTH, q: 'Olá' });
    expect(languages).toHaveBeenCalledWith({ auth: AUTH, target: 'en' });
    expect(output).toEqual({ language: 'pt', languageName: 'Portuguese', confidence: null });
  });

  it('should drop the deprecated isReliable flag from the output', async () => {
    detect.mockResolvedValue([{ language: 'en', confidence: 1, isReliable: false }]);

    const output = await detectLanguageAction.run(actionContext({ text: 'Hello' }));

    expect(output).toEqual({ language: 'en', languageName: 'English', confidence: 1 });
  });

  it('should return a null name for a code Google does not list, like und', async () => {
    detect.mockResolvedValue([{ language: 'und', confidence: 0 }]);

    const output = await detectLanguageAction.run(actionContext({ text: '12345' }));

    expect(output).toEqual({ language: 'und', languageName: null, confidence: 0 });
  });

  it('should fail loudly when nothing was detected', async () => {
    detect.mockResolvedValue([]);

    await expect(detectLanguageAction.run(actionContext({ text: '' }))).rejects.toThrow(
      'Google Translate could not detect a language for the given text.'
    );
  });
});

describe('listLanguagesAction', () => {
  beforeEach(() => {
    languages.mockReset();
  });

  it('should default the display language to en', async () => {
    languages.mockResolvedValue([{ language: 'pt', name: 'Portuguese' }]);

    const output = await listLanguagesAction.run(actionContext({ displayLanguage: undefined }));

    expect(languages).toHaveBeenCalledWith({ auth: AUTH, target: 'en' });
    expect(output).toEqual({ languages: [{ language: 'pt', name: 'Portuguese' }] });
  });

  it('should render names in the requested display language', async () => {
    languages.mockResolvedValue([]);

    await listLanguagesAction.run(actionContext({ displayLanguage: 'pt' }));

    expect(languages).toHaveBeenCalledWith({ auth: AUTH, target: 'pt' });
  });
});
