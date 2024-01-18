import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, of, Subject, tap } from 'rxjs';
import { PieceTrigger, TriggerType } from '@activepieces/shared';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  FIRST_LEVEL_PADDING_IN_MENTIONS_LIST,
  MentionListItem,
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import {
  BuilderSelectors,
  Step,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { FlowItemDetails } from '@activepieces/ui/common';
import {
  PieceMetadataService,
  CORE_SCHEDULE,
} from '@activepieces/ui/feature-pieces';
@Component({
  selector: 'app-piece-trigger-mention-item',
  templateUrl: './piece-trigger-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceTriggerMentionItemComponent implements OnInit {
  FIRST_LEVEL_PADDING_IN_MENTIONS_LIST = FIRST_LEVEL_PADDING_IN_MENTIONS_LIST;
  TriggerType = TriggerType;
  CORE_SCHEDULE = CORE_SCHEDULE;
  expandSample = false;
  search$: Observable<string>;
  @Input()
  set stepMention(val: MentionListItem & { step: Step }) {
    if (val.step.type !== TriggerType.PIECE) {
      throw new Error('Step is not a piece trigger');
    }
    this._stepMention = val as MentionListItem & {
      step: PieceTrigger;
    };
  }
  _stepMention: MentionListItem & { step: PieceTrigger };
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  @Input() stepIndex: number;
  flowItemDetails$: Observable<FlowItemDetails | undefined>;
  sampleData$: Observable<{
    children: MentionTreeNode[] | undefined;
    error: string;
    markedNodesToShow: Map<string, boolean>;
    value?: unknown;
  }>;
  fetching$: Subject<boolean> = new Subject();
  isPollingTrigger$: Observable<boolean>;
  isScheduleTrigger$: Observable<boolean>;
  constructor(
    private store: Store,
    private actionMetaDataService: PieceMetadataService,
    private mentionsTreeCache: MentionsTreeCacheService
  ) {}
  ngOnInit(): void {
    const cachedResult: undefined | MentionTreeNode = this.getChachedData();
    this.search$ = this.mentionsTreeCache.listSearchBarObs$.pipe(
      tap((res) => {
        this.expandSample = !!res;
      })
    );
    this.isScheduleTrigger$ = this.store.select(
      BuilderSelectors.selectIsSchduleTrigger
    );
    this.isPollingTrigger$ = this.checkIfItIsPollingTrigger();
    if (cachedResult) {
      this.mentionsTreeCache.setStepMentionsTree(this._stepMention.step.name, {
        children: cachedResult?.children || [],
        value: cachedResult?.value,
      });
      this.sampleData$ = combineLatest({
        stepTree: of({
          children: cachedResult.children,
          error: '',
          value: cachedResult.value,
        }),
        search: this.mentionsTreeCache.listSearchBarObs$,
      }).pipe(
        map((res) => {
          const markedNodesToShow = this.mentionsTreeCache.markNodesToShow(
            this._stepMention.step.name,
            res.search
          );
          return {
            children: res.stepTree.children,
            error: '',
            markedNodesToShow: markedNodesToShow,
            value: res.stepTree.value,
          };
        })
      );
    }
    this.flowItemDetails$ = this.store.select(
      BuilderSelectors.selectFlowItemDetails(this._stepMention.step)
    );
  }
  getChachedData() {
    const step = this._stepMention.step;
    let cachedResult: undefined | MentionTreeNode = undefined;
    if (
      step.type === TriggerType.PIECE &&
      step.settings.inputUiInfo.currentSelectedData
    ) {
      cachedResult = traverseStepOutputAndReturnMentionTree(
        step.settings.inputUiInfo.currentSelectedData,
        step.name,
        step.displayName
      );
    }
    return cachedResult;
  }

  checkIfItIsPollingTrigger() {
    return this.actionMetaDataService
      .getPieceMetadata(
        this._stepMention.step.settings.pieceName,
        this._stepMention.step.settings.pieceVersion
      )
      .pipe(
        map((res) => {
          if (res) {
            return (
              res.triggers[this._stepMention.step.settings.triggerName]
                ?.type === TriggerStrategy.POLLING &&
              this._stepMention.step.settings.pieceName !== CORE_SCHEDULE
            );
          }
          return false;
        })
      );
  }
  selectStep() {
    this.store.dispatch(
      canvasActions.selectStepByName({ stepName: this._stepMention.step.name })
    );
  }
}
