import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  filter,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { RunDetailsService } from '@activepieces/ui/feature-builder-left-sidebar';
import { DeleteStepDialogComponent } from './delete-step-dialog/delete-step-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  ActionType,
  ExecutionOutputStatus,
  FlowRun,
  StepOutput,
  StepOutputStatus,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import {
  ActionMetaService,
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
  FlowItemDetails,
  corePieceIconUrl,
  fadeIn400ms,
  isOverflown,
} from '@activepieces/ui/common';
import {
  BuilderSelectors,
  FlowItem,
  FlowRendererService,
  FlowsActions,
  NO_PROPS,
  RightSideBarType,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-flow-item-content',
  templateUrl: './flow-item-content.component.html',
  styleUrls: ['./flow-item-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class FlowItemContentComponent implements OnInit {
  //in case it is not reached, we return undefined
  @ViewChild('stepDragTemplate') stepDragTemplate: TemplateRef<any>;
  stepStatus$: Observable<StepOutputStatus | undefined>;
  stepInsideLoopStatus$: Observable<StepOutputStatus | undefined>;
  hover = false;
  flowItemChanged$: Subject<boolean> = new Subject();
  stepIconUrl: string;
  _flowItem: FlowItem;
  selectedRun$: Observable<FlowRun | undefined>;
  readonly$: Observable<boolean>;
  logoTooltipText = '';
  isOverflown = isOverflown;
  childStepsIconsUrls: Record<string, Observable<string>> = {};
  StepOutputStatus = StepOutputStatus;
  ExecutionOutputStatus = ExecutionOutputStatus;
  TriggerType = TriggerType;
  ActionType = ActionType;
  @Input() selected: boolean;
  @Input() trigger = false;
  @Input() viewMode: boolean;
  @Input() set flowItem(newFlowItem: FlowItem) {
    this._flowItem = newFlowItem;
    this.logoTooltipText = this.getLogoTooltipText();
    this.childStepsIconsUrls = this.extractChildStepsIconsUrls();
    this.flowItemChanged$.next(true);
    this.fetchFlowItemDetailsAndLoadLogo();
  }
  isDragging$: Observable<boolean>;
  stepResult: StepOutput | undefined;
  flowItemDetails$: Observable<FlowItemDetails | null | undefined>;
  constructor(
    private store: Store,
    private cd: ChangeDetectorRef,
    private runDetailsService: RunDetailsService,
    private dialogService: MatDialog,
    private flowRendererService: FlowRendererService,
    private actionMetaDataService: ActionMetaService
  ) {}

  ngOnInit(): void {
    this.isDragging$ = this.flowRendererService.draggingSubject.asObservable();
    this.readonly$ = this.store.select(BuilderSelectors.selectReadOnly);
    this.selectedRun$ = this.store.select(
      BuilderSelectors.selectCurrentFlowRun
    );
    this.childStepsIconsUrls = this.extractChildStepsIconsUrls();
    this.stepStatus$ = this.getStepStatusIfItsNotInsideLoop();
    this.stepInsideLoopStatus$ =
      this.runDetailsService.iterationStepResultState$.pipe(
        filter((stepNameAndStatus) => {
          return stepNameAndStatus.stepName === this._flowItem.name;
        }),
        map((stepNameAndStatus) => {
          this.stepResult = stepNameAndStatus.result;
          return stepNameAndStatus.result?.status;
        })
      );
    this.fetchFlowItemDetailsAndLoadLogo();
  }

  private fetchFlowItemDetailsAndLoadLogo() {
    this.flowItemDetails$ = this.store
      .select(BuilderSelectors.selectAllFlowItemsDetailsLoadedState)
      .pipe(
        takeUntil(this.flowItemChanged$),
        switchMap((loaded) => {
          if (loaded) {
            return this.store
              .select(BuilderSelectors.selectFlowItemDetails(this._flowItem))
              .pipe(
                tap((flowItemDetails) => {
                  if (flowItemDetails) {
                    const itemIcon = new Image();
                    itemIcon.src = flowItemDetails.logoUrl!;
                    itemIcon.onload = () => {
                      this.stepIconUrl = flowItemDetails.logoUrl!;
                      this.cd.markForCheck();
                    };
                  } else {
                    console.error(
                      `Flow item has no details:${this._flowItem.name}`
                    );
                  }
                })
              );
          }
          return of(null);
        })
      );
  }

  getStepStatusIfItsNotInsideLoop(): Observable<StepOutputStatus | undefined> {
    return this.selectedRun$.pipe(
      map((selectedRun) => {
        if (selectedRun) {
          if (
            selectedRun.status !== ExecutionOutputStatus.RUNNING &&
            selectedRun.executionOutput?.executionState
          ) {
            const stepName = this._flowItem.name;
            const result =
              selectedRun.executionOutput?.executionState.steps[
                stepName.toString()
              ];
            if (result) {
              this.stepResult = result;
            }
            return result === undefined ? undefined : result.status;
          } else {
            return StepOutputStatus.RUNNING;
          }
        }
        return undefined;
      })
    );
  }

  deleteStep() {
    const stepName = this._flowItem.name;
    if (stepName == undefined) {
      return;
    }
    this.dialogService.open(DeleteStepDialogComponent, { data: stepName });
  }

  changeTrigger() {
    this.store.dispatch(
      FlowsActions.setRightSidebar({
        sidebarType: RightSideBarType.TRIGGER_TYPE,
        props: NO_PROPS,
        deselectCurrentStep: false,
      })
    );
  }
  selectStep() {
    this.store.dispatch(
      FlowsActions.selectStepByName({
        stepName: this._flowItem.name,
      })
    );
    this.runDetailsService.currentStepResult$.next({
      stepName: this._flowItem.name,
      result: this.stepResult,
    });
  }

  getLogoTooltipText() {
    switch (this._flowItem.type) {
      case ActionType.BRANCH:
        return 'Branch';
      case ActionType.MISSING:
        return 'Missing';
      case ActionType.CODE:
        return 'Code';
      case ActionType.LOOP_ON_ITEMS:
        return 'Loop';
      case ActionType.PIECE:
        return this._flowItem.settings.pieceName.replace(/-/g, ' ');
      case TriggerType.EMPTY:
        return 'Click to choose a trigger';
      case TriggerType.WEBHOOK:
        return 'Webhook trigger';
      case TriggerType.PIECE:
        return this._flowItem.settings.pieceName.replace(/-/g, ' ');
    }
  }
  extractChildStepsIconsUrls() {
    const stepsIconsUrls: Record<string, Observable<string>> = {};
    if (
      this._flowItem.type === ActionType.BRANCH ||
      this._flowItem.type === ActionType.LOOP_ON_ITEMS
    ) {
      const steps = flowHelper.getAllChildSteps(this._flowItem);
      steps.forEach((s) => {
        if (s.type === ActionType.PIECE) {
          const pieceMetaData$ = this.actionMetaDataService
            .getPieceMetadata(s.settings.pieceName, s.settings.pieceVersion)
            .pipe(
              map((md) => {
                if (
                  CORE_PIECES_ACTIONS_NAMES.find(
                    (n) => s.settings.pieceName === n
                  ) ||
                  CORE_PIECES_TRIGGERS.find((n) => s.settings.pieceName === n)
                ) {
                  return corePieceIconUrl(s.settings.pieceName);
                }
                return md.logoUrl;
              })
            );
          stepsIconsUrls[s.settings.pieceName] = pieceMetaData$;
        } else if (s.type !== ActionType.MISSING) {
          const icon = this.actionMetaDataService.findNonPieceStepIcon(s);
          stepsIconsUrls[icon.key] = of(icon.url);
        }
      });
    }

    return stepsIconsUrls;
  }
}
