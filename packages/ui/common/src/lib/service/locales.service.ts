import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
const localesMap = environment.localesMap;
export type LocaleKey = keyof typeof localesMap;
@Injectable({ providedIn: 'root' })
export class LocalesService {
  readonly currentLanguageKeyInLocalStorage = 'currentLanguage';
  setCurrentLanguage(language: LocaleKey) {
    localStorage.setItem(this.currentLanguageKeyInLocalStorage, language);
  }
  getCurrentLanguage(): { locale: LocaleKey; languageName: string } {
    const href = window.location.href;
    const locale = href.split(window.location.origin + '/')[1]?.split('/')[0];
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

  private localeGuard(locale: string): locale is LocaleKey {
    return locale in localesMap;
  }
}
