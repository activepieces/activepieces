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
import {
  ActionType,
  PieceAction,
  PieceTrigger,
  TriggerType,
} from '@activepieces/shared';
import {
  MentionListItem,
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import { ActionMetaService } from '../../../../../../flow-builder/service/action-meta.service';
import { FlowItemDetails } from '../../../../../../flow-builder/page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { BuilderSelectors } from '../../../../../../flow-builder/store/builder/builder.selector';
import { FlowItem } from '../../../../../model/flow-builder/flow-item';

@Component({
  selector: 'app-piece-step-mention-item',
  templateUrl: './piece-step-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceStepMentionItemComponent implements OnInit {
  TriggerType = TriggerType;
  expandSample = false;
  @Input()
  set stepMention(val: MentionListItem & { step: FlowItem }) {
    if (
      val.step.type !== ActionType.PIECE &&
      val.step.type !== TriggerType.PIECE
    ) {
      throw new Error('Step is not a piece action nor a piece trigger');
    }
    this._stepMention = val as MentionListItem & {
      step: PieceTrigger | PieceAction;
    };
  }
  _stepMention: MentionListItem & { step: PieceTrigger | PieceAction };
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  @Input() stepIndex: number;
  flowItemDetails$: Observable<FlowItemDetails | undefined>;
  sampleData$: Observable<{
    children: MentionTreeNode[] | undefined;
    error: string;
    markedNodesToShow: Map<string, boolean>;
  }>;
  fetching$: Subject<boolean> = new Subject();
  noSampleDataNote$: Observable<string>;

  constructor(
    private store: Store,
    private actionMetaDataService: ActionMetaService,
    private mentionsTreeCache: MentionsTreeCacheService
  ) {}
  ngOnInit(): void {
    const cachedResult: undefined | MentionTreeNode[] = this.getChachedData();
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
    if (step.type !== TriggerType.PIECE && step.type !== ActionType.PIECE) {
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
          if (step.type === TriggerType.PIECE) {
            return step.settings.triggerName
              ? pieceMetadata.triggers[step.settings.triggerName].sampleData ??
                  {}
              : {};
          } else {
            return step.settings.actionName
              ? pieceMetadata.actions[step.settings.actionName].sampleData ?? {}
              : {};
          }
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
    const actionOrTirggerText =
      this._stepMention.step.type === ActionType.PIECE ? 'action' : 'trigger';
    const triggerName =
      this._stepMention.step.type === TriggerType.PIECE
        ? this._stepMention.step.settings.triggerName
        : '';
    const actionName =
      this._stepMention.step.type === ActionType.PIECE
        ? this._stepMention.step.settings.actionName
        : '';
    const noSampleData = `No sample available`;
    const error =
      !triggerName && !actionName
        ? `Please select ${
            actionOrTirggerText === 'action' ? 'an action' : 'a trigger'
          } `
        : noSampleData;
    return error;
  }
}
