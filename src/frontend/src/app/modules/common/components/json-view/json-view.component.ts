import { AfterViewInit, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HighlightService } from '../../service/highlight.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { JsonViewModalComponent } from '../json-view-modal/json-view-modal.component';

@Component({
	selector: 'app-json-viewer',
	templateUrl: './json-view.component.html',
	styleUrls: ['./json-view.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewComponent implements AfterViewInit {
	highlight = false;

	@Input() title: string;
	@Input() maxHeight: number | undefined = undefined;

	_content: any;
	@Input() set content(value: any) {
		this.highlight = false;
		this._content = value;
		setTimeout(() => {
			this.highlightService.highlightAll();
		}, 10);
	}

	private bsModalRef: BsModalRef;

	constructor(private modalService: BsModalService, private highlightService: HighlightService) {}

	ngAfterViewInit(): void {
		if (!this.highlight) {
			this.highlight = true;
			this.highlightService.highlightAll();
		}
	}

	openModal() {
		this.bsModalRef = this.modalService.show(JsonViewModalComponent, { class: 'modal-xl' });
		this.bsModalRef.content.json = this._content;
		this.bsModalRef.content.title = this.title;
	}
}
