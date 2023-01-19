import { Injectable } from '@angular/core';
import { MentionTreeNode } from '../utils';

type StepName = string;

@Injectable({
	providedIn: 'root',
})
export class MentionsTreeCacheService {
	cache: Map<StepName, MentionTreeNode[]> = new Map();
	constructor() {}
	getStepMentionsTree(stepName: string) {
		return this.cache.get(stepName);
	}
	setStepMentionsTree(stepName: string, tree: MentionTreeNode[]) {
		this.cache.set(stepName, tree);
	}
}
