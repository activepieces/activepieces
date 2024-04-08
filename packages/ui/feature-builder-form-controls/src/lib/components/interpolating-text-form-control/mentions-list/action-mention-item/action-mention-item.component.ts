import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { combineLatest, map, Observable, of, tap } from 'rxjs';
import { ActionType } from '@activepieces/shared';
import {
  CHEVRON_SPACE_IN_MENTIONS_LIST,
  FIRST_LEVEL_PADDING_IN_MENTIONS_LIST,
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import { Step } from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { canvasActions } from '@activepieces/ui/feature-builder-store';
import { MentionListItem } from '@activepieces/ui/common';
@Component({
  selector: 'app-action-mention-item',
  templateUrl: './action-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMentionItemComponent implements OnInit {
  readonly CHEVRON_SPACE_IN_MENTIONS_LIST = CHEVRON_SPACE_IN_MENTIONS_LIST;
  readonly FIRST_LEVEL_PADDING_IN_MENTIONS_LIST =
    FIRST_LEVEL_PADDING_IN_MENTIONS_LIST;
  @Input() stepMention: MentionListItem & { step: Step };
  @Input() stepIndex: number;
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  expandCodeCollapse = false;
  actionTest$: Observable<{
    children?: MentionTreeNode[];
    value?: unknown;
    markedNodesToShow: Map<string, boolean>;
  }>;
  customPathDialogClosed$: Observable<MentionListItem | undefined>;
  search$: Observable<string>;
  constructor(
    private mentionsTreeCache: MentionsTreeCacheService,
    private store: Store
  ) {}
  ngOnInit(): void {
    const cacheResult = this.getCachedData();
    this.mentionsTreeCache.setStepMentionsTree(this.stepMention.step.name, {
      children: cacheResult?.children || [],
      value: cacheResult?.value,
    });
    this.search$ = this.mentionsTreeCache.listSearchBarObs$.pipe(
      tap((res) => {
        this.expandCodeCollapse = !!res;
      })
    );
    if (cacheResult) {
      this.actionTest$ = combineLatest({
        stepTree: of({
          children: cacheResult?.children || [],
          value: cacheResult?.value,
        }),
        search: this.mentionsTreeCache.listSearchBarObs$,
      }).pipe(
        map((res) => {
          const markedNodesToShow = this.mentionsTreeCache.markNodesToShow(
            this.stepMention.step.name,
            res.search
          );
          return {
            children: res.stepTree.children,
            markedNodesToShow: markedNodesToShow,
            value: res.stepTree.value,
          };
        })
      );
    }
  }

  emitMention(mentionListItem: MentionListItem) {
    this.mentionClicked.emit(mentionListItem);
  }

  getCachedData() {
    const step = this.stepMention.step;
    let cachedResult: undefined | MentionTreeNode = undefined;
    if (
      (step.type === ActionType.CODE ||
        step.type === ActionType.LOOP_ON_ITEMS ||
        step.type === ActionType.PIECE) &&
      step.settings.inputUiInfo?.currentSelectedData !== undefined
    ) {
      cachedResult = traverseStepOutputAndReturnMentionTree(
        step.settings.inputUiInfo.currentSelectedData,
        step.name,
        step.displayName
      );
    }
    return cachedResult;
  }
  selectStep() {
    this.store.dispatch(
      canvasActions.selectStepByName({ stepName: this.stepMention.step.name })
    );
  }
}
