import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  combineLatest,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { PieceTrigger, TriggerType } from '@activepieces/shared';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  MentionListItem,
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import {
  BuilderSelectors,
  FlowItem,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { ActionMetaService, FlowItemDetails } from '@activepieces/ui/common';

@Component({
  selector: 'app-piece-trigger-mention-item',
  templateUrl: './piece-trigger-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceTriggerMentionItemComponent implements OnInit {
  TriggerType = TriggerType;
  expandSample = false;
  @Input()
  set stepMention(val: MentionListItem & { step: FlowItem }) {
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
  }>;
  fetching$: Subject<boolean> = new Subject();
  isPollingTrigger$: Observable<boolean>;
  constructor(
    private store: Store,
    private actionMetaDataService: ActionMetaService,
    private mentionsTreeCache: MentionsTreeCacheService
  ) {}
  ngOnInit(): void {
    const cachedResult: undefined | MentionTreeNode[] = this.getChachedData();
    this.isPollingTrigger$ = this.checkIfItIsPollingTrigger();
    if (cachedResult) {
      this.sampleData$ = combineLatest({
        stepTree: of({ children: cachedResult, error: '' }),
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
          };
        })
      );
    } else {
      this.fetchSampleData();
    }

    this.flowItemDetails$ = this.store.select(
      BuilderSelectors.selectFlowItemDetails(this._stepMention.step)
    );
  }
  getChachedData() {
    const step = this._stepMention.step;
    let cachedResult: undefined | MentionTreeNode[] = undefined;
    if (
      step.type === TriggerType.PIECE &&
      step.settings.inputUiInfo.currentSelectedData
    ) {
      cachedResult = traverseStepOutputAndReturnMentionTree(
        step.settings.inputUiInfo.currentSelectedData,
        step.name,
        step.displayName
      )?.children;
    } else {
      cachedResult = this.mentionsTreeCache.getStepMentionsTree(
        step.name
      )?.children;
    }
    return cachedResult;
  }
  fetchSampleData() {
    const step = this._stepMention.step;
    if (step.type !== TriggerType.PIECE) {
      throw new Error("Activepieces- step isn't of a piece type");
    }
    const { pieceName, pieceVersion } = step.settings;
    this.sampleData$ = this.actionMetaDataService
      .getPieceMetadata(pieceName, pieceVersion)
      .pipe(
        tap(() => {
          this.fetching$.next(true);
        }),
        map((pieceMetadata) => {
          return step.settings.triggerName
            ? pieceMetadata.triggers[step.settings.triggerName].sampleData ?? {}
            : {};
        }),
        map((sampleData) => {
          const childrenNodes = traverseStepOutputAndReturnMentionTree(
            sampleData,
            step.name,
            step.displayName
          ).children;
          return childrenNodes;
        }),
        map((res) => {
          if (!res || res.length === 0) {
            const error = this.getErrorMessage();
            return { error: error, children: [] };
          }
          return { children: res, error: '' };
        }),
        tap((res) => {
          if (!res.error) {
            this.mentionsTreeCache.setStepMentionsTree(step.name, {
              children: res.children,
            });
          }
          this.fetching$.next(false);
        }),
        switchMap((res) => {
          if (res.error) {
            return combineLatest({
              stepTree: of({ children: [], error: res.error }),
              search: this.mentionsTreeCache.listSearchBarObs$,
            });
          }
          return combineLatest({
            stepTree: of({ children: res.children, error: res.error }),
            search: this.mentionsTreeCache.listSearchBarObs$,
          });
        }),
        map((res) => {
          const markedNodesToShow = this.mentionsTreeCache.markNodesToShow(
            step.name,
            res.search
          );
          return {
            children: res.stepTree.children,
            error: '',
            markedNodesToShow: markedNodesToShow,
          };
        }),
        shareReplay(1)
      );
  }

  private getErrorMessage() {
    const noSampleData = `No sample available`;
    const error = !this._stepMention.step.settings.triggerName
      ? `Please select a trigger`
      : noSampleData;
    return error;
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
              res.triggers[this._stepMention.step.settings.triggerName].type ===
                TriggerStrategy.POLLING &&
              this._stepMention.step.settings.pieceName !== 'schedule'
            );
          }
          return false;
        })
      );
  }
  selectStep() {
    this.store.dispatch(
      FlowsActions.selectStepByName({ stepName: this._stepMention.step.name })
    );
  }
}
