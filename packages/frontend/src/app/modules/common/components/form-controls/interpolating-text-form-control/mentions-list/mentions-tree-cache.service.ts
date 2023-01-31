import { Injectable } from '@angular/core';
import { MentionTreeNode } from '../utils';

type StepName = string;

@Injectable({
	providedIn: 'root',
})
export class MentionsTreeCacheService {
	cache: Map<StepName, { children: MentionTreeNode[], value?: any }> = new Map();
	constructor() { }
	getStepMentionsTree(stepName: string) {
		return this.cache.get(stepName);
	}
	setStepMentionsTree(stepName: string, val: { children: MentionTreeNode[], value?: any }) {
		this.cache.set(stepName, val);
	}
}
