import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { tableColumnNameAndProperty } from './columnNameAndProperty';

@Component({
	selector: 'app-table',
	templateUrl: './table.component.html',
	styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit {
	@Input() values: any[] | null;
	@Input() columnNamesAndProperties: tableColumnNameAndProperty[];
	@Input() actionButtonTemplate: TemplateRef<any>;
	gridStyle: any = {};
	constructor() {}

	ngOnInit(): void {
		if (!this.actionButtonTemplate) {
			this.gridStyle['grid-template-columns'] = `repeat(${this.columnNamesAndProperties.length - 1}, 11.25rem) auto`;
		} else {
			this.gridStyle['grid-template-columns'] = `repeat(${
				this.columnNamesAndProperties.length - 1
			}, 11.25rem) auto 7.5625rem`;
		}
	}
}
