import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { HttpMethod } from '../../configs-form/connector-action-or-config';

@Component({
	selector: 'app-ng-select-connector-action-item-template',
	templateUrl: './ng-select-connector-action-item-template.component.html',
	styleUrls: ['./ng-select-connector-action-item-template.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgSelectConnectorActionItemTemplateComponent implements OnInit {
	RequestType = HttpMethod;
	@Input() item: {
		label: { name: string; description: string };
		value: { actionName: UUID; configs: any[] };
		disabled: boolean; // disabled item is a separator
	} | null;
	@Input() hideDescription = false;
	tooltipText = '';
	constructor() {}
	ngOnInit(): void {
		if (this.item) {
			if (!this.item.disabled && !this.hideDescription) {
				this.tooltipText = `${this.item.label.description}`;
			}
		}
	}
}
