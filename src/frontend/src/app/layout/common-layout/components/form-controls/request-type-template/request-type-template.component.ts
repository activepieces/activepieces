import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { RequestType } from '../ng-select-connector-action-item-template/requestType.enum';

@Component({
	selector: 'app-request-type-template',
	templateUrl: './request-type-template.component.html',
	styleUrls: ['./request-type-template.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestTypeTemplateComponent {
	@Input() requestType: RequestType;
	@Input() transparentBackground = false;
	requestTypesAcronyms: Map<RequestType, string> = new Map();
	constructor() {
		this.requestTypesAcronyms.set(RequestType.GET, 'GET');
		this.requestTypesAcronyms.set(RequestType.PUT, 'PUT');
		this.requestTypesAcronyms.set(RequestType.POST, 'POST');
		this.requestTypesAcronyms.set(RequestType.HEAD, 'HEAD');
		this.requestTypesAcronyms.set(RequestType.OPTIONS, 'OPT');
		this.requestTypesAcronyms.set(RequestType.PATCH, 'PATCH');
		this.requestTypesAcronyms.set(RequestType.TRACE, 'TRACE');
		this.requestTypesAcronyms.set(RequestType.DELETE, 'DEL');
	}
}
