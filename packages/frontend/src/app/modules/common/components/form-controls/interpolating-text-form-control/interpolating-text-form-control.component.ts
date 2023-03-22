import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  SecurityContext,
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
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import { firstValueFrom, Observable, skip, Subject, take, tap } from 'rxjs';
import {
  CustomErrorMatcher,
  fromOpsToText,
  fromTextToOps,
  getImageTemplateForStepLogo,
  InsertMentionOperation,
  QuillEditorOperationsObject,
  QuillMaterialBase,
  TextInsertOperation,
} from './utils';
import 'quill-mention';
import './fixed-selection-mention';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../flow-builder/store/builder/builder.selector';
import { DomSanitizer } from '@angular/platform-browser';
import { StepMetaData } from '../../../../flow-builder/store/model/flow-items-details-state.model';

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
  implements
    OnInit,
    OnDestroy,
    DoCheck,
    MatFormFieldControl<string>,
    ControlValueAccessor
{
  static nextId = 0;
  @Input() insideMatField = true;
  @Input() onlyAllowOneMentionToBeAdded = false;
  private _readOnly = false;
  private _placeholder = '';
  focused = false;
  readonly modules: QuillModules = {
    mention: {
      spaceAfterInsert: false,
      mentionDenotationChars: ['@'],
      source: function (searchTerm, renderList, mentionChar) {
        return;
      },
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
    },
    toolbar: false,
  };

  editorFormControl: FormControl<QuillEditorOperationsObject>;
  valueChanges$!: Observable<unknown>;
  private _value = '';
  stepsMetaData$: Observable<StepMetaData[]>;
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
            .select(BuilderSelectors.selectAllFlowStepsMetaData)
            .pipe(take(1))
        );
        if (typeof this._value === 'string')
          this.editorFormControl.setValue(
            fromTextToOps(this._value, stepsMetaData, this.sanitizer)
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
  @HostBinding('attr.aria-describedby') describedBy = '';
  protected _required: boolean | undefined;
  onChange: (val) => void = () => {
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
    private sanitizer: DomSanitizer,
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
    this.stepsMetaData$ = this.store.select(
      BuilderSelectors.selectAllFlowStepsMetaData
    );
  }

  ngOnInit(): void {
    this._readOnly = this.onlyAllowOneMentionToBeAdded;
    this.valueChanges$ = this.editorFormControl.valueChanges.pipe(
      skip(1),
      tap((val) => {
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

          this._value = fromOpsToText(val);
          this.onChange(this._value);
        }
      })
    );
  }
  editorCreated(): void {
    this.editor.quillEditor.clipboard.addMatcher(
      Node.ELEMENT_NODE,
      (node, delta) => {
        const ops: TextInsertOperation[] = [];
        delta.ops.forEach((op) => {
          if (op.insert && typeof op.insert === 'string') {
            ops.push({
              insert:
                this.sanitizer.sanitize(SecurityContext.HTML, op.insert) || '',
            });
          }
        });
        delta.ops = ops;
        return delta;
      }
    );
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
    const stepsMetaData = await firstValueFrom(
      this.store
        .select(BuilderSelectors.selectAllFlowStepsMetaData)
        .pipe(take(1))
    );
    if (value && typeof value === 'string') {
      const parsedTextToOps = fromTextToOps(
        value,
        stepsMetaData,
        this.sanitizer
      );
      this.editorFormControl.setValue(parsedTextToOps, { emitEvent: false });
    }
    this._value = value;
  }
  registerOnChange(fn: (val) => void): void {
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
    this.focusEditor();
  }

  public focusEditor() {
    setTimeout(() => {
      this.editor.quillEditor.focus();
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
    this.focused = false;
    this.stateChanges.next();
  }
  onFocus() {
    this.onTouched();
    this.focused = true;
    this.stateChanges.next();
  }

  public async addMention(mentionOp: InsertMentionOperation) {
    this._readOnly = false;
    this.cd.markForCheck();

    setTimeout(async () => {
      const allStepsMetaData = await firstValueFrom(this.stepsMetaData$);
      const itemPathWithoutInterpolationDenotation =
        mentionOp.insert.mention.serverValue.slice(
          2,
          mentionOp.insert.mention.serverValue.length - 1
        );
      const itemPrefix = itemPathWithoutInterpolationDenotation.split('.')[0];
      let imageTag = '';
      if (itemPrefix !== 'configs' && itemPrefix !== 'connections') {
        const stepMetaDataIndex = allStepsMetaData.findIndex(
          (s) => s.name === itemPrefix
        );
        if (stepMetaDataIndex > -1) {
          imageTag =
            getImageTemplateForStepLogo(
              allStepsMetaData[stepMetaDataIndex].logoUrl
            ) + `${stepMetaDataIndex + 1}. `;
        }
      } else {
        if (itemPrefix === 'connections') {
          imageTag = getImageTemplateForStepLogo(
            'assets/img/custom/piece/connection.png'
          );
        } else if (itemPrefix === 'configs') {
          imageTag = getImageTemplateForStepLogo(
            'assets/img/custom/piece/config.png'
          );
        }
      }
      mentionOp.insert.mention.value =
        ' ' + imageTag + mentionOp.insert.mention.value + ' ';

      if (this.onlyAllowOneMentionToBeAdded) {
        this.editorFormControl.setValue({ ops: [mentionOp] });
      } else {
        this.editor.quillEditor
          .getModule('mention')
          .insertItem(mentionOp.insert.mention, true);
      }

      this._readOnly = this.onlyAllowOneMentionToBeAdded;
      this.cd.markForCheck();
    }, 1);
  }
}
