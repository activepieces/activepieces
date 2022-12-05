import { Component, Input } from '@angular/core';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';

@Component({
	selector: 'app-input',
	templateUrl: './ap-input.component.html',
	styleUrls: ['./ap-input.component.scss'],
	animations: [fadeInUp400ms],
})
export class ApInputComponent {
	@Input() showErrors: boolean;
	@Input() inputControl: any;
	@Input() label: string | undefined;
	@Input() hintText: string = '';
	@Input() required: boolean;
	@Input() inputType: string;

	constructor() {}
}
