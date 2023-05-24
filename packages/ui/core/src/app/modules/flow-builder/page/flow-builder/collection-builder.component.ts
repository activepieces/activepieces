import {
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  BuilderActions,
  BuilderSelectors,
  CollectionBuilderService,
  FlowFactoryUtil,
  FlowItemDetailsActions,
  FlowRendererService,
  ViewModeEnum,
} from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map, Observable, tap } from 'rxjs';
import { MatDrawerContainer } from '@angular/material/sidenav';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestRunBarComponent } from '@activepieces/ui/feature-builder-store';
import { RunDetailsService } from '@activepieces/ui/feature-builder-left-sidebar';
import { ExecutionOutputStatus, Flow, TriggerType } from '@activepieces/shared';
import { Title } from '@angular/platform-browser';
import {
  LeftSideBarType,
  RightSideBarType,
} from '@activepieces/ui/feature-builder-store';
import { TestStepService } from '@activepieces/ui/common';
import { PannerService } from '@activepieces/ui/feature-builder-canvas';
import {
  BuilderRouteData,
  RunRouteData,
} from '../../resolvers/builder-route-data';

@Component({
  selector: 'app-collection-builder',
  templateUrl: './collection-builder.component.html',
  styleUrls: ['./collection-builder.component.scss'],
})
export class CollectionBuilderComponent implements OnInit, OnDestroy {
  @ViewChild('canvasWrapper') canvasWrapper: ElementRef;
  @ViewChild('rightSideDrawer', { read: ElementRef }) rightSideBar: ElementRef;
  @ViewChild('leftSideDrawer', { read: ElementRef }) leftSideBar: ElementRef;
  rightSidebarWidth = '0';
  leftSideBarWidth = '0';
  leftSidebar$: Observable<LeftSideBarType>;
  rightSidebar$: Observable<RightSideBarType>;
  rightDrawerRect: DOMRect;
  leftDrawerRect: DOMRect;
  rightSidebarDragging = false;
  leftSidebarDragging = false;
  loadInitialData$: Observable<void> = new Observable<void>();
  isPanning$: Observable<boolean>;
  isDragging$: Observable<boolean>;
  TriggerType = TriggerType;
  testingStepSectionIsRendered$: Observable<boolean>;
  graphChanged$: Observable<Flow>;
  showGuessFlowComponent = true;

  constructor(
    private store: Store,
    private actRoute: ActivatedRoute,
    private ngZone: NgZone,
    private snackbar: MatSnackBar,
    private runDetailsService: RunDetailsService,
    private titleService: Title,
    private pannerService: PannerService,
    private testStepService: TestStepService,
    private flowRendererService: FlowRendererService,
    public builderService: CollectionBuilderService
  ) {
    this.listenToGraphChanges();
    this.testingStepSectionIsRendered$ =
      this.testStepService.testingStepSectionIsRendered$.asObservable();
    this.isPanning$ = this.pannerService.isPanning$.asObservable();
    this.isDragging$ = this.flowRendererService.draggingSubject.asObservable();
    this.loadInitialData$ = this.actRoute.data.pipe(
      tap((value) => {
        const routeData = value as BuilderRouteData | RunRouteData;
        const runInformation = routeData.runInformation;
        if (runInformation) {
          this.store.dispatch(
            BuilderActions.loadInitial({
              flow: routeData.runInformation.flow,
              viewMode: ViewModeEnum.VIEW_INSTANCE_RUN,
              run: routeData.runInformation.run,
              appConnections: routeData.connections,
              folder: routeData.runInformation.folder,
            })
          );
          this.titleService.setTitle(
            `AP-${routeData.runInformation.flow.version.displayName}`
          );
          this.snackbar.openFromComponent(TestRunBarComponent, {
            duration: undefined,
          });
        } else {
          this.titleService.setTitle(
            `AP-${routeData.flowAndFolder.flow.version.displayName}`
          );
          this.store.dispatch(
            BuilderActions.loadInitial({
              flow: routeData.flowAndFolder.flow,
              instance: routeData.instanceData?.instance,
              viewMode: ViewModeEnum.BUILDING,
              appConnections: routeData.connections,
              folder: routeData.flowAndFolder.folder,
              publishedVersion: routeData.instanceData?.publishedFlowVersion,
            })
          );
        }
      }),
      map(() => void 0)
    );

    this.leftSidebar$ = this.store.select(
      BuilderSelectors.selectCurrentLeftSidebarType
    );
    this.rightSidebar$ = this.store.select(
      BuilderSelectors.selectCurrentRightSideBarType
    );
  }
  @HostListener('mousemove', ['$event'])
  mouseMove(e: MouseEvent) {
    this.flowRendererService.clientX = e.clientX;
    this.flowRendererService.clientY = e.clientY;
  }
  ngOnDestroy(): void {
    this.snackbar.dismiss();
    this.runDetailsService.currentStepResult$.next(undefined);
  }

  ngOnInit(): void {
    this.store.dispatch(FlowItemDetailsActions.loadFlowItemsDetails());
  }

  public get rightSideBarType() {
    return RightSideBarType;
  }

  public get instanceRunStatus() {
    return ExecutionOutputStatus;
  }

  public get leftSideBarType() {
    return LeftSideBarType;
  }

  rightDrawerHandleDrag(
    dragMoveEvent: CdkDragMove,
    dragHandle: HTMLElement,
    builderContainer: MatDrawerContainer
  ) {
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

  leftDrawerHandleDrag(
    dragMoveEvent: CdkDragMove,
    dragHandle: HTMLElement,
    builderContainer: MatDrawerContainer
  ) {
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
  listenToGraphChanges() {
    this.graphChanged$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        distinctUntilChanged(),
        tap((flow) => {
          if (flow) {
            const rootStep = FlowFactoryUtil.createRootStep(flow.version);
            this.flowRendererService.refreshCoordinatesAndSetActivePiece(
              rootStep
            );
          } else {
            this.flowRendererService.refreshCoordinatesAndSetActivePiece(
              undefined
            );
          }
        })
      );
  }
}
