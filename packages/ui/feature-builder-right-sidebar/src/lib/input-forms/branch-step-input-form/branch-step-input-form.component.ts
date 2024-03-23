import { Component } from '@angular/core';
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
import {
  ActionType,
  BranchActionSettings,
  BranchCondition,
} from '@activepieces/shared';
import { branchConditionGroupValidator } from '@activepieces/ui/common';
import { InputFormCore } from '../input-form-core';
import { Store } from '@ngrx/store';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
type BranchActionSettingsWithoutInputUiInfo = Omit<
  BranchActionSettings,
  'inputUiInfo'
>;
@Component({
  selector: 'app-branch-step-input-form',
  templateUrl: './branch-step-input-form.component.html',
  styleUrls: ['./branch-step-input-form.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: BranchStepInputFormComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: BranchStepInputFormComponent,
    },
  ],
})
export class BranchStepInputFormComponent
  extends InputFormCore
  implements ControlValueAccessor
{
  form: FormGroup<{
    conditionsGroups: FormArray<FormControl<BranchCondition[]>>;
  }>;
  valueChanges$: Observable<void>;
  onChange: (val: BranchActionSettingsWithoutInputUiInfo) => void = () => {
    //ignored
  };

  constructor(
    store: Store,
    pieceService: PieceMetadataService,
    private fb: FormBuilder
  ) {
    super(store, pieceService);
    const emptyConditionsGroupList: FormControl<BranchCondition[]>[] = [];
    this.form = this.fb.group({
      conditionsGroups: this.fb.array(emptyConditionsGroupList),
    });

    this.valueChanges$ = this.form.valueChanges.pipe(
      tap(() => {
        const val = this.form.getRawValue();
        this.onChange({
          conditions: val.conditionsGroups,
        });
      }),
      map(() => void 0)
    );
  }
  writeValue(obj: BranchActionSettings & { type: ActionType }): void {
    if (obj.type === ActionType.BRANCH) {
      this.form.controls.conditionsGroups.clear();
      if (obj.conditions) {
        obj.conditions.forEach((cg) => {
          this.form.controls.conditionsGroups.push(
            new FormControl([...cg], {
              nonNullable: true,
              validators: branchConditionGroupValidator,
            })
          );
        });
      }
    }
  }
  addNewConditionGroup() {
    this.form.controls.conditionsGroups.push(
      new FormControl(
        [{ operator: undefined, firstValue: '', secondValue: '' }],
        {
          nonNullable: true,
          validators: branchConditionGroupValidator,
        }
      )
    );
  }
  registerOnChange(
    fn: (val: BranchActionSettingsWithoutInputUiInfo) => void
  ): void {
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
  validate() {
    if (this.form.controls.conditionsGroups.invalid) {
      return { invalid: true };
    }
    return null;
  }
  removeConditionGroup(index: number) {
    this.form.controls.conditionsGroups.removeAt(index);
  }
}
