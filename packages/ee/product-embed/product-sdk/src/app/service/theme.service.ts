import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  PRIMARY_COLOR: string | undefined;

  public setTheme(primaryColor: string) {
    this.PRIMARY_COLOR = primaryColor;
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty(
      '--primary-color-hover',
      this.newShade(primaryColor, -15)
    );
    document.documentElement.style.setProperty(
      '--primary-color-disabled',
      this.newShade(primaryColor, 30)
    );
  }

  private newShade(hexColor: string, magnitude: number) {
    let R = parseInt(hexColor.substring(1, 3), 16);
    let G = parseInt(hexColor.substring(3, 5), 16);
    let B = parseInt(hexColor.substring(5, 7), 16);

    R = parseInt(String((R * (100 + magnitude)) / 100));
    G = parseInt(String((G * (100 + magnitude)) / 100));
    B = parseInt(String((B * (100 + magnitude)) / 100));

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    const RR =
      R.toString(16).length == 1 ? '0' + R.toString(16) : R.toString(16);
    const GG =
      G.toString(16).length == 1 ? '0' + G.toString(16) : G.toString(16);
    const BB =
      B.toString(16).length == 1 ? '0' + B.toString(16) : B.toString(16);

    return '#' + RR + GG + BB;
  }
}
