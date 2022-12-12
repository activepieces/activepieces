import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { OAuth2ConfigSettings } from '../../../model/fields/variable/config-settings';
import { Oauth2Service } from '../../../service/oauth2.service';

@Component({
	selector: 'app-o-auth2-connect-control',
	templateUrl: './o-auth2-connect-control.component.html',
	styleUrls: ['./o-auth2-connect-control.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: OAuth2ConnectControlComponent,
		},
	],
})
export class OAuth2ConnectControlComponent implements ControlValueAccessor, OnChanges {
	@Input() configSettings: OAuth2ConfigSettings;
	responseData: any = null;
	isDisabled = false;
	emptySettings = false;
	popupOpened$: Observable<any>;
	onChange = (newValue: any) => {};
	onTouched = () => {};
	constructor(private oauth2Service: Oauth2Service) {}
	ngOnChanges(changes: SimpleChanges): void {
		const settings = this.configSettings;
		this.emptySettings = !(
			settings.client_secret &&
			settings.client_id &&
			settings.auth_url &&
			settings.response_type &&
			settings.scope
		);
	}
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
	popUpError = false;

	openPopup(): void {
		const configSettings = this.configSettings;

		this.popupOpened$ = this.oauth2Service.openPopup(configSettings).pipe(
			tap(value => {
				this.responseData = value;
				this.onChange(value);
			}),
			catchError(err => {
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
