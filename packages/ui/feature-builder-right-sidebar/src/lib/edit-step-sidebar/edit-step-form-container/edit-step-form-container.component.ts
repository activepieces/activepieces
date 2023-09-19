import { Component, Input } from '@angular/core';
import {
  debounceTime,
  delay,
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
  PieceTriggerSettings,
  StepSettings,
  TriggerType,
  UpdateActionRequest,
  UpdateTriggerRequest,
} from '@activepieces/shared';
import { PieceMetadataService, FlagService } from '@activepieces/ui/common';
import {
  BuilderSelectors,
  CollectionBuilderService,
  FlowItem,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { TriggerBase, TriggerStrategy } from '@activepieces/pieces-framework';

@Component({
  selector: 'app-edit-step-form-container',
  templateUrl: './edit-step-form-container.component.html',
  styleUrls: ['./edit-step-form-container.component.scss'],
})
export class EditStepFormContainerComponent {
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
    private flagService: FlagService,
    private actionMetaService: PieceMetadataService,
    private builderService: CollectionBuilderService
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
      take(1),
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
    const delayForWriteValueToTakeEffectThenListenToSaving = of(null).pipe(
      delay(10)
    );
    this.builderService.savingStepOrTriggerData$ =
      delayForWriteValueToTakeEffectThenListenToSaving.pipe(
        switchMap(() => {
          return this.stepForm.valueChanges.pipe(
            takeUntil(this.cancelAutoSaveListener$),
            skipWhile(() => this.stepForm.disabled),
            delay(1), //to ensure name doesn't get overwritten from changing selected action/trigger dropdown value.
            switchMap(() => {
              return this.store
                .select(BuilderSelectors.selectCurrentStep)
                .pipe(take(1));
            }),
            switchMap((res) => {
              if (res?.type === TriggerType.PIECE) {
                return this.actionMetaService
                  .getPieceMetadata(
                    res.settings.pieceName,
                    res.settings.pieceVersion
                  )
                  .pipe(
                    map((meta) => {
                      return { step: res, metadata: meta };
                    })
                  );
              }
              return of({ step: res, metadata: undefined });
            }),
            tap(() => {
              this.store.dispatch(FlowsActions.toggleWaitingToSave());
            }),
            debounceTime(350),
            tap((res) => {
              if (
                this._selectedStep.type === TriggerType.PIECE ||
                this._selectedStep.type === TriggerType.WEBHOOK
              ) {
                if (this._selectedStep.type === TriggerType.WEBHOOK) {
                  this.updateNonAppWebhookTrigger(res.step!);
                } else {
                  const newTriggerSettings = this.createPieceSettings(
                    res.step!
                  );
                  const trigger =
                    res.metadata?.triggers[newTriggerSettings.triggerName];
                  if (trigger?.type === TriggerStrategy.APP_WEBHOOK) {
                    this.updateAppWebhookTrigger(res.step!, trigger);
                  } else {
                    this.updateNonAppWebhookTrigger(res.step!);
                  }
                }
              } else {
                this.store.dispatch(
                  FlowsActions.updateAction({
                    operation: this.prepareStepDataToSave(
                      res.step!
                    ) as UpdateActionRequest,
                  })
                );
              }
            }),
            map(() => void 0)
          );
        })
      );
  }

  private updateNonAppWebhookTrigger(step: FlowItem) {
    this.store.dispatch(
      FlowsActions.updateTrigger({
        operation: this.prepareStepDataToSave(step) as UpdateTriggerRequest,
      })
    );
  }
  private updateAppWebhookTrigger(step: FlowItem, trigger: TriggerBase) {
    const dataToSave: UpdateTriggerRequest = this.prepareStepDataToSave(
      step
    ) as UpdateTriggerRequest;
    const dataToSaveWithTriggerSampleData: UpdateTriggerRequest = {
      ...dataToSave,
      settings: {
        ...dataToSave.settings,
        inputUiInfo: {
          ...dataToSave.settings,
          currentSelectedData: trigger.sampleData,
        },
      },
    };
    this.store.dispatch(
      FlowsActions.updateTrigger({
        operation: dataToSaveWithTriggerSampleData,
      })
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
    const inputControlValue: StepSettings =
      this.stepForm.get('settings')?.value;
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
      return this.createPieceSettings(currentStep);
    }
    return inputControlValue;
  }

  createPieceSettings(step: FlowItem) {
    const inputControlValue: StepSettings =
      this.stepForm.get('settings')?.value;
    const stepSettings: PieceTriggerSettings = {
      ...step.settings,
      ...inputControlValue,
    };
    return stepSettings;
  }
  copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    this.snackbar.open('Webhook URL copied to clipboard');
  }
}
