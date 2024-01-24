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
import { ActionType, ApFlagId, TriggerType } from '@activepieces/shared';
import {
  BuilderSelectors,
  Step,
  RightSideBarType,
  ViewModeEnum,
} from '@activepieces/ui/feature-builder-store';
import { forkJoin } from 'rxjs';
import {
  TestStepService,
  isOverflown,
  FlagService,
  FlowBuilderService,
} from '@activepieces/ui/common';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { BuilderAutocompleteMentionsDropdownService } from '@activepieces/ui/common';
import {
  CORE_SCHEDULE,
  PieceMetadataService,
} from '@activepieces/ui/feature-pieces';

@Component({
  selector: 'app-flow-right-sidebar',
  templateUrl: './flow-right-sidebar.component.html',
  styleUrls: ['./flow-right-sidebar.component.scss'],
})
export class FlowRightSidebarComponent implements OnInit {
  isOverflown = isOverflown;
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
  isCurrentStepPollingTrigger$: Observable<boolean>;
  isResizerGrabbed = false;
  isCurrentStepPieceWebhookTrigger$: Observable<boolean>;
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
    private pieceMetadaService: PieceMetadataService,
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
    this.checkIfCurrentStepIsPollingTrigger();
    this.checkIfCurrentStepIsPieceWebhookTrigger();
    this.checkForViewMode();
  }

  private checkForViewMode() {
    this.viewMode$ = this.store.select(BuilderSelectors.selectViewMode);
  }

  private checkIfCurrentStepIsPollingTrigger() {
    this.isCurrentStepPollingTrigger$ = this.currentStep$.pipe(
      switchMap((step) => {
        if (step && step.type === TriggerType.PIECE) {
          return this.pieceMetadaService
            .getPieceMetadata(
              step.settings.pieceName,
              step.settings.pieceVersion
            )
            .pipe(
              map((res) => {
                return (
                  res.triggers[step.settings.triggerName] &&
                  (res.triggers[step.settings.triggerName].type ===
                    TriggerStrategy.POLLING ||
                    res.triggers[step.settings.triggerName].type ===
                      TriggerStrategy.APP_WEBHOOK)
                );
              })
            );
        }
        return of(false);
      })
    );
  }

  private checkIfCurrentStepIsPieceWebhookTrigger() {
    this.isCurrentStepPieceWebhookTrigger$ = this.currentStep$.pipe(
      switchMap((step) => {
        if (step && step.type === TriggerType.PIECE) {
          return this.pieceMetadaService
            .getPieceMetadata(
              step.settings.pieceName,
              step.settings.pieceVersion
            )
            .pipe(
              map((res) => {
                return (
                  res.triggers[step.settings.triggerName] &&
                  res.triggers[step.settings.triggerName].type ===
                    TriggerStrategy.WEBHOOK
                );
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
        switchMap((step) => {
          if (
            step &&
            step.type === TriggerType.PIECE &&
            step.settings.pieceName === CORE_SCHEDULE
          ) {
            return of(null);
          }
          return of(step);
        }),
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
              this.pieceMetadaService.getPieceMetadata(
                res.pieceName,
                res.version
              ),
              this.pieceMetadaService.getLatestVersion(res.pieceName),
            ]).pipe(
              map(([pieceManifest, latestVersion]) => {
                if (pieceManifest && pieceManifest.version === latestVersion) {
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
      this.resizerDragged({ distance: { y: 99999999999, x: 0 } });
    }
  }
}
