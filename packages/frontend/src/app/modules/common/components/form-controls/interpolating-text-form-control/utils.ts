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

export function fromTextToOps(text: string): {
	ops: (TextInsertOperation | MentionInsertOperation)[];
} {
	var regex = /(\$\{.*?\})/;
	var matched = text.split(regex).filter(el => el);
	var ops: (TextInsertOperation | MentionInsertOperation)[] = matched.map(item => {
		if (item.length > 3 && item[0] === '$' && item[1] === '{' && item[item.length - 1] === '}') {
			return {
				insert: {
					mention: {
						value: replaceArrayNotationsWithSpaces(replaceDotsWithSpaces(item.slice(2, item.length - 1))),
						denotationChar: '',
					},
				},
			};
		} else {
			return { insert: item };
		}
	});
	return { ops: ops };
}

interface MentionInsertOperation {
	insert: {
		mention: {
			value: string;
		};
	};
}
interface TextInsertOperation {
	insert: string;
}

export interface QuillEditorOperationsObject {
	ops: (MentionInsertOperation | TextInsertOperation)[];
}

export function fromOpsToText(operations: QuillEditorOperationsObject) {
	const result = operations.ops
		.map(singleInsertOperation => {
			if (typeof singleInsertOperation.insert === 'string') {
				return singleInsertOperation.insert;
			} else {
				return `\${${replaceSpacesWithDots(
					replaceDigitsTextWithArrayNotation(singleInsertOperation.insert.mention.value)
				)}}`;
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
const digitsRegexWithTrailingSpace = / [0-9]+/g;
function replaceDigitsTextWithArrayNotation(str: string) {
	return str.replace(digitsRegexWithTrailingSpace, foundDigitsWithTrailingSpace => {
		const digitsWithoutTrailingSpace = foundDigitsWithTrailingSpace.slice(1);
		return `[${digitsWithoutTrailingSpace}]`;
	});
}
const spaceRegex = / /g;
function replaceSpacesWithDots(str: string) {
	return str.replace(spaceRegex, '.');
}
