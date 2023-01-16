import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
	ChangeDetectionStrategy,
	Component,
	DoCheck,
	HostBinding,
	Input,
	OnDestroy,
	OnInit,
	Optional,
	Self,
	ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroupDirective, NgControl, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import { lastValueFrom, Observable, Subject, take, tap } from 'rxjs';
import {
	CustomErrorMatcher,
	fromOpsToText,
	fromTextToOps,
	InsertMentionOperation,
	QuillEditorOperationsObject,
	QuillMaterialBase,
} from './utils';
import 'quill-mention';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';
@Component({
	selector: 'app-interpolating-text-form-control',
	templateUrl: './interpolating-text-form-control.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: MatFormFieldControl,
			useExisting: InterpolatingTextFormControlComponent,
		},
		{
			provide: ErrorStateMatcher,
			useClass: CustomErrorMatcher,
		},
	],
})
export class InterpolatingTextFormControlComponent
	extends QuillMaterialBase
	implements OnInit, OnDestroy, DoCheck, MatFormFieldControl<string>, ControlValueAccessor
{
	readonly modules: QuillModules = {
		mention: {
			mentionDenotationChars: ['@'],
			allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
			onSelect: (item: any, insertItem: (arg0: any) => void) => {
				const editor = this.editor.quillEditor;
				insertItem(item);
				// necessary because quill-mention triggers changes as 'api' instead of 'user'
				editor.insertText(editor.getLength() - 1, '', 'user');
			},
			source: (searchTerm: string, renderList: (arg0: any[], arg1: any) => void) => {
				const values = [
					{ id: 1, value: 'Fredrik Sundqvist' },
					{ id: 2, value: 'Patrik Sjölin' },
				];

				if (searchTerm.length === 0) {
					renderList(values, searchTerm);
				} else {
					const matches: any[] = [];

					values.forEach(entry => {
						if (entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
							matches.push(entry);
						}
					});
					renderList(matches, searchTerm);
				}
			},
		},
		toolbar: false,
	};
	onChange!: (value: any) => void;
	onTouch!: () => void;
	editorFormControl: FormControl<QuillEditorOperationsObject>;
	valueChanges$!: Observable<any>;
	static nextId = 0;
	private _value: string = '';

	override stateChanges = new Subject<void>();
	@ViewChild(QuillEditorComponent, { static: true })
	editor!: QuillEditorComponent;
	@Input()
	set value(value: string) {
		this._value = value;
		setTimeout(async () => {
			const stepsNamesAndDisplayNames = await lastValueFrom(
				this.store.select(BuilderSelectors.selectAllFlowStepsNamesAndDisplayNames).pipe(take(1))
			);
			this.editorFormControl.setValue(fromTextToOps(this._value, stepsNamesAndDisplayNames));
		}, 1);
		this.stateChanges.next();
	}

	@HostBinding()
	id = `custom-form-field-id-${InterpolatingTextFormControlComponent.nextId++}`;

	@Input()
	set placeholder(value: string) {
		this._placeholder = value;
		this.stateChanges.next();
	}
	constructor(
		_defaultErrorStateMatcher: ErrorStateMatcher,
		@Optional() _parentForm: NgForm,
		@Optional() _parentFormGroup: FormGroupDirective,
		@Optional() @Self() ngControl: NgControl,
		private store: Store
	) {
		super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);
		if (this.ngControl != null) {
			this.ngControl.valueAccessor = this;
		}
		this.editorFormControl = new FormControl<QuillEditorOperationsObject>({ ops: [] }, { nonNullable: true });
	}

	ngOnInit(): void {
		this.valueChanges$ = this.editorFormControl.valueChanges.pipe(
			tap(val => {
				if (val.ops.length === 1 && val.ops[0].insert === '\n') {
					this._value = '';
					this.onChange('');
				} else {
					this._value = fromOpsToText(val);
					this.onChange(this._value);
				}
			})
		);
	}

	get value() {
		return this._value;
	}

	get placeholder() {
		return this._placeholder;
	}
	private _placeholder: string = '';

	focused: boolean = false;

	get empty(): boolean {
		return !this.value;
	}

	@HostBinding('class.floated')
	get shouldLabelFloat(): boolean {
		return this.focused || !this.empty;
	}

	@Input()
	get required(): boolean {
		return this._required ?? this.ngControl?.control?.hasValidator(Validators.required) ?? false;
	}
	set required(value: BooleanInput) {
		this._required = coerceBooleanProperty(value);
	}
	protected _required: boolean | undefined;
	@Input()
	disabled: boolean = false;

	controlType = 'custom-form-field';

	@HostBinding('attr.aria-describedby') describedBy = '';

	async writeValue(value: string) {
		const stepsNamesAndDisplayNames = await lastValueFrom(
			this.store.select(BuilderSelectors.selectAllFlowStepsNamesAndDisplayNames).pipe(take(1))
		);
		const parsedTextToOps = fromTextToOps(value, stepsNamesAndDisplayNames);
		this.editorFormControl.setValue(parsedTextToOps);
		this._value = value;
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}
	setDisabledState?(isDisabled: boolean): void {
		this.disabled = isDisabled;
		this.disabled
			? this.editorFormControl.disable({ emitEvent: false })
			: this.editorFormControl.enable({ emitEvent: false });
		this.stateChanges.next();
	}
	autofilled?: boolean | undefined = false;
	userAriaDescribedBy?: string | undefined;

	setDescribedByIds(ids: string[]): void {
		this.describedBy = ids.join(' ');
	}
	onContainerClick(): void {
		this.focusEditor();
	}

	focusEditor() {
		this.editor.quillEditor.focus();
	}

	ngDoCheck(): void {
		if (this.ngControl) {
			// We need to re-evaluate this on every change detection cycle, because there are some
			// error triggers that we can't subscribe to (e.g. parent form submissions). This means
			// that whatever logic is in here has to be super lean or we risk destroying the performance.
			this.updateErrorState();
		}
	}

	ngOnDestroy() {
		this.stateChanges.complete();
	}
	onBlur() {
		this.focused = false;
		this.stateChanges.next();
	}
	onFocus() {
		this.onTouch();
		this.focused = true;
		this.stateChanges.next();
	}

	addMention(mentionOp: InsertMentionOperation) {
		this.editor.quillEditor.getModule('mention').insertItem(mentionOp.insert.mention, true);
	}
}
