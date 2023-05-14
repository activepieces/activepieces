import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { map, Observable, tap } from 'rxjs';
import {
  arrayNotationRegex,
  CHEVRON_SPACE_IN_MENTIONS_LIST,
  FIRST_LEVEL_PADDING_IN_MENTIONS_LIST,
  MentionListItem,
  MentionTreeNode,
  replaceArrayNotationsWithSpaces,
  replaceDotsWithSpaces,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';

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
  @Input() markedNodesToShow: Map<string, boolean>;
  treeControl = new NestedTreeControl<MentionTreeNode>((node) => node.children);
  dataSource = new MatTreeNestedDataSource<MentionTreeNode>();
  searchContainsStepDisplayName$: Observable<boolean>;
  currentlyTypedTextInSearchBar = '';
  constructor(public mentionsTreeCacheService: MentionsTreeCacheService) {
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
    return this.markedNodesToShow.get(node.propertyPath);
  };
  ngOnInit() {
    this.dataSource.data = this.stepOutputObjectChildNodes;
  }
  mentionTreeNodeClicked(node: MentionTreeNode) {
    const mentionListItem = {
      value: `{{${node.propertyPath}}}`,
      label: replaceArrayNotationsWithSpaces(
        replaceDotsWithSpaces(
          this.replaceStepNameWithDisplayNameInPath(
            node.propertyPath,
            this.stepDisplayName
          )
        )
      ),
    };
    this.mentionClicked.emit(mentionListItem);
  }
  replaceStepNameWithDisplayNameInPath(nodePath: string, stepName: string) {
    const splitPath = nodePath.split('.');
    const arrayNotationNextToStep = splitPath[0].match(arrayNotationRegex);
    const newPathHead =
      stepName +
      (arrayNotationNextToStep !== null ? arrayNotationNextToStep![0] : '');
    return [newPathHead, ...splitPath.slice(1)].join('.');
  }
}
