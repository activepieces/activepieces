import { NestedTreeControl } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { fadeIn400ms } from '../../../../../animation/fade-in.animations';
import {
	arrayNotationRegex,
	MentionListItem,
	MentionTreeNode,
	replaceArrayNotationsWithSpaces,
	replaceDotsWithSpaces,
} from '../../utils';

@Component({
	selector: 'app-step-mentions-tree',
	templateUrl: './step-mentions-tree.component.html',
	styleUrls: ['./step-mentions-tree.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [fadeIn400ms]
})
export class StepMentionsListComponent implements OnInit {
	@Input() stepOutputObjectChildNodes: MentionTreeNode[] = [];
	@Input() stepDisplayName: string;
	@Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
	treeControl = new NestedTreeControl<MentionTreeNode>(node => node.children);
	dataSource = new MatTreeNestedDataSource<MentionTreeNode>();
	hasChild = (_: number, node: MentionTreeNode) => {
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
		const arrayNotationNextToStep = splitPath[0].match(arrayNotationRegex);
		const newPathHead = stepName + (arrayNotationNextToStep !== null ? arrayNotationNextToStep![0] : '');
		return [newPathHead, ...splitPath.slice(1)].join('.');
	}
}
