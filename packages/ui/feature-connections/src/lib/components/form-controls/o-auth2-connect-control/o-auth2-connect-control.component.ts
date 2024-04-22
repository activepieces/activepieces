import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { fadeInUp400ms } from '@activepieces/ui/common';
import {
  OAuth2PopupParams,
  OAuth2PopupResponse,
} from '../../../models/oauth2-popup-params.interface';
import { Oauth2Service } from '../../../services/oauth2.service';

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
  @Input() popupParams: OAuth2PopupParams;
  @Input() settingsValid: boolean;
  responseData: OAuth2PopupResponse = {
    code: '',
  };
  popUpError = false;
  isDisabled = false;
  popupOpened$: Observable<any>;
  onChange: (val: unknown) => void = (newValue) => {
    newValue;
  };
  onTouched: () => void = () => {
    //ignored
  };
  constructor(private oauth2Service: Oauth2Service) {}

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  writeValue(obj: OAuth2PopupResponse | null): void {
    if (obj) {
      this.responseData = obj;
    }
  }

  registerOnChange(fn: (val: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  openPopup(): void {
    this.popupOpened$ = this.oauth2Service.openPopup(this.popupParams).pipe(
      tap((value) => {
        this.popUpError = false;
        this.responseData = value;
        this.onChange(value);
      }),
      catchError((err) => {
        this.responseData = {
          code: '',
        };
        this.onChange(null);
        this.popUpError = true;
        return throwError(() => {
          return err;
        });
      })
    );
  }
  clearControlValue() {
    this.responseData = {
      code: '',
    };
    this.onChange(null);
  }
}
