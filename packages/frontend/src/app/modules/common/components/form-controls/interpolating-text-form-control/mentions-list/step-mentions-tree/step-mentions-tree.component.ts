import { NestedTreeControl } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { MentionListItem, MentionTreeNode, replaceArrayNotationsWithSpaces, replaceDotsWithSpaces } from '../../utils';

@Component({
	selector: 'app-step-mentions-tree',
	templateUrl: './step-mentions-tree.component.html',
	styleUrls: ['./step-mentions-tree.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepMentionsListComponent implements OnInit {
	@Input() stepOutputObjectChildNodes: MentionTreeNode[] = [];
	@Input() stepDisplayName: string;
	@Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
	treeControl = new NestedTreeControl<MentionTreeNode>(node => node.children);
	dataSource = new MatTreeNestedDataSource<MentionTreeNode>();
	hasChild = (_: number, node: MentionTreeNode) => {
		debugger;
		return !!node.children && node.children.length > 0;
	};
	ngOnInit() {
		this.dataSource.data = this.stepOutputObjectChildNodes;
	}
	mentionTreeNodeClicked(node: MentionTreeNode) {
		const mentionListItem = {
			value: `\${${node.propertyPath}}`,
			label: replaceArrayNotationsWithSpaces(
				replaceDotsWithSpaces(this.replaceStepNameWithDisplayNameInPath(node.propertyPath, this.stepDisplayName))
			),
		};

		this.mentionClicked.emit(mentionListItem);
	}
	replaceStepNameWithDisplayNameInPath(nodePath: string, stepName: string) {
		const splitPath = nodePath.split('.');
		return [stepName, ...splitPath.slice(1)].join('.');
	}
}
