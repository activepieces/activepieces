import { Component, Input } from '@angular/core';
import {
  forkJoin,
  map,
  Observable,
  of,
  skipWhile,
  Subject,
  switchMap,
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
  CodeActionSettings,
  PieceActionSettings,
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
  autoSaveListener$: Observable<void>;
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
      flowId: this.store
        .select(BuilderSelectors.selectCurrentFlowId)
        .pipe(take(1)),
      webhookPrefix: this.flagService.getWebhookUrlPrefix(),
    }).pipe(
      map((res) => {
        return `${res.webhookPrefix}/${res.flowId}`;
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
      settings: new UntypedFormControl({}),
    });
  }

  updateFormValue(stepSelected: FlowItem) {
    const settingsControl = this.stepForm.get('settings')!;
    settingsControl.setValue({
      ...stepSelected.settings,
      type: stepSelected.type,
    });
  }

  setAutoSaveListener() {
    this.autoSaveListener$ = this.stepForm.valueChanges.pipe(
      takeUntil(this.cancelAutoSaveListener$),
      skipWhile(() => this.stepForm.disabled),
      switchMap(() => {
        return this.store
          .select(BuilderSelectors.selectCurrentStep)
          .pipe(take(1));
      }),
      tap((res) => {
        if (
          this._selectedStep.type === TriggerType.PIECE ||
          this._selectedStep.type === TriggerType.WEBHOOK
        ) {
          this.store.dispatch(
            FlowsActions.updateTrigger({
              operation: this.prepareStepDataToSave(
                res!
              ) as UpdateTriggerRequest,
            })
          );
        } else {
          this.store.dispatch(
            FlowsActions.updateAction({
              operation: this.prepareStepDataToSave(
                res!
              ) as UpdateActionRequest,
            })
          );
        }
      }),
      map(() => void 0)
    );
  }

  prepareStepDataToSave(
    currentStep: FlowItem
  ): UpdateActionRequest | UpdateTriggerRequest {
    const stepToSave: UpdateActionRequest = JSON.parse(
      JSON.stringify(currentStep)
    );
    stepToSave.name = currentStep.name;
    stepToSave.valid = this.stepForm.valid;
    stepToSave.settings = this.createNewStepSettings(currentStep);
    return stepToSave;
  }

  createNewStepSettings(currentStep: FlowItem) {
    const inputControlValue = this.stepForm.get('settings')?.value;
    if (currentStep.type === ActionType.PIECE) {
      const stepSettings: PieceActionSettings = {
        ...currentStep.settings,
        ...inputControlValue,
        inputUiInfo: {
          ...currentStep.settings.inputUiInfo,
          customizedInputs: (inputControlValue as PieceActionSettings)
            .inputUiInfo.customizedInputs,
        },
      };
      return stepSettings;
    }
    if (currentStep.type === ActionType.CODE) {
      const stepSettings: CodeActionSettings = {
        ...currentStep.settings,
        ...inputControlValue,
        inputUiInfo: currentStep.settings.inputUiInfo,
      };
      return stepSettings;
    }

    if (currentStep.type === TriggerType.PIECE) {
      const stepSettings = {
        ...currentStep.settings,
        ...inputControlValue,
      };
      return stepSettings;
    }
    return inputControlValue;
  }
  copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    this.snackbar.open('Webhook url copied to clipboard');
  }
}
