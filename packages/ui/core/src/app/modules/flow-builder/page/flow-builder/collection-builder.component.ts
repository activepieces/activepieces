import {
  Component,
  ElementRef,
  HostListener,
  Injector,
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
import {
  delay,
  distinctUntilChanged,
  EMPTY,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { MatDrawerContainer } from '@angular/material/sidenav';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestRunBarComponent } from '@activepieces/ui/feature-builder-store';
import { RunDetailsService } from '@activepieces/ui/feature-builder-left-sidebar';
import {
  ExecutionOutputStatus,
  FlowTemplate,
  FlowVersion,
  TriggerType,
} from '@activepieces/shared';
import { Title } from '@angular/platform-browser';
import {
  LeftSideBarType,
  RightSideBarType,
} from '@activepieces/ui/feature-builder-store';
import {
  FlagService,
  TestStepService,
  environment,
} from '@activepieces/ui/common';
import { PannerService } from '@activepieces/ui/feature-builder-canvas';
import { MatDialog } from '@angular/material/dialog';
import {
  BuilderRouteData,
  RunRouteData,
} from '../../resolvers/builder-route-data';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  TemplatesDialogComponent,
  TemplateDialogData,
  TemplateBlogNotificationComponent,
  BLOG_URL_TOKEN,
} from '@activepieces/ui/feature-templates';
import { BuilderAutocompleteMentionsDropdownService } from '@activepieces/ui/common';

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
  graphChanged$: Observable<FlowVersion>;
  showGuessFlowComponent = true;
  importTemplate$: Observable<void>;
  dataInsertionPopupHidden$: Observable<boolean>;
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
    public builderService: CollectionBuilderService,
    private matDialog: MatDialog,
    private flagService: FlagService,
    public builderAutocompleteService: BuilderAutocompleteMentionsDropdownService
  ) {
    this.listenToGraphChanges();
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
    this.isPanning$ = this.pannerService.isPanning$.asObservable();
    this.isDragging$ = this.flowRendererService.draggingSubject.asObservable();
    if (localStorage.getItem('newFlow')) {
      const TemplateDialogData: TemplateDialogData = {
        insideBuilder: true,
      };
      this.importTemplate$ = this.flagService.getTemplatesSourceUrl().pipe(
        map((url) => !!url),
        switchMap((showDialog) => {
          if (showDialog) {
            return this.matDialog
              .open(TemplatesDialogComponent, {
                data: TemplateDialogData,
              })
              .afterClosed()
              .pipe(
                switchMap((template?: FlowTemplate) => {
                  if (template) {
                    return this.store
                      .select(BuilderSelectors.selectCurrentFlow)
                      .pipe(
                        take(1),
                        tap((flow) => {
                          this.builderService.importTemplate$.next({
                            flowId: flow.id,
                            template: template,
                          });
                          if (template.blogUrl) {
                            this.showBlogNotification(template);
                          }
                        })
                      );
                  }
                  return EMPTY;
                })
              );
          }
          return EMPTY;
        }),
        map(() => void 0)
      );
      localStorage.removeItem('newFlow');
    }
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
            `${routeData.runInformation.flow.version.displayName} - ${environment.websiteTitle}`
          );
          this.snackbar.openFromComponent(TestRunBarComponent, {
            duration: undefined,
          });
        } else {
          this.titleService.setTitle(
            `${routeData.flowAndFolder.flow.version.displayName} - ${environment.websiteTitle}`
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
  private showBlogNotification(template: FlowTemplate) {
    this.builderService.componentToShowInsidePortal$.next(
      new ComponentPortal(
        TemplateBlogNotificationComponent,
        null,
        Injector.create({
          providers: [
            {
              provide: BLOG_URL_TOKEN,
              useValue: template.blogUrl,
            },
          ],
        })
      )
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
    this.builderService.componentToShowInsidePortal$.next(undefined);
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
      .select(BuilderSelectors.selectShownFlowVersion)
      .pipe(
        distinctUntilChanged(),
        tap((version) => {
          if (version) {
            const rootStep = FlowFactoryUtil.createRootStep(version);
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
