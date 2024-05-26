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
  BuilderSelectors,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import {
  delay,
  filter,
  firstValueFrom,
  map,
  Observable,
  of,
  switchMap,
  take,
  takeWhile,
  tap,
} from 'rxjs';
import { MatDrawerContainer } from '@angular/material/sidenav';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RunDetailsService } from '@activepieces/ui/feature-builder-left-sidebar';
import {
  FlowRun,
  FlowRunStatus,
  FlowVersion,
  TriggerType,
  WebsocketClientEvent,
  isFlowStateTerminal,
} from '@activepieces/shared';
import {
  LeftSideBarType,
  RightSideBarType,
} from '@activepieces/ui/feature-builder-store';
import {
  AppearanceService,
  TestStepService,
  FlowBuilderService,
  WebSocketService,
  FlowRendererService,
  PlatformService,
} from '@activepieces/ui/common';
import {
  flowDisplayNameInRouteData,
} from '../../resolvers/builder-route-data';
import { BuilderAutocompleteMentionsDropdownService } from '@activepieces/ui/common';
import { PannerService, ZoomingService } from '@activepieces/ui-canvas-utils';

@Component({
  selector: 'app-flow-builder',
  templateUrl: './flow-builder.component.html',
  styleUrls: ['./flow-builder.component.scss'],
})
export class FlowBuilderComponent implements OnInit, OnDestroy {
  @ViewChild('canvasWrapper') canvasWrapper?: ElementRef;
  @ViewChild('rightSideDrawer', { read: ElementRef })
  rightSideBar?: ElementRef<HTMLElement>;
  @ViewChild('leftSideDrawer', { read: ElementRef })
  leftSideBar?: ElementRef<HTMLElement>;
  rightSidebarWidth = '0';
  leftSideBarWidth = '0';
  leftSidebar$: Observable<LeftSideBarType>;
  rightSidebar$: Observable<RightSideBarType>;
  rightDrawerRect?: DOMRect;
  leftDrawerRect?: DOMRect;
  rightSidebarDragging = false;
  leftSidebarDragging = false;
  loadInitialData$: Observable<void> = new Observable<void>();
  isPanning$: Observable<boolean>;
  isDragging$: Observable<boolean>;
  TriggerType = TriggerType;
  testingStepSectionIsRendered$: Observable<boolean>;
  graphChanged$?: Observable<FlowVersion>;
  importTemplate$?: Observable<void>;
  dataInsertionPopupHidden$: Observable<boolean>;
  codeEditorOptions = {
    minimap: { enabled: false },
    theme: 'apTheme',
    language: 'typescript',
    readOnly: false,
    automaticLayout: true,
  };
  updateRun$: Observable<unknown>;
  setTitle$?: Observable<void>;
  showPoweredByAp$: Observable<boolean>;
  viewedVersion$: Observable<FlowVersion>;
  constructor(
    private store: Store,
    private actRoute: ActivatedRoute,
    private ngZone: NgZone,
    private snackbar: MatSnackBar,
    private runDetailsService: RunDetailsService,
    private appearanceService: AppearanceService,
    private pannerService: PannerService,
    private testStepService: TestStepService,
    private flowRendererService: FlowRendererService,
    public builderService: FlowBuilderService,
    private platformService: PlatformService,
    public builderAutocompleteService: BuilderAutocompleteMentionsDropdownService,
    private websocketService: WebSocketService,
    private zoomingService: ZoomingService
  ) {
    this.viewedVersion$ = this.store.select(BuilderSelectors.selectViewedVersion);
    this.showPoweredByAp$ = this.platformService.showPoweredByAp();
    this.dataInsertionPopupHidden$ =
      this.builderAutocompleteService.currentAutocompleteInputId$.pipe(
        switchMap((val) => {
          if (val === null) {
            //wait for fade400ms animation to pass
            return of(true).pipe(delay(400));
          }
          return of(false);
        })
      );
    this.testingStepSectionIsRendered$ =
      this.testStepService.testingStepSectionIsRendered$.asObservable();
    this.isPanning$ = this.pannerService.isPanning$;
    this.isDragging$ = this.flowRendererService.isDragginStep$;
    this.loadInitialData$ = this.actRoute.data.pipe(
      tap((value) => {
        this.setTitle$ = this.appearanceService.setTitle(value[flowDisplayNameInRouteData])
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

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();

      const delta = Math.sign(event.deltaY);
      if (delta === -1) {
        this.zoomingService.setZoomingScale(
          Math.min(
            this.zoomingService.zoomingScale + this.zoomingService.zoomingStep,
            this.zoomingService.maxZoom
          )
        );
      } else {
        this.zoomingService.setZoomingScale(
          Math.max(
            this.zoomingService.zoomingScale - this.zoomingService.zoomingStep,
            this.zoomingService.minZoom
          )
        );
      }
    }
  }

  @HostListener('mousemove', ['$event'])
  mouseMove(e: MouseEvent) {
    this.flowRendererService.clientMouseX = e.clientX;
    this.flowRendererService.clientMouseY = e.clientY;
  }
  ngOnDestroy(): void {
    this.websocketService.disconnect();
    this.snackbar.dismiss();
    this.runDetailsService.currentStepResult$.next(undefined);
    this.builderService.componentToShowInsidePortal$.next(undefined);
  }

  ngOnInit(): void {
    this.websocketService.connect()
    const runId = this.actRoute.snapshot.paramMap.get('runId') as string;
    if (runId) {
      this.updateRun$ = this.websocketService.socket.fromEvent<FlowRun>(WebsocketClientEvent.TEST_FLOW_RUN_PROGRESS)
        .pipe(
          filter((run) => run.id === runId),
          tap((run) => {
            this.store.dispatch(
              canvasActions.setRun({
                run,
              })
            );
          }),
          takeWhile((run) => !isFlowStateTerminal(run.status))
        );
    }
  }

  public get rightSideBarType() {
    return RightSideBarType;
  }

  public get instanceRunStatus() {
    return FlowRunStatus;
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
      if (this.rightDrawerRect) {
        const width =
          this.rightDrawerRect.width + dragMoveEvent.distance.x * -1;
        this.rightSidebarWidth = `${width}px`;
        dragHandle.style.transform = `translate(0px, 0)`;
        builderContainer.updateContentMargins();
      }
    });
  }

  rightDrawerHandleDragStarted() {
    this.rightSidebarDragging = true;
    const targetSideBar = this.rightSideBar?.nativeElement;
    this.rightDrawerRect = targetSideBar?.getBoundingClientRect();
  }

  leftDrawerHandleDragStarted() {
    const targetSideBar = this.leftSideBar?.nativeElement;
    this.leftDrawerRect = targetSideBar?.getBoundingClientRect();
  }

  leftDrawerHandleDrag(
    dragMoveEvent: CdkDragMove,
    dragHandle: HTMLElement,
    builderContainer: MatDrawerContainer
  ) {
    this.leftSidebarDragging = true;
    this.ngZone.runOutsideAngular(() => {
      if (this.leftDrawerRect) {
        const width = this.leftDrawerRect.width + dragMoveEvent.distance.x;
        this.leftSideBarWidth = `${width}px`;
        dragHandle.style.transform = `translate(0px, 0)`;
        builderContainer.updateContentMargins();
      }
    });
  }

  rightDrawHandleDragStopped() {
    this.rightSidebarDragging = false;
  }

  leftDrawerHandleDragEnded() {
    this.leftSidebarDragging = false;
  }

  @HostListener('window:beforeunload', ['$event'])
  async onBeforeUnload(event: BeforeUnloadEvent) {
    const isSaving = await firstValueFrom(
      this.store.select(BuilderSelectors.selectIsSaving).pipe(take(1))
    );
    if (isSaving) {
      event.preventDefault();
      event.returnValue = false;
    }
  }


}
