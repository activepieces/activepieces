import { FormControl, FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { ErrorStateMatcher, mixinErrorState } from '@angular/material/core';
import { Subject } from 'rxjs';

export const QuillMaterialBase = mixinErrorState(
	class {
		/**
		 * Emits whenever the component state changes and should cause the parent
		 * form field to update. Implemented as part of `MatFormFieldControl`.
		 * @docs-private
		 */
		readonly stateChanges = new Subject<void>();

		constructor(
			public _defaultErrorStateMatcher: ErrorStateMatcher,
			public _parentForm: NgForm,
			public _parentFormGroup: FormGroupDirective,
			/**
			 * Form control bound to the component.
			 * Implemented as part of `MatFormFieldControl`.
			 * @docs-private
			 */
			public ngControl: NgControl
		) {}
	}
);

export class CustomErrorMatcher implements ErrorStateMatcher {
	isErrorState(control: FormControl): boolean {
		return control.dirty && control.invalid;
	}
}

export function fromTextToOps(
	text: string,
	allStepsNamesAndDisplayNames: { displayName: string; name: string }[]
): {
	ops: (TextInsertOperation | InsertMentionOperation)[];
} {
	var regex = /(\$\{.*?\})/;
	var matched = text.split(regex).filter(el => el);
	var ops: (TextInsertOperation | InsertMentionOperation)[] = matched.map(item => {
		if (item.length > 3 && item[0] === '$' && item[1] === '{' && item[item.length - 1] === '}') {
			const itemPath = item.slice(2, item.length - 1);
			const adjustedItemPath = adjustItemPath(itemPath, allStepsNamesAndDisplayNames);
			return {
				insert: {
					mention: {
						value: replaceArrayNotationsWithSpaces(replaceDotsWithSpaces(adjustedItemPath)),
						denotationChar: '',
						serverValue: item,
					},
				},
			};
		} else {
			return { insert: item };
		}
	});
	return { ops: ops };
}

function adjustItemPath(itemPath: string, allStepsNamesAndDisplayNames: { displayName: string; name: string }[]) {
	const itemPrefix = itemPath.split('.')[0];
	if (itemPrefix === 'configs') {
		return itemPath.replace('configs.', '');
	} else {
		const stepDisplayName = allStepsNamesAndDisplayNames.find(s => s.name === itemPrefix)?.displayName;
		if (stepDisplayName) {
			return itemPath.replace(itemPrefix, stepDisplayName);
		}
		return itemPath;
	}
}
export interface InsertMentionOperation {
	insert: {
		mention: {
			value: string;
			serverValue: string;
			denotationChar: string;
		};
	};
}
export interface TextInsertOperation {
	insert: string;
}

export interface QuillEditorOperationsObject {
	ops: (InsertMentionOperation | TextInsertOperation)[];
}

export function fromOpsToText(operations: QuillEditorOperationsObject) {
	const result = operations.ops
		.map(singleInsertOperation => {
			if (typeof singleInsertOperation.insert === 'string') {
				return singleInsertOperation.insert;
			} else {
				return singleInsertOperation.insert.mention.serverValue;
			}
		})
		.join('');
	console.log(result);
	return result;
}
const dotRegex = /\./g;
function replaceDotsWithSpaces(str: string) {
	return str.replace(dotRegex, ' ');
}
const arrayNotationRegex = /\[[0-9]+\]/g;
function replaceArrayNotationsWithSpaces(str: string) {
	return str.replace(arrayNotationRegex, foundArrayNotation => {
		const indexOfArrayWitoutBrackets = foundArrayNotation.slice(1, foundArrayNotation.length - 1);
		return ` ${indexOfArrayWitoutBrackets}`;
	});
}

export interface MentionTreeNode {
	propertyPath: string;
	key: string;
	children?: MentionTreeNode[];
}
/**Traverses an object to find its child properties and their paths, stepOutput has to be an object on first invocation */
export function traverseStepOutputAndReturnMentionTree(
	stepOutput: unknown,
	path: string,
	lastKey: string
): MentionTreeNode {
	if (stepOutput && typeof stepOutput === 'object') {
		return {
			propertyPath: path,
			key: lastKey,
			children: Object.keys(stepOutput).map(k => {
				const newPath = Array.isArray(stepOutput) ? `${path}[${k}]` : `${path}.${k}`;
				return traverseStepOutputAndReturnMentionTree(stepOutput[k], newPath, k);
			}),
		};
	} else {
		return { propertyPath: path, key: lastKey };
	}
}
