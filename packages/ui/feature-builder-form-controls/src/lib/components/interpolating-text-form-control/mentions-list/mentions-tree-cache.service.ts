import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MentionTreeNode } from '../utils';

type StepName = string;

@Injectable({
  providedIn: 'root',
})
export class MentionsTreeCacheService {
  private cache: Map<StepName, { children: MentionTreeNode[]; value?: any }> =
    new Map();
  listSearchBarObs$: Observable<string>;
  getStepMentionsTree(stepName: string) {
    return this.cache.get(stepName);
  }
  setStepMentionsTree(
    stepName: string,
    val: { children: MentionTreeNode[]; value?: unknown }
  ) {
    this.cache.set(stepName, val);
  }
  searchForSubstringInKeyOrValue(stepName: string, substr: string): boolean {
    const tree = this.getStepMentionsTree(stepName);
    if (tree) {
      if (
        tree.value &&
        String(tree.value).toLowerCase().includes(substr.toLowerCase())
      ) {
        return true;
      } else {
        return this.searchTreeForSubstr(tree.children, substr);
      }
    }
    return false;
  }

  markNodesToShow(stepName: string, substr: string): Map<string, boolean> {
    const tree = this.getStepMentionsTree(stepName);
    if (tree) {
      const markedNodesToShow = new Map<string, boolean>();
      this._markNodesToShow(tree.children, substr, markedNodesToShow);
      return markedNodesToShow;
    }
    return new Map<string, boolean>();
  }
  private searchTreeForSubstr(
    tree: MentionTreeNode[],
    substr: string
  ): boolean {
    for (const node of tree) {
      if (
        node.propertyPath.toLowerCase().includes(substr.toLowerCase()) ||
        (node.value &&
          JSON.stringify(node.value)
            .toLowerCase()
            .includes(substr.toLowerCase()))
      ) {
        return true;
      }
      if (node.children && this.searchTreeForSubstr(node.children, substr)) {
        return true;
      }
    }
    return false;
  }

  private _markNodesToShow(
    tree: (MentionTreeNode & { show?: boolean })[],
    substr: string,
    markedNodesToShow: Map<string, boolean>
  ): void {
    for (const node of tree) {
      const nodePathContainsSubstring = node.propertyPath
        .toLowerCase()
        .includes(substr.toLowerCase());
      const nodeValueContainsSubstring = node.value
        ? JSON.stringify(node.value)
            .toLowerCase()
            .includes(substr.toLocaleLowerCase())
        : false;
      markedNodesToShow.set(
        node.propertyPath,
        nodePathContainsSubstring || nodeValueContainsSubstring
      );
      if (node.children) {
        this._markNodesToShow(node.children, substr, markedNodesToShow);
        const showAnyChild = node.children.some((c) =>
          markedNodesToShow.get(c.propertyPath)
        );
        markedNodesToShow.set(
          node.propertyPath,
          nodePathContainsSubstring || showAnyChild
        );
      }
    }
  }
  clearStepCache(stepName: string) {
    return this.cache.delete(stepName);
  }
}
