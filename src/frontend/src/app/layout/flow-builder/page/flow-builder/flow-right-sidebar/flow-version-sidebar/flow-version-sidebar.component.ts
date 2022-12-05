import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FlowService } from '../../../../../common-layout/service/flow.service';
import { FlowVersion } from '../../../../../common-layout/model/flow-version.class';
import { VersionEditState } from '../../../../../common-layout/model/enum/version-edit-state.enum';
import { TimeHelperService } from '../../../../../common-layout/service/time-helper.service';
import { RightSideBarType } from '../../../../../common-layout/model/enum/right-side-bar-type.enum';
import { map, Observable, switchMap } from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { FlowsActions } from '../../../../store/action/flows.action';

@Component({
	selector: 'app-flow-version-sidebar',
	templateUrl: './flow-version-sidebar.component.html',
	styleUrls: ['./flow-version-sidebar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowVersionSidebarComponent implements OnInit {
	versions$: Observable<FlowVersion[]>;

	constructor(public timeHelperService: TimeHelperService, private flowService: FlowService, private store: Store) {}

	ngOnInit(): void {
		this.versions$ = this.store.select(BuilderSelectors.selectCurrentFlowId).pipe(
			switchMap(flowId => {
				return this.flowService.listVersionsByFlowId(flowId!).pipe(
					map(value => {
						const newValues = value.reverse();
						for (let i = 0; i < newValues.length; ++i) {
							newValues[i].versionNumber = newValues.length - i;
							newValues[i].epochCreationTimeFormatted = this.timeHelperService.formatDateTimeMills(
								newValues[i].created
							);
						}
						return newValues;
					})
				);
			})
		);
	}

	closeVersionSidebar() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.NONE,
				props: {},
			})
		);
	}

	get versionEditState() {
		return VersionEditState;
	}
}
