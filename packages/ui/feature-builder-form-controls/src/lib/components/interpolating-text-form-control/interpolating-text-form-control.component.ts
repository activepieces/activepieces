import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { QuillEditorComponent, QuillModule, QuillModules } from 'ngx-quill';
import {
  firstValueFrom,
  Observable,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  CustomErrorMatcher,
  enrichMentionDropdownWithIcons,
  fixSelection,
  fromOpsToText,
  fromTextToOps,
  keysWithinPath,
  QuillEditorOperationsObject,
  QuillMaterialBase,
} from './utils';
import 'quill-mention';

import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  EnrichedStepMetaDataForMentions,
} from '@activepieces/ui/feature-builder-store';
import {
  BLOT_NAME,
  InsertMentionOperation,
  UiCommonModule,
} from '@activepieces/ui/common';
import { CommonModule } from '@angular/common';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { isNil } from '@activepieces/shared';

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
  standalone: true,
  imports: [UiCommonModule, CommonModule, QuillModule],
})
export class InterpolatingTextFormControlComponent
  extends QuillMaterialBase
  implements
    OnInit,
    OnDestroy,
    DoCheck,
    MatFormFieldControl<string>,
    ControlValueAccessor
{
  static nextId = 0;
  @Input() insideMatField = true;
  formats = ['span', BLOT_NAME];
  @Input() onlyAllowOneMentionToBeAdded = false;
  @Output() editorFocused: EventEmitter<boolean> = new EventEmitter();
  @Input({ required: true })
  stepMetaDataForMentions: EnrichedStepMetaDataForMentions[] = [];
  _readOnly = false;
  private _placeholder = '';
  focused = false;
  hasMention = false;
  readonly modules: QuillModules = {
    mention: {
      spaceAfterInsert: false,
      mentionDenotationChars: ['@'],
      source: function (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        searchTerm: unknown,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        renderList: unknown,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mentionChar: unknown
      ) {
        return;
      },
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      blotName: 'apMention',
    },
    toolbar: false,
    keyboard: {
      bindings: { ['list autofill']: undefined },
    },
  };

  editorFormControl: FormControl<QuillEditorOperationsObject>;
  valueChanges$!: Observable<unknown>;
  private _value = '';
  autofilled?: boolean | undefined = false;
  userAriaDescribedBy?: string | undefined;
  override stateChanges = new Subject<void>();
  @ViewChild(QuillEditorComponent, { static: true })
  editor!: QuillEditorComponent;
  @Input()
  set value(value: string) {
    this._value = value;
    setTimeout(async () => {
      if (this._value) {
        const stepsMetaData = await firstValueFrom(
          this.store
            .select(BuilderSelectors.selectAllStepsForMentionsDropdown)
            .pipe(
              take(1),
              switchMap((steps) =>
                enrichMentionDropdownWithIcons(steps, this.pieceService)
              )
            )
        );
        if (
          !isNil(value) &&
          typeof this._value === 'string' &&
          this._value.length > 0
        )
          this.editorFormControl.setValue(
            fromTextToOps(this._value, stepsMetaData),
            { emitEvent: false }
          );
      }
      this.stateChanges.next();
    }, 1);
  }

  @HostBinding()
  id = `custom-form-field-id-${InterpolatingTextFormControlComponent.nextId++}`;

  @Input()
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  @Input()
  disabled = false;
  controlType = 'custom-form-field';
  /**Ngx-Quill emits onChange on initial rendering for some reason, so I need to add this and remove it later when I refactor this component */
  ignoreEmission = true;
  @HostBinding('attr.aria-describedby') describedBy = '';
  protected _required: boolean | undefined;
  onChange: (val: unknown) => void = () => {
    //ignore
  };
  onTouched: () => void = () => {
    //ignore
  };
  constructor(
    _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    @Optional() @Self() ngControl: NgControl,
    private store: Store,
    private pieceService: PieceMetadataService,
    private cd: ChangeDetectorRef
  ) {
    super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
    this.editorFormControl = new FormControl<QuillEditorOperationsObject>(
      { ops: [] },
      { nonNullable: true }
    );
  }

  ngOnInit(): void {
    this._readOnly = this.onlyAllowOneMentionToBeAdded;
    this.valueChanges$ = this.editorFormControl.valueChanges.pipe(
      tap((val: QuillEditorOperationsObject) => {
        if (this.ignoreEmission) {
          this.ignoreEmission = false;
          return;
        }
        if (val.ops.length === 1 && val.ops[0].insert === '\n') {
          this._value = '';
          this.onChange('');
        } else {
          //quill always ads \n at the end of the last operation so we must remove it
          const lastOp = val.ops.pop();
          if (lastOp) {
            if (typeof lastOp.insert === 'string') {
              if (lastOp.insert.endsWith('\n')) {
                lastOp.insert = lastOp.insert.slice(
                  0,
                  lastOp.insert.length - 1
                );
              }
            }
            val.ops.push(lastOp);
          }
          this.hasMention = val.ops.some(
            (o) => typeof o.insert === 'object' && o.insert.apMention
          );
          this._value = fromOpsToText(val);
          this.onChange(this._value);
        }
      })
    );
  }

  editorCreated(): void {
    this.removeDefaultTabKeyBinding();
  }

  private removeDefaultTabKeyBinding() {
    const module = this.editor.quillEditor.getModule('keyboard');
    delete module.bindings['9'];
  }

  get placeholder() {
    return this._placeholder;
  }

  get value() {
    return this._value;
  }

  get empty(): boolean {
    return !this.value;
  }
  get readOnly() {
    return this._readOnly;
  }
  @HostBinding('class.floated')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  @Input()
  get required(): boolean {
    return (
      this._required ??
      this.ngControl?.control?.hasValidator(Validators.required) ??
      false
    );
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }

  async writeValue(value: string) {
    this._value = value;
    if (!isNil(value) && typeof value === 'string' && value.length > 0) {
      const parsedTextToOps = fromTextToOps(
        value,
        this.stepMetaDataForMentions
      );
      this.hasMention = parsedTextToOps.ops.some(
        (o) => typeof o.insert === 'object' && o.insert.apMention
      );
      this.editorFormControl.setValue(parsedTextToOps, { emitEvent: false });
    } else {
      this.editorFormControl.setValue({ ops: [] }, { emitEvent: false });
    }
  }
  registerOnChange(fn: (val: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;

    this.disabled
      ? this.editorFormControl.disable({ emitEvent: false })
      : this.editorFormControl.enable({ emitEvent: false });
    this.stateChanges.next();
  }

  setDescribedByIds(ids: string[]): void {
    this.describedBy = ids.join(' ');
  }
  onContainerClick(): void {
    if (!this.focused) {
      this.focusEditor();
    }
  }

  public focusEditor() {
    setTimeout(() => {
      this.editor.quillEditor.focus();
      const selection = window.getSelection();
      if (
        selection &&
        selection.focusNode &&
        selection.focusNode.parentNode &&
        selection.type === 'Caret'
      ) {
        const classList: DOMTokenList | undefined = selection.focusNode
          .parentNode[
          'classList' as keyof ParentNode
        ] as unknown as DOMTokenList;

        if (classList && classList.contains('mention')) {
          fixSelection(selection.focusNode);
        }
      }
    });
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
    this.onTouched();
    this.focused = false;
    this.stateChanges.next();
  }
  onFocus() {
    this.focused = true;
    this.editorFocused.emit(true);
    this.stateChanges.next();
  }

  public async addMention(mentionOp: InsertMentionOperation) {
    this._readOnly = false;
    this.cd.markForCheck();

    setTimeout(async () => {
      const itemPathWithoutInterpolationDenotation =
        mentionOp.insert.apMention.serverValue.slice(
          2,
          mentionOp.insert.apMention.serverValue.length - 2
        );
      const keys = keysWithinPath(itemPathWithoutInterpolationDenotation);
      const stepName = keys[0];
      const stepMetaData = this.stepMetaDataForMentions.find(
        (s) => s.step.name === stepName
      );

      const indexInDfsTraversal = await firstValueFrom(
        this.store.select(BuilderSelectors.selectStepIndex(stepName))
      );
      if (indexInDfsTraversal > 0) {
        mentionOp.insert.apMention.value = `${indexInDfsTraversal}. ${mentionOp.insert.apMention.value}`;
      }
      mentionOp.insert.apMention.logoUrl = stepMetaData?.logoUrl;
      if (this.onlyAllowOneMentionToBeAdded) {
        this.editorFormControl.setValue({ ops: [mentionOp] });
      } else {
        this.editor.quillEditor
          .getModule('mention')
          .insertItem(mentionOp.insert.apMention, true);
      }

      this._readOnly = this.onlyAllowOneMentionToBeAdded;
      this.cd.markForCheck();
    }, 1);
  }
}
