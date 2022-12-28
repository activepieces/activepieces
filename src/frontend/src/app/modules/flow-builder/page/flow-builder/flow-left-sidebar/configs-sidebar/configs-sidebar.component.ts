import { Component } from '@angular/core';
import { LeftSideBarType } from 'src/app/modules/common/model/enum/left-side-bar-type.enum';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { FlowsActions } from '../../../../store/action/flows.action';
import { Config } from '../../../../../common/model/fields/variable/config';
import { MatDialog } from '@angular/material/dialog';
import { CreateEditConfigModalComponent } from '../create-or-edit-config-modal/create-or-edit-config-modal.component';
import { __values } from 'tslib';

@Component({
	selector: 'app-configs-sidebar',
	templateUrl: './configs-sidebar.component.html',
	styleUrls: ['./configs-sidebar.component.css'],
})
export class VariableSidebarComponent {
	viewMode$: Observable<boolean>;

	constructor(private store: Store, private dialogService: MatDialog) {
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
		this.dialogService.open(CreateEditConfigModalComponent, {
			data: $event ? { config: $event?.value, index: $event?.index } : undefined,
		});
	}
}
