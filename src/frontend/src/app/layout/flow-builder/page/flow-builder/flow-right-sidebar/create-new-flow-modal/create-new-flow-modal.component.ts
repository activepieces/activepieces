import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { map, Observable, tap } from 'rxjs';
import { FlowTemplateInterface } from '../../../../model/flow-template.interface';
import { FlowTemplateService } from '../../../../service/flow-template.service';

@Component({
	selector: 'app-create-new-flow-modal',
	templateUrl: './create-new-flow-modal.component.html',
	styleUrls: ['./create-new-flow-modal.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateNewFlowModalComponent implements OnInit {
	@Output() selectedTemplate = new EventEmitter<FlowTemplateInterface | undefined>();

	onHideModal$: Observable<void> = new Observable<void>();

	constructor(public bsModalRef: BsModalRef, public flowTemplateService: FlowTemplateService) {}

	ngOnInit(): void {
		this.bsModalRef.onHide.pipe(
			tap(value => {
				this.selectedTemplate.emit(undefined);
			}),
			map(hide => {
				return void 0;
			})
		);
	}

	emitTemplate(template: FlowTemplateInterface) {
		this.selectedTemplate.emit(template);
		this.bsModalRef.hide();
	}
}
