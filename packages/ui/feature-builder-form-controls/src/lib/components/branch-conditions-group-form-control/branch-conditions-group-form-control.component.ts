import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { map, Observable, tap } from 'rxjs';
import { BranchCondition } from '@activepieces/shared';
import { branchConditionValidator } from '@activepieces/ui/common';
import { ControlThatUsesMentionsCoreComponent } from '../control-that-uses-mentions-core/control-that-uses-mentions-core.component';

@Component({
  selector: 'app-branch-conditions-group-form-control',
  templateUrl: './branch-conditions-group-form-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: BranchConditionsGroupFormControlComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: BranchConditionsGroupFormControlComponent,
    },
  ],
})
export class BranchConditionsGroupFormControlComponent
  extends ControlThatUsesMentionsCoreComponent
  implements ControlValueAccessor
{
  @Input() isFirstConditionGroup = true;
  @Input() isLastConditionGroup = false;
  @Input() isInLastAndOnlyGroup = false;
  @Output() removeConditionGroup = new EventEmitter();
  @Output() createNewConditionGroup = new EventEmitter();
  conditionsForm: FormGroup<{
    conditions: FormArray<FormControl<BranchCondition>>;
  }>;
  valueChanges$: Observable<void>;

  onChange: (val: BranchCondition[]) => void = () => {
    //ignored
  };

  constructor(private fb: FormBuilder) {
    super();
    const emptyConditionsList: FormControl<BranchCondition>[] = [];
    this.conditionsForm = this.fb.group({
      conditions: this.fb.array(emptyConditionsList),
    });
    this.valueChanges$ = this.conditionsForm.valueChanges.pipe(
      tap(() => {
        this.onChange(this.conditionsForm.getRawValue().conditions);
      }),
      map(() => void 0)
    );
  }
  writeValue(obj: BranchCondition[]): void {
    this.conditionsForm.controls.conditions.clear();
    obj.forEach((c) => {
      const conditionValue: BranchCondition = {
        firstValue: c.firstValue,
        operator: c.operator || undefined,
        caseSensitive: (c as any).caseSensitive,
        secondValue: (c as any).secondValue,
      };
      this.conditionsForm.controls.conditions.push(
        new FormControl(conditionValue, {
          nonNullable: true,
          validators: branchConditionValidator,
        })
      );
    });
  }
  registerOnChange(fn: (val: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    //ignored
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.conditionsForm.disable();
    } else if (this.conditionsForm.disabled) {
      this.conditionsForm.enable();
    }
  }
  andButtonPressed() {
    this.conditionsForm.controls.conditions.push(
      new FormControl(
        { firstValue: '', secondValue: undefined, operator: undefined },
        { nonNullable: true, validators: branchConditionValidator }
      )
    );
  }
  orButtonPressed() {
    this.createNewConditionGroup.emit();
  }
  validate() {
    if (this.conditionsForm.controls.conditions.invalid) {
      return { invalid: true };
    }
    return null;
  }
  removeCondition(index: number) {
    this.conditionsForm.controls.conditions.removeAt(index);
    if (this.conditionsForm.controls.conditions.length === 0) {
      this.removeConditionGroup.emit();
    }
  }
}
