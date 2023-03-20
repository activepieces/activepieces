import { Component, EventEmitter, Input, Output } from '@angular/core';
import { map, Observable } from 'rxjs';
import { FlowItem } from '../../../../../model/flow-builder/flow-item';
import {
  MentionListItem,
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';

@Component({
  selector: 'app-loop-step-mention-item',
  templateUrl: './loop-step-mention-item.component.html',
})
export class LoopStepMentionItemComponent {
  expandCodeCollapse = false;
  @Input() stepMention: MentionListItem & { step: FlowItem };
  @Input() stepIndex: number;
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  mentionsItems = {
    current_iteration: 0,
    current_item: 'current_element',
  };
  mentionItemsToShow$: Observable<{
    children: MentionTreeNode[];
    markedNodesToShow: Map<string, boolean>;
  }>;
  constructor(private mentionsTreeCache: MentionsTreeCacheService) {
    this.mentionItemsToShow$ = this.mentionsTreeCache.listSearchBarObs$.pipe(
      map((search) => {
        const markedNodesToShow = this.mentionsTreeCache.markNodesToShow(
          this.stepMention.step.name,
          search
        );
        const childrenNodes = traverseStepOutputAndReturnMentionTree(
          this.mentionsItems,
          this.stepMention.step.name,
          this.stepMention.step.displayName
        ).children!;
        return {
          children: childrenNodes,
          markedNodesToShow: markedNodesToShow,
        };
      })
    );
  }
  emitMention(mentionListItem: MentionListItem) {
    this.mentionClicked.emit(mentionListItem);
  }
}
