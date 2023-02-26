import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public DANGER_COLOR = '#DC3545';
  public BODY_COLOR = '#4F4F4F';
  public RESET_COLOR = '#C8C8C8';
  public PRIMARY_COLOR = '#6E41E2';
  public BORDER_COLOR = '#C2C9D1';
  public DIVIDERS_COLOR = '#E0E4E8';
  public GRAYCARD_COLOR = '#FAFAFA';
  public SIDEBAR_COLOR = '#FAFBFC';
  public ICON_COLOR = '#555555';
  public WARNING_COLOR = '#fb6340';
  public SUCCESS_COLOR = '#209e34';

  BODY_COLOR_SVG_STYLE() {
    return { fill: this.BODY_COLOR };
  }
  public DELAY_LOADING_DURATION = 500;

  constructor() {}
}
