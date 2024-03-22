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
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
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
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

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
  flowItemChanged$: Subject<boolean> = new BehaviorSubject(true);
  stepIconUrl: string;
  _flowItem: Action | Trigger;
  selectedRun$: Observable<FlowRun | undefined>;
  stepAppName$: Observable<string>;
  isOverflown = isOverflown;
  childStepsIconsUrls$: Observable<string[]>;
  StepOutputStatus = StepOutputStatus;
  ExecutionOutputStatus = FlowRunStatus;
  TriggerType = TriggerType;
  ActionType = ActionType;
  stepIndex$: Observable<number>;
  @Input() selected: boolean;
  @Input() readOnly: boolean;
  @Input() set flowItem(newFlowItem: Step) {
    this._flowItem = newFlowItem;
    this.stepAppName$ = this.pieceService
      .getStepDetails(this._flowItem)
      .pipe(map((details) => details.name));
    this.flowItemChanged$.next(true);
    this.childStepsIconsUrls$ = this.childrenLogoUrls();
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
    private pieceService: PieceMetadataService
  ) {}

  ngOnInit(): void {
    this.isDragging$ = this.flowRendererService.isDragginStep$;
    this.selectedRun$ = this.store.select(
      BuilderSelectors.selectCurrentFlowRun
    );
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
    this.flowItemDetails$ = this.flowItemChanged$.pipe(
      switchMap(() =>
        this.pieceService.getStepDetails(this._flowItem).pipe(
          tap((details) => {
            const itemIcon = new Image();
            itemIcon.src = details.logoUrl!;
            itemIcon.onload = () => {
              this.stepIconUrl = details.logoUrl!;
              this.cd.markForCheck();
            };
          })
        )
      )
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

  childrenLogoUrls() {
    const flowItem = this._flowItem;
    const haveChildren = flowHelper.doesActionHaveChildren(flowItem);
    if (haveChildren) {
      const children = flowHelper.getAllChildSteps(flowItem);
      return forkJoin(
        children.map((child) =>
          this.pieceService
            .getStepDetails(child)
            .pipe(map((details) => details.logoUrl!))
        )
      ).pipe(map((urls) => Array.from(new Set(urls))));
    }
    return of([]);
  }
}
