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
  Action,
  ActionType,
  CodeActionSettings,
  PieceActionSettings,
  PieceTrigger,
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
              if (res.step === undefined) {
                console.error('step is undefined');
                return;
              }
              switch (res.step.type) {
                case TriggerType.PIECE: {
                  const newTriggerSettings =
                    this.createTriggerPieceTriggerSettings(res.step);
                  const trigger =
                    res.metadata?.triggers[newTriggerSettings.triggerName];
                  if (trigger === undefined) {
                    console.error(
                      `trying to update trigger ${
                        newTriggerSettings.triggerName
                      } which is not found in metadata ${JSON.stringify(
                        res.metadata
                      )}`
                    );
                    return;
                  } else {
                    this.updatePieceTrigger(res.step);
                  }
                  break;
                }
                case TriggerType.WEBHOOK:
                case TriggerType.EMPTY:
                case ActionType.MISSING: {
                  console.error(
                    `tyring to update ${res.step.displayName} which is ${res.step.type}`
                  );
                  break;
                }
                case ActionType.BRANCH:
                case ActionType.CODE:
                case ActionType.LOOP_ON_ITEMS:
                case ActionType.PIECE: {
                  this.store.dispatch(
                    FlowsActions.updateAction({
                      operation: this.prepareStepDataToSave(res.step),
                    })
                  );
                  break;
                }
                default: {
                  const nvr: never = res.step;
                  console.error('unhandeled case reached' + nvr);
                }
              }
            }),
            map(() => void 0)
          );
        })
      );
  }

  private updatePieceTrigger(trigger: PieceTrigger) {
    this.store.dispatch(
      FlowsActions.updateTrigger({
        operation: this.prepareTriggerDataToSave(trigger),
      })
    );
  }

  prepareStepDataToSave(currentStep: Action): UpdateActionRequest {
    const stepToSave: UpdateActionRequest = JSON.parse(
      JSON.stringify(currentStep)
    );
    stepToSave.name = currentStep.name;
    stepToSave.valid = this.stepForm.valid;
    stepToSave.settings = this.createNewStepSettings(currentStep);
    return stepToSave;
  }

  prepareTriggerDataToSave(trigger: PieceTrigger): UpdateTriggerRequest {
    const triggerToSave: UpdateTriggerRequest = JSON.parse(
      JSON.stringify(trigger)
    );
    triggerToSave.name = trigger.name;
    triggerToSave.valid = this.stepForm.valid;
    triggerToSave.settings = this.createTriggerPieceTriggerSettings(trigger);
    return triggerToSave;
  }

  createNewStepSettings(step: Action) {
    const inputControlValue: StepSettings =
      this.stepForm.get('settings')?.value;

    switch (step.type) {
      case ActionType.PIECE: {
        const stepSettings: PieceActionSettings = {
          ...step.settings,
          ...inputControlValue,
          inputUiInfo: {
            ...step.settings.inputUiInfo,
            customizedInputs: (inputControlValue as PieceActionSettings)
              .inputUiInfo.customizedInputs,
          },
        };
        return stepSettings;
      }
      case ActionType.CODE: {
        debugger;
        const stepSettings: CodeActionSettings = {
          ...step.settings,
          ...inputControlValue,
          inputUiInfo: step.settings.inputUiInfo,
        };
        return stepSettings;
      }
      case ActionType.BRANCH:
      case ActionType.LOOP_ON_ITEMS:
      case ActionType.MISSING:
        return inputControlValue;
    }
  }

  createTriggerPieceTriggerSettings(step: PieceTrigger) {
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
