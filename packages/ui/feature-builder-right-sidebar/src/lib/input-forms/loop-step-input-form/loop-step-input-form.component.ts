import { Component, Input } from '@angular/core';
import {
  Validators,
  FormControl,
  FormGroup,
  FormBuilder,
  UntypedFormGroup,
} from '@angular/forms';

import { Observable, of, tap } from 'rxjs';
import {
  ActionType,
  LoopOnItemsAction,
  LoopOnItemsActionSettings,
  UpdateActionRequest,
} from '@activepieces/shared';
import { InsertMentionOperation } from '@activepieces/ui/common';
import { InterpolatingTextFormControlComponent } from '@activepieces/ui/feature-builder-form-controls';
import { InputFormCore } from '../input-form-core';
import { Store } from '@ngrx/store';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-loop-step-input-form',
  templateUrl: './loop-step-input-form.component.html',
})
export class LoopStepInputFormComponent extends InputFormCore {
  _step!: LoopOnItemsAction;
  @Input({ required: true }) stepSettings: LoopOnItemsActionSettings;
  @Input({ required: true }) set step(value: LoopOnItemsAction) {
    this._step = value;
    this.replaceOldControllerWithNewOne(value);
  }
  form: FormGroup<{ items: FormControl<string> }>;
  updateComponentValue$: Observable<Partial<{ items: string }>>;
  isReadOnly$: Observable<boolean> = of(false);
  constructor(
    store: Store,
    pieceService: PieceMetadataService,
    private formBuilder: FormBuilder
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
    this.form = this.formBuilder.group({
      items: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
    });
    this.form.markAllAsTouched();
    this.updateComponentValue$ = this.form.valueChanges.pipe(
      tap((val) => {
        const updateStep: UpdateActionRequest = {
          displayName: this._step.displayName,
          settings: {
            ...this.stepSettings,
            items: val.items || '',
          },
          name: this._step.name,
          type: ActionType.LOOP_ON_ITEMS,
          valid: this.form.valid,
        };
        this.store.dispatch(
          FlowsActions.updateAction({ operation: updateStep })
        );
      })
    );
  }
  /**This is needed because otherwise the controller will always emit an update event and cause the listener to dispatch an update action */
  private replaceOldControllerWithNewOne(value: LoopOnItemsAction) {
    (this.form as UntypedFormGroup).removeControl('items', {
      emitEvent: false,
    });
    this.form.addControl(
      'items',
      new FormControl(
        {
          value: value.settings.items,
          disabled: this.form.disabled,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
      { emitEvent: false }
    );
  }

  async addMention(
    textControl: InterpolatingTextFormControlComponent,
    mentionOp: InsertMentionOperation
  ) {
    await textControl.addMention(mentionOp);
  }
}
