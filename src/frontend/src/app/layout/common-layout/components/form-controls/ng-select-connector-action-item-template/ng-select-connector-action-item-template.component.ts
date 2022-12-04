import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { RequestType } from './requestType.enum';

@Component({
	selector: 'app-ng-select-connector-action-item-template',
	templateUrl: './ng-select-connector-action-item-template.component.html',
	styleUrls: ['./ng-select-connector-action-item-template.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgSelectConnectorActionItemTemplateComponent implements OnInit {
	RequestType = RequestType;
	@Input() item: {
		label: { requestType: RequestType; url: string; summary: string; description: string };
		value: { actionName: UUID; configs: any[] };
		disabled: boolean; // disabled item is a separator
	} | null;
	@Input() hideDescription = false;
	tooltipText = '';
	constructor() {}
	ngOnInit(): void {
		if (this.item) {
			if (!this.item.disabled && !this.hideDescription) {
				this.tooltipText = `${this.item.label.summary ? this.item.label.summary : this.item.label.url}

        ${this.item.label.description}`;
			}
		}
	}
}
