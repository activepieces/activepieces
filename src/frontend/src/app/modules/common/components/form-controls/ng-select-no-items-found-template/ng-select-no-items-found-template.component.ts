import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
	selector: 'app-ng-select-no-items-found-template',
	templateUrl: './ng-select-no-items-found-template.component.html',
	styleUrls: ['./ng-select-no-items-found-template.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgSelectNoItemsFoundTemplateComponent {
	@Input() searchTerm: string;
	constructor() {}
}
