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
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { RunDetailsService } from '@activepieces/ui/feature-builder-left-sidebar';
import {
  Action,
  ActionType,
  FlowRunStatus,
  FlowRun,
  StepOutput,
  StepOutputStatus,
  Trigger,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import {
  PieceMetadataService,
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
  corePieceIconUrl,
} from '@activepieces/ui/feature-pieces';
import {
  FlowItemDetails,
  FlowRendererService,
  fadeIn400ms,
  isOverflown,
} from '@activepieces/ui/common';
import {
  BuilderSelectors,
  Step,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import {
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_WIDTH,
  FLOW_ITEM_ICON_SIZE,
  MAX_FLOW_ITEM_NAME_WIDTH,
} from '@activepieces/ui-canvas-utils';

@Component({
  selector: 'app-flow-item-content',
  templateUrl: './flow-item-content.component.html',
  styleUrls: ['./flow-item-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class FlowItemContentComponent implements OnInit {
  readonly FLOW_ITEM_HEIGHT = FLOW_ITEM_HEIGHT;
  readonly FLOW_ITEM_WIDTH = FLOW_ITEM_WIDTH;
  readonly FLOW_ITEM_ICON_SIZE = FLOW_ITEM_ICON_SIZE;
  readonly MAX_FLOW_ITEM_NAME_WIDTH = MAX_FLOW_ITEM_NAME_WIDTH;
  //in case it is not reached, we return undefined
  @ViewChild('stepDragTemplate') stepDragTemplate: TemplateRef<any>;
  stepStatus$: Observable<StepOutputStatus | undefined>;
  stepInsideLoopStatus$: Observable<StepOutputStatus | undefined>;
  hover = false;
  flowItemChanged$: Subject<boolean> = new Subject();
  stepIconUrl: string;
  _flowItem: Action | Trigger;
  selectedRun$: Observable<FlowRun | undefined>;
  stepAppName$: Observable<string>;
  isOverflown = isOverflown;
  childStepsIconsUrls: Record<string, Observable<string>> = {};
  StepOutputStatus = StepOutputStatus;
  ExecutionOutputStatus = FlowRunStatus;
  TriggerType = TriggerType;
  ActionType = ActionType;
  stepIndex$: Observable<number>;
  @Input() selected: boolean;
  @Input() readOnly: boolean;
  @Input() set flowItem(newFlowItem: Step) {
    this._flowItem = newFlowItem;
    this.stepAppName$ = this.getStepAppName();
    this.childStepsIconsUrls = this.extractChildStepsIconsUrls();
    this.flowItemChanged$.next(true);
    this.fetchFlowItemDetailsAndLoadLogo();
    this.stepIndex$ = this.store.select(
      BuilderSelectors.selectStepIndex(this._flowItem.name)
    );
  }
  isDragging$: Observable<boolean>;
  stepOutput: StepOutput | undefined;
  flowItemDetails$: Observable<FlowItemDetails | null | undefined>;
  constructor(
    private store: Store,
    private cd: ChangeDetectorRef,
    private runDetailsService: RunDetailsService,
    private flowRendererService: FlowRendererService,
    private actionMetaDataService: PieceMetadataService
  ) {}

  ngOnInit(): void {
    this.isDragging$ = this.flowRendererService.isDragginStep$;
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
          this.stepOutput = stepNameAndStatus.output;
          return stepNameAndStatus.output?.status;
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
      distinctUntilChanged(),
      map((selectedRun) => {
        if (selectedRun) {
          if (selectedRun.status !== FlowRunStatus.RUNNING) {
            const stepName = this._flowItem.name;
            const result = selectedRun.steps[stepName.toString()];
            if (result) {
              this.stepOutput = result;
            }
            return result === undefined ? undefined : result.status;
          } else {
            return StepOutputStatus.RUNNING;
          }
        }
        return undefined;
      }),
      shareReplay(1)
    );
  }

  selectStep() {
    this.store.dispatch(
      canvasActions.selectStepByName({
        stepName: this._flowItem.name,
      })
    );
    this.runDetailsService.currentStepResult$.next({
      stepName: this._flowItem.name,
      output: this.stepOutput,
    });
  }

  getStepAppName() {
    switch (this._flowItem.type) {
      case ActionType.BRANCH:
        return of($localize`Branch`);
      case ActionType.CODE:
        return of($localize`Code`);
      case ActionType.LOOP_ON_ITEMS:
        return of($localize`Loop`);
      case ActionType.PIECE:
      case TriggerType.PIECE:
        return this.actionMetaDataService
          .getPieceMetadata(
            this._flowItem.settings.pieceName,
            this._flowItem.settings.pieceVersion
          )
          .pipe(map((p) => p.displayName));
      case TriggerType.EMPTY:
        return of($localize`Choose a trigger`);
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
        } else {
          const icon = this.actionMetaDataService.findNonPieceStepIcon(s.type);
          stepsIconsUrls[icon.key] = of(icon.url);
        }
      });
    }

    return stepsIconsUrls;
  }
}
