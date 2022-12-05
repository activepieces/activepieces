import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DataRow } from './data-row';
import { DataHeader } from './data-header';
import { Router } from '@angular/router';

@Component({
	selector: 'app-responsive-table',
	templateUrl: './responsive-table.component.html',
	styleUrls: ['./responsive-table.component.css'],
})
export class ResponsiveTableComponent {
	_data: DataRow[];

	get data(): DataRow[] {
		return this._data;
	}

	@Input() set data(value: DataRow[]) {
		this._data = value;
	}

	@Input() headers: DataHeader[];
	@Output() actions: EventEmitter<{ action: string; index: number }> = new EventEmitter<{
		action: string;
		index: number;
	}>();

	hoverIndex: number;

	constructor(private router: Router) {}

	alignClass(align: string | undefined) {
		if (align === 'center') {
			return 'text-center';
		}
		if (align === 'right') {
			return 'text-right';
		}
		return '';
	}

	createStyle(header: DataHeader) {
		return {
			width: header.width,
		};
	}

	emitAction(actionToReturn: string | undefined, index: number) {
		if (actionToReturn) {
			this.actions.emit({ action: actionToReturn, index: index });
		}
	}

	openRoute(route: { route: string; extra: any } | undefined) {
		if (route) {
			this.router.navigate([route.route], route.extra);
		}
	}

	dataStyle(column: any) {
		return {
			cursor: column.route ? 'pointer' : '',
		};
	}

	dataClassList(column: any, index: number) {
		const classList: string[] = [];
		if (column.align) {
			classList.push(this.alignClass(column.align));
		}
		if (column.route && this.hoverIndex === index) {
			classList.push('hyper-number');
		}
		return classList.join(' ');
	}
}
