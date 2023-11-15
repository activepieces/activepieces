import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
const localesNames = environment.localesNames;
type LocaleKey = keyof typeof localesNames;
@Injectable({ providedIn: 'root' })
export class HighlightService {
  readonly currentLanguageKeyInLocalStorage = 'currentLanguage';
  setCurrentLanguage(language: LocaleKey) {
    localStorage.setItem(this.currentLanguageKeyInLocalStorage, language);
    window.location.href;
  }
  getCurrentLanguage(): { locale: LocaleKey; languageName: string } {
    const locale = localStorage.getItem(
      this.currentLanguageKeyInLocalStorage
    ) as LocaleKey | null;
    return locale
      ? {
          locale: locale,
          languageName: localesNames[locale],
        }
      : {
          locale: 'en' as LocaleKey,
          languageName: localesNames['en'],
        };
  }
}
