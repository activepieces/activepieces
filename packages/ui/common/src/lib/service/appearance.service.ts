import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { forkJoin, tap } from 'rxjs';
import { FlagService } from './flag.service';

@Injectable({
  providedIn: 'root',
})
export class AppearanceService {
  favIcon: HTMLLinkElement | null = document.querySelector('#favIcon');

  constructor(private flagService: FlagService, private titleService: Title) {}

  setTitle(title: string) {
    return this.flagService.getWebsiteName().pipe(
      tap((name) => {
        this.titleService.setTitle(`${title} - ${name}`);
      })
    );
  }

  setTheme() {
    const favIcon$ = this.flagService.getLogos().pipe(
      tap((logo) => {
        if (!this.favIcon) {
          return;
        }
        this.favIcon.href = logo.favIconUrl;
      })
    );
    const colors$ = this.flagService.getColors().pipe(
      tap((colors) => {
        this.setColorsVariables(colors, '');
      })
    );
    const primaryPalette$ = this.flagService.getPrimaryPalette().pipe(
      tap((palette) => {
        this.setColorsVariables(palette, 'primary-palette-');
      })
    );
    const warnPalette$ = this.flagService.getWarnPalette().pipe(
      tap((palette) => {
        this.setColorsVariables(palette, 'warn-palette-');
      })
    );
    return forkJoin([colors$, primaryPalette$, warnPalette$, favIcon$]);
  }

  private setColorsVariables(
    colors: Record<string, string | object>,
    paletteName: '' | 'primary-palette-' | 'warn-palette-'
  ) {
    Object.entries(colors).forEach(([colorName, value]) => {
      if (typeof value == 'string') {
        document.documentElement.style.setProperty(
          `--${paletteName}${colorName}`,
          value
        );
      }

      if (typeof value === 'object') {
        Object.entries(value).forEach(([shade, shadeValue]) => {
          document.documentElement.style.setProperty(
            `--${paletteName}${colorName}-${shade}`,
            shadeValue
          );
          if (`--${paletteName}${colorName}-${shade}` === '--primary-default') {
            document.documentElement.style.setProperty(
              `--primary-default-rgb`,
              this.hex2rgb(shadeValue)
            );
          }
        });
      }
    });
  }
  private hex2rgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `${r}, ${g}, ${b}`;
  }
}
