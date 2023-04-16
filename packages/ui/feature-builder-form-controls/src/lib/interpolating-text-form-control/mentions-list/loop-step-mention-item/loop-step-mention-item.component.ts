import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable, tap } from 'rxjs';
import {
  FIRST_LEVEL_PADDING_IN_MENTIONS_LIST,
  MentionListItem,
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import {
  CustomPathMentionDialogComponent,
  CustomPathMentionDialogData,
} from '../custom-path-mention-dialog/custom-path-mention-dialog.component';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import { FlowItem } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-loop-step-mention-item',
  templateUrl: './loop-step-mention-item.component.html',
})
export class LoopStepMentionItemComponent implements OnInit {
  readonly FIRST_LEVEL_PADDING_IN_MENTIONS_LIST =
    FIRST_LEVEL_PADDING_IN_MENTIONS_LIST;
  expandCodeCollapse = false;
  childrenNodes: MentionTreeNode[] = [];
  @Input() stepMention: MentionListItem & { step: FlowItem };
  @Input() stepIndex: number;
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  mentionsItems = {
    index: 0,
    item: 'Current Element',
  };
  customPathDialogClosed$: Observable<MentionListItem | undefined>;
  mentionItemsToShow$: Observable<{
    children: MentionTreeNode[];
    markedNodesToShow: Record<string, boolean>;
  }>;
  constructor(
    private mentionsTreeCache: MentionsTreeCacheService,
    private dialogService: MatDialog
  ) {
    this.mentionItemsToShow$ = this.mentionsTreeCache.listSearchBarObs$.pipe(
      map((search) => {
        const markedNodesToShow = this.mentionsTreeCache.markNodesToShow(
          this.stepMention.step.name,
          search
        );
        const itemsToShow: Record<string, boolean> = {};
        Array.from(markedNodesToShow.entries()).forEach((z) => {
          itemsToShow[z[0]] = z[1];
        });
        return {
          children: this.childrenNodes,
          markedNodesToShow: itemsToShow,
        };
      })
    );
  }
  ngOnInit(): void {
    this.childrenNodes = traverseStepOutputAndReturnMentionTree(
      this.mentionsItems,
      this.stepMention.step.name,
      this.stepMention.step.displayName
    ).children!;
    this.mentionsTreeCache.setStepMentionsTree(this.stepMention.step.name, {
      children: this.childrenNodes,
    });
  }
  emitMention(mentionListItem: MentionListItem) {
    this.mentionClicked.emit(mentionListItem);
  }
  openPathDialog() {
    const dialogData: CustomPathMentionDialogData = {
      defaultValue: `${this.stepMention.step.name}.item`,
      dialogTitle: 'Loop Item Path',
      entityName: 'loop item',
      placeHolder: `eg. ${this.stepMention.step.name}.item.x`,
      stepDisplayName: this.stepMention.step.displayName,
      stepName: `${this.stepMention.step.name}.item`,
    };
    this.customPathDialogClosed$ = this.dialogService
      .open(CustomPathMentionDialogComponent, { data: dialogData })
      .afterClosed()
      .pipe(
        tap((val) => {
          if (val) {
            this.emitMention(val);
          }
        })
      );
  }
  emitIndexMention() {
    this.mentionClicked.emit({
      label: `${this.stepMention.label} index`,
      value: `\${${this.stepMention.step.name}.index}`,
      logoUrl: this.stepMention.logoUrl,
    });
  }
}
