import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ConfirmDeleteModalComponent } from '../../../../../common/components/confirm-delete-modal/confirm-delete-modal.component';
import { Flow } from '../../../../../common/model/flow.class';
import { Store } from '@ngrx/store';
import { FlowsActions } from '../../../../store/action/flows.action';
import { take } from 'rxjs';
import { UUID } from 'angular2-uuid';
import {
	ChevronDropdownOption,
	ChevronDropdownOptionType,
} from '../../../../components/chevron-dropdown-menu/chevron-dropdown-option';

@Component({
	selector: 'app-flow-builder-tab',
	templateUrl: './flow-builder-tab.component.html',
	styleUrls: ['./flow-builder-tab.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowBuilderTabComponent {
	flowActions: ChevronDropdownOption[];
	_flow: Flow;

	@Input() set flow(_flow: Flow) {
		this._flow = _flow;
		this.flowActions = [
			{
				id: 'RENAME',
				name: 'Rename',
				type: ChevronDropdownOptionType.NORMAL,
				cssClasses: '',
			},
			{
				id: 'DELETE',
				name: 'Delete',
				type: ChevronDropdownOptionType.NORMAL,
				cssClasses: 'text-danger',
			},
			{
				id: 'SEP_1',
				type: ChevronDropdownOptionType.SEPARATOR,
				cssClasses: '',
			},
			{
				id: 'ID',
				name: _flow.id.toString(),
				type: ChevronDropdownOptionType.COPY_ID,
				cssClasses: '',
			},
		];
	}

	get flow(): Flow {
		return this._flow;
	}

	@Input() tabSelected: boolean;
	@Input() parentToflowPopUp: HTMLElement;
	@Input() readonlyMode: boolean;
	@Output() switchToFlow: EventEmitter<boolean> = new EventEmitter();
	dropDownOpened = false;

	editing = false;
	hovered = false;
	bsModalRef: BsModalRef;

	constructor(private store: Store, private modalService: BsModalService) {}

	actionHandler(actionId: string) {
		if (actionId === 'RENAME') {
			this.editing = true;
		} else if (actionId === 'DELETE') {
			this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent, {
				initialState: {
					entityName: this.flow.last_version.display_name,
				},
			});
			this.bsModalRef.content.confirmState.pipe(take(1)).subscribe((confirm: boolean) => {
				if (confirm) {
					const flowId: UUID = this.flow.id;
					this.store.dispatch(FlowsActions.deleteFlow({ flowId: flowId }));
				}
			});
		}
	}

	saveNewName(newName: string) {
		if (this.flow.last_version.display_name == newName) {
			this.revertNewName();
		} else {
			this.dispatchNewName(newName);
		}
	}

	private dispatchNewName(newName: string) {
		this.store.dispatch(
			FlowsActions.changeName({
				flowId: this.flow.id,
				displayName: newName,
			})
		);
	}

	private revertNewName() {
		this.store.dispatch(
			FlowsActions.changeName({
				flowId: this.flow.id,
				displayName: this.flow.last_version.display_name,
			})
		);
	}

	handleHovering(isOnContainer: boolean) {
		this.hovered = isOnContainer;
	}

	containerClicked() {
		setTimeout(() => {
			if (!this.dropDownOpened && !this.tabSelected) {
				this.switchToFlow.emit(true);
			}
		}, 10);
	}
}
