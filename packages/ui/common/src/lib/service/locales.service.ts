import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
const localesMap = environment.localesMap;
import { Location } from '@angular/common';
export type LocaleKey = keyof typeof localesMap;
@Injectable({ providedIn: 'root' })
export class LocalesService {
  constructor(private location: Location) {}
  readonly currentLanguageKeyInLocalStorage = 'currentLanguage';
  setCurrentLanguage(locale: LocaleKey) {
    localStorage.setItem(this.currentLanguageKeyInLocalStorage, locale);
  }
  getCurrentLocaleFromBrowserUrl(): string {
    const href = window.location.href;
    const locale = href.split(window.location.origin + '/')[1]?.split('/')[0];
    return locale;
  }
  getCurrentLanguageFromLocalStorage(): {
    locale: LocaleKey;
    languageName: string;
  } {
    const locale =
      localStorage.getItem(this.currentLanguageKeyInLocalStorage) || 'en';
    return this.localeGuard(locale)
      ? {
          locale: locale,
          languageName: localesMap[locale],
        }
      : {
          locale: 'en' as LocaleKey,
          languageName: localesMap['en'],
        };
  }

  localeGuard(locale: string): locale is LocaleKey {
    return locale in localesMap;
  }

  redirectToLocale(locale: LocaleKey) {
    const currentUrl = this.location.path();
    const newUrl = `/${locale}${currentUrl}`;
    window.location.href = newUrl;
  }
}
