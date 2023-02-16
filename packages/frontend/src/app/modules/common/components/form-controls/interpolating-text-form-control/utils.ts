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
		) { }
	}
);

export class CustomErrorMatcher implements ErrorStateMatcher {
	isErrorState(control: FormControl): boolean {
		return control.touched && control.invalid;
	}
}

export function fromTextToOps(
	text: string,
	allStepsNamesAndDisplayNames: { displayName: string; name: string }[]
): {
	ops: (TextInsertOperation | InsertMentionOperation)[];
} {
	try {
		const regex = /(\$\{.*?\})/;
		const matched = text.split(regex).filter(el => el);
		const ops: (TextInsertOperation | InsertMentionOperation)[] = matched.map(item => {
			if (item.length > 3 && item[0] === '$' && item[1] === '{' && item[item.length - 1] === '}') {
				const itemPathWithoutInterpolationDenotation = item.slice(2, item.length - 1);
				const mentionText = replaceArrayNotationsWithSpaces(
					replaceDotsWithSpaces(adjustItemPath(itemPathWithoutInterpolationDenotation, allStepsNamesAndDisplayNames))
				);
				return {
					insert: {
						mention: {
							value: mentionText,
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
	} catch (err) {
		console.error(text);
		console.error(err);
		throw err;
	}

}

function adjustItemPath(itemPath: string, allStepsNamesAndDisplayNames: { displayName: string; name: string }[]) {
	const itemPrefix = itemPath.split('.')[0];
	if (itemPrefix === 'configs') {
		//remove configs prefix
		return itemPath.replace('configs.', '');
	} else if (itemPrefix === 'connections') {
		return itemPath.replace('connections.', '');
	} else {
		//replace stepName with stepDisplayName
		const stepDisplayName = replaceStepNameWithDisplayName(itemPrefix, allStepsNamesAndDisplayNames);
		return [stepDisplayName, ...itemPath.split('.').slice(1)].join('.');
	}
}
function replaceStepNameWithDisplayName(
	stepName: string,
	allStepsNamesAndDisplayNames: { displayName: string; name: string }[]
) {
	//search without array notation
	const stepDisplayName = allStepsNamesAndDisplayNames.find(
		s => s.name === stepName.replace(arrayNotationRegex, '')
	)?.displayName;
	if (stepDisplayName) {
		const arrayNotationInStepName = stepName.match(arrayNotationRegex);
		if (arrayNotationInStepName === null) return stepDisplayName;
		return stepDisplayName + ' ' + arrayNotationInStepName[0].slice(1, arrayNotationInStepName[0].length - 1);
	}
	throw new Error(`step not found ${stepName}`);
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
	return result;
}
const dotRegex = /\./g;
export function replaceDotsWithSpaces(str: string) {
	return str.replace(dotRegex, ' ');
}
export const arrayNotationRegex = /\[[0-9]+\]/g;
export function replaceArrayNotationsWithSpaces(str: string) {
	return str.replace(arrayNotationRegex, foundArrayNotation => {
		const indexOfArrayWitoutBrackets = foundArrayNotation.slice(1, foundArrayNotation.length - 1);
		return ` ${indexOfArrayWitoutBrackets}`;
	});
}

export interface MentionTreeNode {
	propertyPath: string;
	key: string;
	children?: MentionTreeNode[];
	value?: string | unknown;
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
				const newKey = Array.isArray(stepOutput) ? `${lastKey} ${k}` : k;
				return traverseStepOutputAndReturnMentionTree(stepOutput[k], newPath, newKey);
			}),
			value: Object.keys(stepOutput).length === 0 ? "Empty List" : undefined
		};
	} else {
		const value = formatStepOutput(stepOutput);
		return { propertyPath: path, key: lastKey, value: value };
	}
}

export interface MentionListItem {
	label: string;
	value: string;
}

function formatStepOutput(stepOutput: unknown) {
	if (stepOutput === null) {
		return "null";
	}
	if (stepOutput === undefined) {
		return "undefined";
	}
	if (typeof stepOutput === "string") {
		return `\"${stepOutput}\"`;
	}

	return stepOutput;
}