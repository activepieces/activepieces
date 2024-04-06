import {
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { FormControl } from '@angular/forms';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
  ActionType,
  ApFlagId,
  TriggerTestStrategy,
  TriggerType,
} from '@activepieces/shared';
import {
  BuilderSelectors,
  Step,
  RightSideBarType,
  ViewModeEnum,
} from '@activepieces/ui/feature-builder-store';
import { forkJoin } from 'rxjs';
import {
  TestStepService,
  FlagService,
  FlowBuilderService,
} from '@activepieces/ui/common';
import { BuilderAutocompleteMentionsDropdownService } from '@activepieces/ui/common';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

@Component({
  selector: 'app-flow-right-sidebar',
  templateUrl: './flow-right-sidebar.component.html',
  styleUrls: ['./flow-right-sidebar.component.scss'],
})
export class FlowRightSidebarComponent implements OnInit {
  ActionType = ActionType;
  TriggerType = TriggerType;
  rightSidebarType$: Observable<RightSideBarType>;
  testFormControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  currentStep$: Observable<Step | null | undefined>;
  editStepSectionRect: DOMRect;
  @ViewChild('editStepSection', { read: ElementRef })
  editStepSection: ElementRef;
  @ViewChild('selectedStepResultContainer', { read: ElementRef })
  selectedStepResultContainer: ElementRef;
  elevateResizer$: Observable<void>;
  animateSectionsHeightChange = false;
  triggerSupportsLoadingTestData$: Observable<boolean>;
  isResizerGrabbed = false;
  triggerSupportsSimulation$: Observable<boolean>;
  viewMode$: Observable<ViewModeEnum>;
  ViewModeEnum = ViewModeEnum;
  showDocs$: Observable<boolean>;
  currentStepPieceVersion$: Observable<
    | {
        version: string | undefined;
        latest: boolean;
        tooltipText: string;
      }
    | undefined
  >;
  constructor(
    private store: Store,
    private ngZone: NgZone,
    private testStepService: TestStepService,
    private renderer2: Renderer2,
    private flagService: FlagService,
    private pieceMetadataService: PieceMetadataService,
    public builderService: FlowBuilderService,
    private builderAutocompleteMentionsDropdownService: BuilderAutocompleteMentionsDropdownService
  ) {}

  ngOnInit(): void {
    this.showDocs$ = this.flagService.isFlagEnabled(ApFlagId.SHOW_DOCS);
    this.checkCurrentStepPieceVersion();
    this.rightSidebarType$ = this.store.select(
      BuilderSelectors.selectCurrentRightSideBarType
    );
    this.listenToStepChangeAndAnimateResizer();
    this.checkIfTriggerSupportsLoadingTestData();
    this.checkIfTriggerSupportsSimulation();
    this.checkForViewMode();
  }

  private checkForViewMode() {
    this.viewMode$ = this.store.select(BuilderSelectors.selectViewMode);
  }

  private checkIfTriggerSupportsLoadingTestData() {
    this.triggerSupportsLoadingTestData$ = this.checkTriggerTestStrategyIs(
      TriggerTestStrategy.TEST_FUNCTION
    );
  }

  private checkIfTriggerSupportsSimulation() {
    this.triggerSupportsSimulation$ = this.checkTriggerTestStrategyIs(
      TriggerTestStrategy.SIMULATION
    );
  }

  private checkTriggerTestStrategyIs(strategy: TriggerTestStrategy) {
    return this.currentStep$.pipe(
      switchMap((step) => {
        if (step && step.type === TriggerType.PIECE) {
          return this.pieceMetadataService
            .getPieceMetadata(
              step.settings.pieceName,
              step.settings.pieceVersion
            )
            .pipe(
              map((res) => {
                const pieceTrigger = res.triggers[step.settings.triggerName];
                return pieceTrigger?.testStrategy === strategy;
              })
            );
        }
        return of(false);
      })
    );
  }

  private listenToStepChangeAndAnimateResizer() {
    this.currentStep$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        tap(() => {
          setTimeout(() => {
            this.builderAutocompleteMentionsDropdownService.editStepSection =
              this.editStepSection;
          }, 100);
          this.elevateResizer$ = this.testStepService.elevateResizer$.pipe(
            tap((shouldAnimate) => {
              if (shouldAnimate && !this.isResizerGrabbed) {
                this.resizerAnimation();
              }
            }),
            map(() => void 0)
          );
        }),
        shareReplay(1)
      );
  }

  checkCurrentStepPieceVersion() {
    this.currentStepPieceVersion$ = this.store
      .select(BuilderSelectors.selectCurrentStepPieceVersionAndName)
      .pipe(
        switchMap((res) => {
          if (res) {
            return forkJoin([
              this.pieceMetadataService.getPieceMetadata(
                res.pieceName,
                res.version
              ),
              this.pieceMetadataService.getPieceMetadata(
                res.pieceName,
                undefined
              ),
            ]).pipe(
              map(([pieceManifest, latestVersion]) => {
                if (
                  pieceManifest &&
                  pieceManifest.version === latestVersion.version
                ) {
                  return {
                    version: pieceManifest.version,
                    latest: true,
                    tooltipText: `You are using the latest version of ${pieceManifest.displayName}. Click to learn more`,
                  };
                }

                return {
                  version: pieceManifest.version,
                  latest: false,
                  tooltipText:
                    `You are using an old version of ${pieceManifest?.displayName}. Click to learn more` ||
                    ``,
                };
              })
            );
          }
          return of(undefined);
        })
      );
  }

  get sidebarType() {
    return RightSideBarType;
  }
  resizerDragStarted() {
    this.isResizerGrabbed = true;
    this.editStepSectionRect =
      this.editStepSection.nativeElement.getBoundingClientRect();
  }
  resizerDragged(dragMoveEvent: Pick<CdkDragMove, 'distance'>) {
    const height = this.editStepSectionRect.height + dragMoveEvent.distance.y;
    this.ngZone.runOutsideAngular(() => {
      this.renderer2.setStyle(
        this.editStepSection.nativeElement,
        'height',
        `${height}px`
      );
      this.renderer2.setStyle(
        this.selectedStepResultContainer.nativeElement,
        'max-height',
        `calc(100% - ${height}px - 5px)`
      );
    });
  }
  resizerAnimation() {
    this.animateSectionsHeightChange = true;
    this.renderer2.setStyle(
      this.editStepSection.nativeElement,
      'height',
      `calc(50% - 48px)`
    );
    this.renderer2.setStyle(
      this.selectedStepResultContainer.nativeElement,
      'max-height',
      `calc(50% + 26px)`
    );
    setTimeout(() => {
      this.animateSectionsHeightChange = false;
    }, 150);
  }
  resetTopResizerSectionHeight() {
    this.renderer2.removeStyle(this.editStepSection.nativeElement, 'height');
  }
  openVersionDocs() {
    window.open(
      'https://www.activepieces.com/docs/pieces/versioning',
      '_blank',
      'noopener'
    );
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.editStepSection && this.selectedStepResultContainer) {
      this.editStepSectionRect =
        this.editStepSection.nativeElement.getBoundingClientRect();
      this.resizerDragged({ distance: { y: 99999, x: 0 } });
    }
  }
}
