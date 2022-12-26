import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CollectionBuilderService } from '../../service/collection-builder.service';
import { InstanceRunStatus } from '../../../common/model/enum/instance-run-status';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { RightSideBarType } from '../../../common/model/enum/right-side-bar-type.enum';
import { LeftSideBarType } from 'src/app/modules/common/model/enum/left-side-bar-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../store/selector/flow-builder.selector';
import { map, Observable, tap } from 'rxjs';
import { ViewModeEnum } from '../../store/model/enums/view-mode.enum';
import { MatDrawerContainer } from '@angular/material/sidenav';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestRunBarComponent } from './test-run-bar/test-run-bar.component';
import { BuilderActions } from '../../store/action/builder.action';
import { FlowItemDetailsActions } from '../../store/action/flow-items-details.action';
import { InstanceRun } from '../../../common/model/instance-run.interface';
import { Flow } from '../../../common/model/flow.class';
import { RunDetailsService } from './flow-left-sidebar/run-details/iteration-details.service';
import { FlowsActions } from '../../store/action/flows.action';
import { Collection } from 'src/app/modules/common/model/collection.interface';
import { InstanceRunInfo } from '../../resolvers/instance-run.resolver';
import { Instance } from 'src/app/modules/common/model/instance.interface';

@Component({
	templateUrl: './collection-builder.component.html',
	styleUrls: ['./collection-builder.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class CollectionBuilderComponent implements OnInit, OnDestroy {
	@ViewChild('canvasWrapper') canvasWrapper: ElementRef;
	@ViewChild('rightSideDrawer', { read: ElementRef }) rightSideBar: ElementRef;
	@ViewChild('leftSideDrawer', { read: ElementRef }) leftSideBar: ElementRef;
	bsModalRef: BsModalRef;
	rightSidebarWidth = '0';
	leftSideBarWidth = '0';
	leftSidebar$: Observable<LeftSideBarType>;
	rightSidebar$: Observable<RightSideBarType>;
	rightDrawerRect: DOMRect;
	leftDrawerRect: DOMRect;
	rightSidebarDragging: boolean = false;
	leftSidebarDragging: boolean = false;
	loadInitialData$: Observable<void> = new Observable<void>();
	newCollectionCheck$: Observable<Params>;
	constructor(
		private store: Store,
		public pieceBuilderService: CollectionBuilderService,
		private actRoute: ActivatedRoute,
		private ngZone: NgZone,
		private snackbar: MatSnackBar,
		private runDetailsService: RunDetailsService,
		private route: ActivatedRoute
	) {
		this.loadInitialData$ = this.actRoute.data.pipe(
			tap(value => {
				const runInformation: InstanceRunInfo = value['runInformation'];
				if (runInformation !== undefined) {
					const collection = runInformation.collection;
					const flow: Flow = runInformation.flow;
					const run: InstanceRun = runInformation.run;

					this.store.dispatch(
						BuilderActions.loadInitial({
							collection: collection,
							flows: [flow],
							viewMode: ViewModeEnum.VIEW_INSTANCE_RUN,
							run: run,
						})
					);

					this.snackbar.openFromComponent(TestRunBarComponent, {
						duration: undefined,
					});
				} else {
					const collection: Collection = value['collection'];
					const flows = value['flows'];
					const instance: Instance | undefined = value['instance'];
					this.store.dispatch(
						BuilderActions.loadInitial({
							collection: collection,
							flows: flows.data,
							viewMode: ViewModeEnum.BUILDING,
							run: undefined,
							instance: instance,
						})
					);
				}
			}),
			map(value => void 0)
		);

		this.leftSidebar$ = this.store.select(BuilderSelectors.selectCurrentLeftSidebarType);
		this.rightSidebar$ = this.store.select(BuilderSelectors.selectCurrentRightSideBarType);
		this.newCollectionCheck$ = this.route.queryParams.pipe(
			tap(params => {
				if (params['newCollection']) {
					this.store.dispatch(
						FlowsActions.setRightSidebar({
							sidebarType: RightSideBarType.TRIGGER_TYPE,
							props: {},
						})
					);
				}
			})
		);
	}

	ngOnDestroy(): void {
		this.snackbar.dismiss();
		this.runDetailsService.currentStepResult$.next(undefined);
	}

	ngOnInit(): void {
		document.addEventListener('mousemove', () => {}, {
			passive: false,
			capture: true,
		});
		this.store.dispatch(FlowItemDetailsActions.clearFlowItemsDetails());
		this.store.dispatch(FlowItemDetailsActions.loadFlowItemsDetails());
	}

	public get rightSideBarType() {
		return RightSideBarType;
	}

	public get instanceRunStatus() {
		return InstanceRunStatus;
	}

	public get leftSideBarType() {
		return LeftSideBarType;
	}

	rightDrawerHandleDrag(dragMoveEvent: CdkDragMove, dragHandle: HTMLElement, builderContainer: MatDrawerContainer) {
		this.ngZone.runOutsideAngular(() => {
			const width = this.rightDrawerRect.width + dragMoveEvent.distance.x * -1;
			this.rightSidebarWidth = `${width}px`;
			dragHandle.style.transform = `translate(0px, 0)`;
			builderContainer.updateContentMargins();
		});
	}

	rightDrawerHandleDragStarted() {
		this.rightSidebarDragging = true;
		const targetSideBar: HTMLElement = this.rightSideBar.nativeElement;
		this.rightDrawerRect = targetSideBar.getBoundingClientRect();
	}

	leftDrawerHandleDragStarted() {
		const targetSideBar: HTMLElement = this.leftSideBar.nativeElement;
		this.leftDrawerRect = targetSideBar.getBoundingClientRect();
	}

	leftDrawerHandleDrag(dragMoveEvent: CdkDragMove, dragHandle: HTMLElement, builderContainer: MatDrawerContainer) {
		this.leftSidebarDragging = true;
		this.ngZone.runOutsideAngular(() => {
			const width = this.leftDrawerRect.width + dragMoveEvent.distance.x;
			this.leftSideBarWidth = `${width}px`;
			dragHandle.style.transform = `translate(0px, 0)`;
			builderContainer.updateContentMargins();
		});
	}

	rightDrawHandleDragStopped() {
		this.rightSidebarDragging = false;
	}

	leftDrawerHandleDragEnded() {
		this.leftSidebarDragging = false;
	}
}
