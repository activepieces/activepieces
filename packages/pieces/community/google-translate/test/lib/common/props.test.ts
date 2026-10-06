import { beforeEach, describe, expect, it, vi } from 'vitest';

const languages = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleTranslateApi: { languages } };
});

const { languageOptions } = await import('../../../src/lib/common/props');

describe('languageOptions()', () => {
  beforeEach(() => {
    languages.mockReset();
  });

  it('should ask for a connection and make no request when there is no token', async () => {
    const state = await languageOptions(undefined);

    expect(state).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Please select an existing or create a new connection.',
    });
    expect(languages).not.toHaveBeenCalled();
  });

  it('should list languages as "Name (code)" sorted by label', async () => {
    languages.mockResolvedValue([
      { language: 'pt', name: 'Portuguese' },
      { language: 'de', name: 'German' },
      { language: 'zz' },
    ]);

    const state = await languageOptions({ access_token: 'tok' });

    expect(languages).toHaveBeenCalledWith({ accessToken: 'tok', target: 'en' });
    expect(state).toEqual({
      disabled: false,
      options: [
        { label: 'German (de)', value: 'de' },
        { label: 'Portuguese (pt)', value: 'pt' },
        { label: 'zz', value: 'zz' },
      ],
    });
  });

  it('should hide the legacy iw/jw aliases Google lists next to he/jv', async () => {
    languages.mockResolvedValue([
      { language: 'iw', name: 'Hebrew' },
      { language: 'jw', name: 'Javanese' },
      { language: 'he', name: 'Hebrew' },
      { language: 'jv', name: 'Javanese' },
      { language: 'zh', name: 'Chinese (Simplified)' },
      { language: 'zh-CN', name: 'Chinese (Simplified)' },
    ]);

    const state = await languageOptions({ access_token: 'tok' });

    const values = state.options.map((o) => o.value);
    expect(values).toHaveLength(4);
    expect(values).toEqual(expect.arrayContaining(['zh', 'zh-CN', 'he', 'jv']));
    expect(values).not.toContain('iw');
    expect(values).not.toContain('jw');
  });

  it('should degrade to a disabled dropdown when the request fails', async () => {
    languages.mockRejectedValue(new Error('boom'));

    const state = await languageOptions({ access_token: 'tok' });

    expect(state).toEqual({
      disabled: true,
      options: [],
      placeholder: 'An error occurred while fetching the supported languages.',
    });
  });
});
