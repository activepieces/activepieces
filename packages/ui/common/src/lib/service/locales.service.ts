import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
const localesMap = environment.localesMap;
import { Location } from '@angular/common';
import { isNil } from '@activepieces/shared';
export type LocaleKey = keyof typeof localesMap;
@Injectable({ providedIn: 'root' })
export class LocalesService {
  constructor(private location: Location) {}
  readonly currentLanguageKeyInLocalStorage = 'currentLanguage';
  private readonly defaultLocale = 'en';
  setCurrentLocale(locale: LocaleKey) {
    localStorage.setItem(this.currentLanguageKeyInLocalStorage, locale);
  }
  getCurrentLocaleFromBrowserUrl(): LocaleKey {
    const href = window.location.href;
    const locale = href.split(window.location.origin + '/')[1]?.split('/')[0];
    return this.localeGuard(locale) ? locale : this.defaultLocale;
  }
  private getCurrentLocaleFromLocalStorage(): LocaleKey | undefined {
    const locale = localStorage.getItem(this.currentLanguageKeyInLocalStorage);
    return !isNil(locale) && this.localeGuard(locale) ? locale : undefined;
  }

  getCurrentLanguageFromLocalStorageOrDefault(): {
    locale: LocaleKey;
    languageName: string;
  } {
    const locale =
      this.getCurrentLocaleFromLocalStorage() ?? this.defaultLocale;
    return {
      locale: locale,
      languageName: localesMap[locale],
    };
  }

  private localeGuard(locale: string): locale is LocaleKey {
    return locale in localesMap;
  }

  redirectToLocale(locale: LocaleKey) {
    const currentUrl =
      this.location.path().length === 0 ? '/' : this.location.path();

    if (locale === 'en') {
      window.location.href = `${currentUrl}`;
    } else {
      window.location.href = `/${locale}${currentUrl}`;
    }
  }
}
