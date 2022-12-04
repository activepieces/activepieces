import { AfterViewInit, Component, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HighlightService } from '../../service/highlightservice';

@Component({
	selector: 'app-json-view-modal',
	templateUrl: './json-view-modal.component.html',
	styleUrls: ['./json-view-modal.component.scss'],
})
export class JsonViewModalComponent implements AfterViewInit {
	highlight = false;

	_json: any;

	@Input() title: string;

	get json(): boolean {
		return this._json;
	}
	@Input() set json(value: boolean) {
		this.highlight = false;
		this._json = value;
		setTimeout(() => {
			this.highlightService.highlightAll();
		}, 10);
	}

	constructor(public bsModalRef: BsModalRef, private highlightService: HighlightService) {}

	ngAfterViewInit(): void {
		if (!this.highlight) {
			this.highlight = true;
			this.highlightService.highlightAll();
		}
	}
}
