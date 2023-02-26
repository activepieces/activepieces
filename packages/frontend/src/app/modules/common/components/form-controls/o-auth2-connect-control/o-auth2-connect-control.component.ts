import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AppConnectionType, OAuth2AppDetails } from '@activepieces/shared';
import { fadeInUp400ms } from '../../../animation/fade-in-up.animation';
import { Oauth2Service } from '../../../service/oauth2.service';

@Component({
  selector: 'app-o-auth2-connect-control',
  templateUrl: './o-auth2-connect-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: OAuth2ConnectControlComponent,
    },
  ],
  animations: [fadeInUp400ms],
})
export class OAuth2ConnectControlComponent implements ControlValueAccessor {
  @Input() configSettings: OAuth2AppDetails;
  @Input() settingsValid: boolean;
  responseData: any = null;
  popUpError = false;
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
    const configSettings = this.configSettings as OAuth2AppDetails & {
      extraParams: Record<string, unknown>;
      auth_url: string;
      scope: string;
    };
    this.popupOpened$ = this.oauth2Service.openPopup(configSettings).pipe(
      tap((value) => {
        this.popUpError = false;
        this.responseData = value;
        this.onChange({ ...value, type: AppConnectionType.OAUTH2 });
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
