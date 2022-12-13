import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { HttpMethod } from '../../configs-form/configs-form-for-connectors/connector-action-or-config';

@Component({
	selector: 'app-request-type-template',
	templateUrl: './request-type-template.component.html',
	styleUrls: ['./request-type-template.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestTypeTemplateComponent {
	@Input() requestType: HttpMethod;
	@Input() transparentBackground = false;
	requestTypesAcronyms: Map<HttpMethod, string> = new Map();
	constructor() {
		this.requestTypesAcronyms.set(HttpMethod.GET, 'GET');
		this.requestTypesAcronyms.set(HttpMethod.PUT, 'PUT');
		this.requestTypesAcronyms.set(HttpMethod.POST, 'POST');
		this.requestTypesAcronyms.set(HttpMethod.HEAD, 'HEAD');
		this.requestTypesAcronyms.set(HttpMethod.OPTIONS, 'OPT');
		this.requestTypesAcronyms.set(HttpMethod.PATCH, 'PATCH');
		this.requestTypesAcronyms.set(HttpMethod.TRACE, 'TRACE');
		this.requestTypesAcronyms.set(HttpMethod.DELETE, 'DEL');
	}
}
