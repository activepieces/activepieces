import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

import { combineLatest, map, Observable, of } from 'rxjs';
import { ActionType } from '@activepieces/shared';

import {
  CHEVRON_SPACE_IN_MENTIONS_LIST,
  FIRST_LEVEL_PADDING_IN_MENTIONS_LIST,
  MentionListItem,
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';

import { FlowItem } from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { canvasActions } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-code-step-mention-item',
  templateUrl: './code-step-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeStepMentionItemComponent implements OnInit {
  readonly CHEVRON_SPACE_IN_MENTIONS_LIST = CHEVRON_SPACE_IN_MENTIONS_LIST;
  readonly FIRST_LEVEL_PADDING_IN_MENTIONS_LIST =
    FIRST_LEVEL_PADDING_IN_MENTIONS_LIST;
  @Input() stepMention: MentionListItem & { step: FlowItem };
  @Input() stepIndex: number;
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  expandCodeCollapse = false;
  codeStepTest$: Observable<{
    children?: MentionTreeNode[];
    value?: unknown;
    markedNodesToShow: Map<string, boolean>;
  }>;
  constructor(
    private mentionsTreeCache: MentionsTreeCacheService,
    private store: Store
  ) {}
  ngOnInit(): void {
    const cacheResult = this.getChachedData();
    this.mentionsTreeCache.setStepMentionsTree(this.stepMention.step.name, {
      children: cacheResult?.children || [],
      value: cacheResult?.value,
    });

    if (cacheResult) {
      this.codeStepTest$ = combineLatest({
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
  getChachedData() {
    const step = this.stepMention.step;
    let cachedResult: undefined | MentionTreeNode = undefined;
    if (
      step.type === ActionType.CODE &&
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
