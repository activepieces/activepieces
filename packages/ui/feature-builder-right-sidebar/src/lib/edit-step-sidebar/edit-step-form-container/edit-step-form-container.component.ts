import { Component, Input } from '@angular/core';
import {
  forkJoin,
  map,
  Observable,
  of,
  skipWhile,
  Subject,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ActionType,
  TriggerType,
  UpdateActionRequest,
  UpdateTriggerRequest,
} from '@activepieces/shared';
import { FlagService } from '@activepieces/ui/common';
import {
  BuilderSelectors,
  FlowItem,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-edit-step-form-container',
  templateUrl: './edit-step-form-container.component.html',
  styleUrls: ['./edit-step-form-container.component.scss'],
})
export class EditStepFormContainerComponent {
  autoSaveListener$: Observable<{
    input: any;
  }>;
  readOnly$: Observable<boolean> = of(false);
  cancelAutoSaveListener$: Subject<boolean> = new Subject();
  _selectedStep: FlowItem;
  stepForm: UntypedFormGroup;
  webhookUrl$: Observable<string>;
  ActionType = ActionType;
  TriggerType = TriggerType;
  @Input() set selectedStep(step: FlowItem) {
    this._selectedStep = step;
    this.cancelAutoSaveListener$.next(true);
    this.updateFormValue(step);
    this.setAutoSaveListener();
  }

  constructor(
    private formBuilder: UntypedFormBuilder,
    private store: Store,
    private snackbar: MatSnackBar,
    private flagService: FlagService
  ) {
    this.webhookUrl$ = forkJoin({
      flow: this.store.select(BuilderSelectors.selectCurrentFlow).pipe(take(1)),
      webhookPrefix: this.flagService.getWebhookUrlPrefix(),
    }).pipe(
      map((res) => {
        return `${res.webhookPrefix}/${res.flow.id}`;
      })
    );
    this.readOnly$ = this.store.select(BuilderSelectors.selectReadOnly).pipe(
      tap((readOnly) => {
        if (readOnly) {
          this.stepForm.disable();
        } else if (!this.stepForm.enabled) {
          this.stepForm.enable();
        }
      })
    );
    this.stepForm = this.formBuilder.group({
      input: new UntypedFormControl({}),
    });
  }

  updateFormValue(stepSelected: FlowItem) {
    const inputControl = this.stepForm.get('input');
    if (inputControl) {
      const settings = stepSelected.settings;
      inputControl.setValue({
        ...settings,
        type: stepSelected.type,
      });
    }
  }

  setAutoSaveListener() {
    this.autoSaveListener$ = this.stepForm.valueChanges.pipe(
      takeUntil(this.cancelAutoSaveListener$),
      skipWhile(() => this.stepForm.disabled),
      tap(() => {
        if (
          this._selectedStep.type === TriggerType.PIECE ||
          this._selectedStep.type === TriggerType.WEBHOOK
        ) {
          this.store.dispatch(
            FlowsActions.updateTrigger({
              operation: this.prepareStepDataToSave() as UpdateTriggerRequest,
            })
          );
        } else {
          this.store.dispatch(
            FlowsActions.updateAction({
              operation: this.prepareStepDataToSave() as UpdateActionRequest,
            })
          );
        }
      })
    );
  }

  prepareStepDataToSave(): UpdateActionRequest | UpdateTriggerRequest {
    const inputControlValue = this.stepForm.get('input')?.value;
    const stepToSave: UpdateActionRequest = JSON.parse(
      JSON.stringify(this._selectedStep)
    );
    stepToSave.settings = inputControlValue;
    stepToSave.name = this._selectedStep.name;
    stepToSave.valid = this.stepForm.valid;
    if (
      this._selectedStep.type === ActionType.PIECE ||
      this._selectedStep.type === TriggerType.PIECE
    ) {
      const componentSettings = {
        ...this._selectedStep.settings,
        ...inputControlValue,
      };
      stepToSave.settings = componentSettings;
    }
    return stepToSave;
  }

  copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    this.snackbar.open('Webhook url copied to clipboard');
  }
}
