import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import { map, Observable, pairwise, startWith, tap } from 'rxjs';
import {
  BranchCondition,
  BranchOperator,
  singleValueConditions,
  textConditions,
} from '@activepieces/shared';
import { InterpolatingTextFormControlComponent } from '../interpolating-text-form-control/interpolating-text-form-control.component';
import { DropdownOption } from '@activepieces/pieces-framework';
import { InsertMentionOperation } from '@activepieces/ui/common';
import { ControlThatUsesMentionsCoreComponent } from '../control-that-uses-mentions-core/control-that-uses-mentions-core.component';
interface BranchForm {
  firstValue: FormControl<string | null>;
  operator: FormControl<BranchOperator | null>;
  secondValue: FormControl<string | null>;
  caseSensitive: FormControl<boolean | null>;
}

@Component({
  selector: 'app-branch-condition',
  templateUrl: './branch-condition-form-control.component.html',
  styleUrls: ['./branch-condition-form-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: BranchConditionFormControlComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: BranchConditionFormControlComponent,
    },
  ],
})
export class BranchConditionFormControlComponent
  extends ControlThatUsesMentionsCoreComponent
  implements ControlValueAccessor
{
  @Output() removeCondition = new EventEmitter();
  @Input() isLastAndOnlyCondition = false;
  @Input() isInLastAndOnlyGroup = false;
  form: FormGroup<BranchForm>;
  valueChanges$: Observable<void>;
  operatorChanged$: Observable<[BranchOperator | null, BranchOperator | null]>;
  conditionsDropdownOptions: DropdownOption<BranchOperator>[] = [];
  showCaseSensitive = false;
  showSecondValue = false;
  onChange: (val: BranchCondition) => void = () => {
    //ignored
  };

  constructor(private fb: FormBuilder) {
    super();
    const operatorControl: FormControl<BranchOperator | null> = new FormControl(
      null,
      {
        nonNullable: true,
        validators: Validators.required,
      }
    );
    this.form = this.fb.group({
      firstValue: new FormControl('', {
        nonNullable: false,
        validators: Validators.required,
      }),
      operator: operatorControl,
      secondValue: new FormControl('', {
        nonNullable: false,
        validators: Validators.required,
      }),
      caseSensitive: new FormControl(false),
    });
    this.operatorChanged$ = this.form.controls.operator.valueChanges.pipe(
      startWith(null),
      pairwise(),
      tap(([firstValue, secondValue]) => {
        const isFirstValueBinaryCondition = !singleValueConditions.find(
          (c) => c === firstValue
        );
        const isSecondValueSingleValueCondition = !!singleValueConditions.find(
          (c) => c === secondValue
        );

        if (
          (isFirstValueBinaryCondition || firstValue === null) &&
          isSecondValueSingleValueCondition
        ) {
          this.form.controls.secondValue.setValue('');
          this.form.controls.secondValue.disable();
          this.showSecondValue = false;
        } else if (!isSecondValueSingleValueCondition) {
          this.form.controls.secondValue.enable();
          this.showSecondValue = true;
        }
        this.showCaseSensitive = !!textConditions.find(
          (c) => c === secondValue
        );
        if (!this.showCaseSensitive) {
          this.form.controls.caseSensitive.setValue(null);
          this.form.controls.caseSensitive.disable();
        } else {
          this.form.controls.caseSensitive.enable();
        }
      })
    );
    this.createConditionsDropdownOptions();
    this.form.markAllAsTouched();
    this.valueChanges$ = this.form.valueChanges.pipe(
      tap(() => {
        const val = this.form.getRawValue();
        this.onChange({
          firstValue: val.firstValue || '',
          secondValue: val.secondValue || '',
          operator: val.operator || undefined,
          caseSensitive: val.caseSensitive ?? false,
        });
      }),
      map(() => void 0)
    );
  }
  writeValue(obj: BranchCondition): void {
    this.form.patchValue(obj);
    this.showSecondValue = !singleValueConditions.find(
      (c) => c === obj.operator
    );
    if (!this.showSecondValue) {
      this.form.controls.secondValue.setValue('');
      this.form.controls.secondValue.disable();
    }
    this.showCaseSensitive = !!textConditions.find((c) => c === obj.operator);
    if (!this.showCaseSensitive) {
      this.form.controls.caseSensitive.setValue((obj as any).caseSensitive);
      this.form.controls.caseSensitive.disable();
    }
  }
  registerOnChange(fn: (val: BranchCondition) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.form.disable();
    }
  }
  createConditionsDropdownOptions() {
    this.conditionsDropdownOptions = Object.values(BranchOperator).map(
      (operator) => {
        const label = operator
          .split('_')
          .map((word, idx) => {
            if (idx === 0) {
              const formmatedWord =
                word[0].toUpperCase() + word.toLowerCase().slice(1);
              if (
                word.toLocaleLowerCase() === 'does' ||
                word.toLocaleLowerCase() === 'exists'
              ) {
                return formmatedWord;
              }
              return '(' + formmatedWord + ')';
            }
            return word.toLowerCase();
          })
          .join(' ');
        return {
          label: label,
          value: operator,
        };
      }
    );
  }
  async addMention(
    textControl: InterpolatingTextFormControlComponent,
    mentionOp: InsertMentionOperation
  ) {
    await textControl.addMention(mentionOp);
  }
  validate() {
    if (this.form.invalid) {
      return { invalid: true };
    }
    return null;
  }
  removeConditionButtonClicked() {
    this.removeCondition.emit();
  }
}
