import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { isNil, LocalesEnum } from '@activepieces/shared';
import { localesMap } from '../utils/locales';

@Injectable({ providedIn: 'root' })
export class LocalesService {
  constructor(private location: Location) {}
  readonly currentLanguageKeyInLocalStorage = 'currentLanguage';
  public readonly defaultLocale = LocalesEnum.ENGLISH;
  setCurrentLocale(locale: LocalesEnum) {
    localStorage.setItem(this.currentLanguageKeyInLocalStorage, locale);
  }
  getCurrentLocaleFromBrowserUrlOrDefault(): LocalesEnum {
    const href = window.location.href;
    const locale = href.split(window.location.origin + '/')[1]?.split('/')[0];
    return this.localeGuard(locale) ? locale : this.defaultLocale;
  }
  getCurrentLocaleFromLocalStorage(): LocalesEnum | undefined {
    const locale = localStorage.getItem(this.currentLanguageKeyInLocalStorage);
    return !isNil(locale) && this.localeGuard(locale) ? locale : undefined;
  }

  getCurrentLanguageFromLocalStorageOrDefault(): {
    locale: LocalesEnum;
    languageName: string;
  } {
    const locale =
      this.getCurrentLocaleFromLocalStorage() ?? this.defaultLocale;
    return {
      locale: locale,
      languageName: localesMap[locale],
    };
  }

  private localeGuard(locale: string): locale is LocalesEnum {
    return locale in localesMap;
  }

  redirectToLocale(locale: LocalesEnum) {
    const currentUrl =
      this.location.path().length === 0 ? '/' : this.location.path();

    if (locale === LocalesEnum.ENGLISH) {
      window.location.href = `${currentUrl}`;
    } else {
      window.location.href = `/${locale}${currentUrl}`;
    }
  }
}
