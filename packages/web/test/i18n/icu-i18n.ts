import i18n from 'i18next';
import ICU from 'i18next-icu';

async function init(): Promise<void> {
  await i18n.use(ICU).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {},
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
  });
}

export const icuI18n = { init };
