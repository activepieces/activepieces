import { NestedTreeControl } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { MentionTreeNode } from '../../utils';

@Component({
	selector: 'app-step-mentions-list',
	templateUrl: './step-mentions-list.component.html',
	styleUrls: ['./step-mentions-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepMentionsListComponent {
	@Input() stepOutputObjectChildNodes: MentionTreeNode[] = [];
	treeControl = new NestedTreeControl<MentionTreeNode>(node => node.children);
	dataSource = new MatTreeNestedDataSource<MentionTreeNode>();
	hasChild = (_: number, node: MentionTreeNode) => !!node.children && node.children.length > 0;
	constructor() {
		this.dataSource.data = this.stepOutputObjectChildNodes;
	}
}
