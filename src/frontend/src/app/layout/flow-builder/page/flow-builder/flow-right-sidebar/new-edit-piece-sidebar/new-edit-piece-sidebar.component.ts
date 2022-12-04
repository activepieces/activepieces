import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, switchMap, tap } from 'rxjs';
import { FlowItemDetails } from '../step-type-sidebar/step-type-item/flow-item-details';
import { Store } from '@ngrx/store';
import { RightSideBarType } from '../../../../../common-layout/model/enum/right-side-bar-type.enum';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { FlowsActions } from '../../../../store/action/flows.action';
import { UUID } from 'angular2-uuid';
import { FlowItem } from 'src/app/layout/common-layout/model/flow-builder/flow-item';
import { StepCacheKey } from 'src/app/layout/flow-builder/service/artifact-cache-key';
import { CodeAction } from 'src/app/layout/common-layout/model/flow-builder/actions/code-action.interface';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { RemoteFlowCacheService } from 'src/app/layout/flow-builder/service/remote-flow-cache.service';
import { ConfigSource } from 'src/app/layout/common-layout/model/enum/config-source';

@Component({
	selector: 'app-new-edit-piece-sidebar',
	templateUrl: './new-edit-piece-sidebar.component.html',
	styleUrls: ['./new-edit-piece-sidebar.component.css'],
})
export class NewEditPieceSidebarComponent implements OnInit {
	constructor(private store: Store, private remoteFlowCache: RemoteFlowCacheService, private cd: ChangeDetectorRef) {}
	displayNameChanged$: BehaviorSubject<string> = new BehaviorSubject('Step');
	selectedStepAndFlowId$: Observable<{ step: FlowItem | null | undefined; flowId: UUID | null }>;
	selectedFlowItemDetails$: Observable<FlowItemDetails | undefined>;
	stepCacheKeyAndArtifactUrl: { cacheKey: StepCacheKey; url: string } | null;

	flowId$: Observable<null | UUID>;
	ngOnInit(): void {
		//in case you switch piece while the edit piece panel is opened
		this.selectedStepAndFlowId$ = combineLatest({
			step: this.store.select(BuilderSelectors.selectCurrentStep),
			flowId: this.store.select(BuilderSelectors.selectCurrentFlowId),
		}).pipe(
			distinctUntilChanged((prev, current) => {
				return prev.flowId === current.flowId && prev.step?.name === current.step?.name;
			}),
			tap(result => {
				if (result.step) {
					this.displayNameChanged$.next(result.step.displayName);
					this.selectedFlowItemDetails$ = this.store.select(BuilderSelectors.selectFlowItemDetails(result.step)).pipe(
						switchMap(flowItemDetails => {
							if (flowItemDetails && flowItemDetails.type === ActionType.REMOTE_FLOW) {
								return this.remoteFlowCache
									.getCollectionFlowsVersions(
										flowItemDetails.extra!.pieceVersionId,
										flowItemDetails.extra!.flowsVersionIds
									)
									.pipe(
										map(flowsVersions => {
											const flowVersiondIdToConfig = flowsVersions.map(flowVer => {
												return {
													id: flowVer.id,
													configs: flowVer.configs.filter(c => c.source !== ConfigSource.PREDEFINED),
													displayName: flowVer.displayName,
												};
											});
											const clonedFlowItemDetails: FlowItemDetails = JSON.parse(JSON.stringify(flowItemDetails));
											clonedFlowItemDetails.extra!.flowVersionIdToConfig = flowVersiondIdToConfig;
											return clonedFlowItemDetails;
										})
									);
							}
							return of(flowItemDetails);
						})
					);
					this.cd.detectChanges();
					if (result.step.type === ActionType.CODE) {
						this.stepCacheKeyAndArtifactUrl = {
							cacheKey: new StepCacheKey(result.flowId!, result.step.name),
							url: (result.step as CodeAction).settings.artifactUrl,
						};
					} else {
						this.stepCacheKeyAndArtifactUrl = null;
					}
				} else {
					this.selectedFlowItemDetails$ = of(undefined);
				}
			})
		);
	}

	closeSidebar() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.NONE,
				props: {},
			})
		);
	}
	get ActionType() {
		return ActionType;
	}
}
