import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { map, Observable, of, tap } from 'rxjs';
import {
  ActionType,
  BranchAction,
  BranchActionSettings,
  BranchCondition,
  UpdateActionRequest,
} from '@activepieces/shared';
import { branchConditionGroupValidator } from '@activepieces/ui/common';
import { InputFormCore } from '../input-form-core';
import { Store } from '@ngrx/store';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-branch-step-input-form',
  templateUrl: './branch-step-input-form.component.html',
  styleUrls: ['./branch-step-input-form.component.scss'],
})
export class BranchStepInputFormComponent extends InputFormCore {
  @Input({ required: true }) stepSettings: BranchActionSettings;
  @Input({ required: true }) set step(value: BranchAction) {
    this._step = value;
    this.form.controls.conditionsGroups.clear({ emitEvent: false });
    if (value.settings.conditions) {
      value.settings.conditions.forEach((cg) => {
        this.form.controls.conditionsGroups.push(
          new FormControl([...cg], {
            nonNullable: true,
            validators: branchConditionGroupValidator,
          }),
          { emitEvent: false }
        );
      });
    }
  }
  form: FormGroup<{
    conditionsGroups: FormArray<FormControl<BranchCondition[]>>;
  }>;
  valueChanges$: Observable<void>;
  _step!: BranchAction;
  isReadOnly$: Observable<boolean> = of(false);

  constructor(
    store: Store,
    pieceService: PieceMetadataService,
    private fb: FormBuilder
  ) {
    super(store, pieceService);
    this.isReadOnly$ = this.store.select(BuilderSelectors.selectReadOnly).pipe(
      tap((val) => {
        if (val) {
          this.form.disable({ emitEvent: false });
        } else {
          this.form.enable({ emitEvent: false });
        }
      })
    );
    const emptyConditionsGroupList: FormControl<BranchCondition[]>[] = [];
    this.form = this.fb.group({
      conditionsGroups: this.fb.array(emptyConditionsGroupList),
    });
    this.valueChanges$ = this.form.valueChanges.pipe(
      tap(() => {
        const val = this.form.getRawValue();
        const updateBranchActionRequest: UpdateActionRequest = {
          displayName: this._step.displayName,
          name: this._step.name,
          type: ActionType.BRANCH,
          valid: this.form.valid,
          settings: {
            ...this.stepSettings,
            conditions: val.conditionsGroups,
          },
        };
        this.store.dispatch(
          FlowsActions.updateAction({ operation: updateBranchActionRequest })
        );
      }),
      map(() => void 0)
    );
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
  removeConditionGroup(index: number) {
    this.form.controls.conditionsGroups.removeAt(index);
  }
}
