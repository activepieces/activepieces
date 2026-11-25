import i18next from 'i18next';
import ICU from 'i18next-icu';
import { describe, expect, it } from 'vitest';

import translation from '../../../public/locales/en/translation.json';

const HINT =
  'Each new teammate who joins earns you {credits} credits ({left, plural, =1 {1 reward left} other {# rewards left}}).';

describe('invite reward hint copy', () => {
  it('uses the singular for one reward left and the plural otherwise', async () => {
    const i18n = i18next.createInstance().use(ICU);
    await i18n.init({ lng: 'en', resources: { en: { translation } } });

    expect(i18n.t(HINT, { credits: '1,000', left: 1 })).toBe(
      'Each new teammate who joins earns you 1,000 credits (1 reward left).',
    );
    expect(i18n.t(HINT, { credits: '1,000', left: 3 })).toBe(
      'Each new teammate who joins earns you 1,000 credits (3 rewards left).',
    );
  });
});
