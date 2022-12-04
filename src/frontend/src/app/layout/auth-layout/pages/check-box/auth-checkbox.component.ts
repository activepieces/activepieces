import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthenticationService } from 'src/app/layout/common-layout/service/authentication.service';

@Component({
	selector: 'app-auth-checkbox',
	templateUrl: './auth-checkbox.component.html',
	styleUrls: ['./auth-checkbox.component.scss'],
})
export class AuthCheckboxComponent {
	@Input() email: string;
	@Input() loading: boolean = false;
	@Input() linkName;
	@Output() emailResetPressed: EventEmitter<any> = new EventEmitter<any>();

	constructor(public authenticationService: AuthenticationService) {}
}
