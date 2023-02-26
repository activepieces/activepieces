import { AppConnectionType } from '@activepieces/shared';
import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { fadeInUp400ms } from '../../../animation/fade-in-up.animation';
import { Oauth2Service } from '../../../service/oauth2.service';

export interface CloudConnectionPopupSettings {
  clientId: string;
  auth_url: string;
  extraParams: Record<string, unknown>;
  scope: string;
  pieceName: string;
  token_url?: string;
}

@Component({
  selector: 'app-o-auth2-cloud-connect-control',
  templateUrl: './o-auth2-cloud-connect-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: OAuth2CloudConnectControlComponent,
    },
  ],
  animations: [fadeInUp400ms],
})
export class OAuth2CloudConnectControlComponent
  implements ControlValueAccessor
{
  @Input() cloudConnectionPopupSettings: CloudConnectionPopupSettings;
  popUpError = false;

  responseData: any = null;
  isDisabled = false;
  popupOpened$: Observable<any>;
  onChange = (newValue: any) => {};
  onTouched = () => {};
  constructor(private oauth2Service: Oauth2Service) {}

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  writeValue(obj: any): void {
    this.responseData = obj;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  openPopup(): void {
    this.popupOpened$ = this.oauth2Service
      .openCloudAuthPopup(this.cloudConnectionPopupSettings)
      .pipe(
        tap((value) => {
          this.popUpError = false;
          this.responseData = value;
          this.onChange({ ...value, type: AppConnectionType.CLOUD_OAUTH2 });
        }),
        catchError((err) => {
          this.responseData = null;
          this.onChange(null);
          this.popUpError = true;
          return throwError(() => {
            return err;
          });
        })
      );
  }
  clearControlValue() {
    this.responseData = null;
    this.onChange(null);
  }
}
