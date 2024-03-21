import { FlatTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { map, Observable, tap } from 'rxjs';
import {
  CHEVRON_SPACE_IN_MENTIONS_LIST,
  FIRST_LEVEL_PADDING_IN_MENTIONS_LIST,
  keysWithinPath,
  MAX_ARRAY_LENGTH_BEFORE_SLICING,
  MentionTreeNode,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import { MentionListItem } from '@activepieces/ui/common';

type MentionTreeNodeWithUiInfo = MentionTreeNode & {
  level: number;
  expandable: boolean;
};
@Component({
  selector: 'app-step-mentions-tree',
  templateUrl: './step-mentions-tree.component.html',
  styleUrls: ['./step-mentions-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepMentionsTreeComponent implements OnInit {
  readonly CHEVRON_SPACE_IN_MENTIONS_LIST = CHEVRON_SPACE_IN_MENTIONS_LIST;
  readonly FIRST_LEVEL_PADDING_IN_MENTIONS_LIST =
    FIRST_LEVEL_PADDING_IN_MENTIONS_LIST;
  @Input() stepOutputObjectChildNodes: MentionTreeNode[] = [];
  @Input() stepDisplayName: string;
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  @Input() markedNodesToShow: Map<string, boolean> | undefined;
  search$: Observable<string>;
  treeControl = new FlatTreeControl<MentionTreeNodeWithUiInfo>(
    (node) => node.level,
    (node) => node.expandable
  );
  private _transformer = (node: MentionTreeNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      ...node,
      level: level,
    };
  };
  treeFlattener = new MatTreeFlattener<
    MentionTreeNode,
    MentionTreeNodeWithUiInfo
  >(
    this._transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  dataSource = new MatTreeFlatDataSource<
    MentionTreeNode,
    MentionTreeNodeWithUiInfo
  >(this.treeControl, this.treeFlattener);
  searchContainsStepDisplayName$: Observable<boolean>;
  currentlyTypedTextInSearchBar = '';
  constructor(public mentionsTreeCacheService: MentionsTreeCacheService) {
    this.search$ = this.mentionsTreeCacheService.listSearchBarObs$.pipe(
      tap((res) => {
        if (res) {
          this.dataSource.data = this.stepOutputObjectChildNodes;
          const childrenCount = this.calculateChildren(
            this.stepOutputObjectChildNodes
          );
          if (childrenCount <= MAX_ARRAY_LENGTH_BEFORE_SLICING) {
            this.treeControl.expandAll();
          }
        } else {
          this.treeControl.collapseAll();
        }
      })
    );
    this.searchContainsStepDisplayName$ =
      this.mentionsTreeCacheService.listSearchBarObs$.pipe(
        tap((search) => {
          this.currentlyTypedTextInSearchBar = search;
        }),
        map((search) => {
          return this.stepDisplayName
            .toLowerCase()
            .includes(search.toLowerCase());
        })
      );
  }
  hasChild = (_: number, node: MentionTreeNode) => {
    return (
      !!node.children &&
      node.children.length > 0 &&
      (this.nodeMarkedToShow(_, node) ||
        this.stepDisplayName
          .toLowerCase()
          .includes(this.currentlyTypedTextInSearchBar.toLowerCase()))
    );
  };
  nodeMarkedToShow = (_: number, node: MentionTreeNode) => {
    return this.markedNodesToShow?.get(node.propertyPath);
  };
  ngOnInit() {
    this.dataSource.data = this.stepOutputObjectChildNodes;
  }
  mentionTreeNodeClicked(node: MentionTreeNode) {
    const label = [
      this.stepDisplayName,
      ...keysWithinPath(node.propertyPath).slice(1),
    ].join(' ');
    const mentionListItem = {
      value: `{{${node.propertyPath}}}`,
      label,
    };
    this.mentionClicked.emit(mentionListItem);
  }

  calculateChildren(children: MentionTreeNode[]): number {
    return children.reduce((acc, child) => {
      return (
        acc + (child.children ? this.calculateChildren(child.children) : 0)
      );
    }, children.length);
  }
}
