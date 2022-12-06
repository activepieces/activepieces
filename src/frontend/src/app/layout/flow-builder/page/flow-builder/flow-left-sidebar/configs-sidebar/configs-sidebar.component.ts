import { Component } from '@angular/core';
import { LeftSideBarType } from 'src/app/layout/common-layout/model/enum/left-side-bar-type.enum';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { FlowsActions } from '../../../../store/action/flows.action';
import { Config } from '../../../../../common-layout/model/fields/variable/config';
import { CreateEditConfigModalComponent } from '../create-or-edit-config-modal/create-or-edit-config-modal.component';

@Component({
	selector: 'app-configs-sidebar',
	templateUrl: './configs-sidebar.component.html',
	styleUrls: ['./configs-sidebar.component.css'],
})
export class VariableSidebarComponent {
	viewMode$: Observable<boolean>;
	createEditConfigModalRef: BsModalRef;

	constructor(private modalService: BsModalService, private store: Store) {
		this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
	}

	closeSidebar() {
		this.store.dispatch(
			FlowsActions.setLeftSidebar({
				sidebarType: LeftSideBarType.NONE,
			})
		);
	}

	openConfigVariableModal($event: { value: Config; index: number } | undefined) {
		this.createEditConfigModalRef = this.modalService.show(CreateEditConfigModalComponent, {
			ignoreBackdropClick: true,
			class: 'modal-dialog-centered',
			initialState: {
				configIndexInConfigsList: $event == undefined ? undefined : $event.index,
				configToUpdate: $event == undefined ? undefined : $event.value,
			},
		});
	}
}
