import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AppConnectionsService,
  FlagService,
  PieceConnectionDropdownItem,
  UiCommonModule,
  extractAuthenticationProperty,
} from '@activepieces/ui/common';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { Store } from '@ngrx/store';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import {
  BuilderSelectors,
  FlowsActions,
  Step,
  StepMetaDataForMentions,
} from '@activepieces/ui/feature-builder-store';
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  forkJoin,
  map,
  of,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  AUTHENTICATION_PROPERTY_NAME,
  ActionErrorHandlingOptions,
  ActionType,
  PopulatedFlow,
  TriggerType,
  isNil,
  spreadIfDefined,
} from '@activepieces/shared';
import {
  ActionBase,
  PieceMetadataModel,
  PiecePropertyMap,
  PropertyType,
  TriggerBase,
} from '@activepieces/pieces-framework';
import { FormControl, UntypedFormBuilder, Validators } from '@angular/forms';
import { InputFormCore } from '../input-form-core';

@Component({
  selector: 'app-piece-input-form',
  standalone: true,
  imports: [CommonModule, UiCommonModule, UiFeatureBuilderFormControlsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (deps$ | async; as deps) {

    <app-action-or-trigger-dropdown
      [items]="deps.triggersOrActions"
      [passedFormControl]="triggersOrActionsControl"
    >
    </app-action-or-trigger-dropdown>
    @if ( deps.currentStep && deps.selectedTriggerOrAction && deps.pieceMetaData
    ) {
    <app-piece-properties-form
      [stepName]="deps.currentStep.name"
      [actionOrTriggerName]="
        deps.currentStep.settings.triggerName ||
        deps.currentStep.settings.actionName
      "
      [form]="form"
      [allConnectionsForPiece]="deps.allConnectionsForPiece"
      [pieceMetaData]="deps.pieceMetaData"
      [input]="deps.currentStep.settings.input"
      [customizedInputs]="
        deps.currentStep.settings.inputUiInfo.customizedInputs || {}
      "
      [flow]="deps.currentFlow"
      [webhookPrefix]="deps.webhookPrefix"
      [formPieceTriggerPrefix]="deps.formPieceTriggerPrefix"
      [propertiesMap]="deps.selectedTriggerOrAction.props"
      (formValueChange)="
        piecePropertiesFormValueChanged(
          $event,
          deps.currentStep,
          deps.selectedTriggerOrAction.props
        )
      "
      [triggerName]="deps.currentStep.settings.triggerName"
      [hideCustomizedInputs]="isFormReadOnly$ | async | defaultTrue"
      [stepMetaDataForMentions]="deps.stepMetaDataForMentions"
    ></app-piece-properties-form>

    @if(deps.currentStep.type === ActionType.PIECE) {
    <app-action-error-handling-form-control
      [formControl]="actionErrorHandlingFormControl"
      [hideContinueOnFailure]="
        deps.selectedTriggerOrAction.errorHandlingOptions?.continueOnFailure
          ?.hide || false
      "
      [hideRetryOnFailure]="
        deps.selectedTriggerOrAction.errorHandlingOptions?.retryOnFailure
          ?.hide || false
      "
      (valueChanged)="
        actionErrorHandlingFormControlValueChanged(deps.currentStep, $event)
      "
    ></app-action-error-handling-form-control>
    } } } @else {
    <div
      class="ap-flex ap-flex-grow ap-justify-center ap-items-center ap-h-[250px]"
    >
      <ap-loading-icon> </ap-loading-icon>
    </div>
    } @if (renameStepBasedOnSelectedTriggerOrAction$ | async) {}
  `,
})
export class PieceInputFormComponent extends InputFormCore {
  triggersOrActionsControl: FormControl<string>;
  renameStepBasedOnSelectedTriggerOrAction$?: Observable<unknown>;
  deps$: Observable<{
    currentStep: Step | undefined;
    triggersOrActions: TriggerBase[] | ActionBase[];
    selectedTriggerOrAction: TriggerBase | ActionBase | undefined;
    pieceMetaData: PieceMetadataModel | undefined;
    webhookPrefix: string;
    formPieceTriggerPrefix: string;
    currentFlow: PopulatedFlow;
    allConnectionsForPiece: PieceConnectionDropdownItem[];
    stepMetaDataForMentions: StepMetaDataForMentions[];
  }>;
  actionErrorHandlingFormControl: FormControl<ActionErrorHandlingOptions> =
    new FormControl({}, { nonNullable: true });
  form = this.fb.group({});
  isFormReadOnly$: Observable<boolean>;
  readonly ActionType = ActionType;
  constructor(
    store: Store,
    pieceService: PieceMetadataService,
    private pieceMetaDataService: PieceMetadataService,
    private appConnectionService: AppConnectionsService,
    private flagService: FlagService,
    private fb: UntypedFormBuilder
  ) {
    super(store, pieceService);
    this.isFormReadOnly$ = this.store
      .select(BuilderSelectors.selectReadOnly)
      .pipe(
        tap((res) => {
          if (res) {
            this.form.disable({ emitEvent: false });
            this.actionErrorHandlingFormControl.disable({ emitEvent: false });
            this.triggersOrActionsControl.disable({ emitEvent: false });
          } else {
            this.form.enable({ emitEvent: false });
            this.actionErrorHandlingFormControl.enable({ emitEvent: false });
            this.triggersOrActionsControl.enable({ emitEvent: false });
          }
        })
      );
    this.triggersOrActionsControl = new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.required,
    });

    this.triggersOrActionsControl.markAllAsTouched();
    this.deps$ = combineLatest({
      currentStep: this.store.select(BuilderSelectors.selectCurrentStep),
      triggersOrActions: this.getTriggersOrActions(),
      selectedTriggerOrAction: this.getSelectedTriggerOrAction(),
      pieceMetaData: this.getPieceMetaData(),
      webhookPrefix: this.flagService.getWebhookUrlPrefix(),
      formPieceTriggerPrefix: this.flagService.getFormUrlPrefix(),
      currentFlow: this.store.select(BuilderSelectors.selectCurrentFlow),
      allConnectionsForPiece: this.getAllConnectionsForPiece(),
      stepMetaDataForMentions: this.stepMetaDataForMentions$,
    }).pipe(
      tap((res) => {
        if (res.currentStep?.type === ActionType.PIECE) {
          this.actionErrorHandlingFormControl.setValue(
            res.currentStep.settings.errorHandlingOptions || {}
          );
        }
      })
    );
    this.renameStepBasedOnSelectedTriggerOrAction$ =
      this.renameStepBasedOnSelectedTriggerOrAction();
  }

  getTriggersOrActions(): Observable<ActionBase[] | TriggerBase[]> {
    const currentStep$ = this.store.select(BuilderSelectors.selectCurrentStep);
    return currentStep$.pipe(
      distinctUntilChanged((curr, prev) => curr?.name === prev?.name),
      switchMap((step) => {
        if (
          !step ||
          (step.type !== ActionType.PIECE && step.type !== TriggerType.PIECE)
        ) {
          return of([]);
        }
        return this.pieceMetaDataService
          .getPieceMetadata(step.settings.pieceName, step.settings.pieceVersion)
          .pipe(
            map((res) => {
              return Object.values(
                step.type === ActionType.PIECE ? res.actions : res.triggers
              );
            })
          );
      })
    );
  }
  getSelectedTriggerOrAction() {
    const deps$ = {
      selectedTriggerOrActionName: this.store
        .select(BuilderSelectors.selectCurrentPieceStepTriggerOrActionName)
        .pipe(
          distinctUntilChanged(
            (curr, prev) => curr?.stepName === prev?.stepName
          ),
          tap((step) => {
            this.triggersOrActionsControl.setValue(
              step.triggerOrActionname || '',
              { emitEvent: false }
            );
          }),
          switchMap((step) => {
            return this.triggersOrActionsControl.valueChanges.pipe(
              startWith(step.triggerOrActionname || '')
            );
          })
        ),
      triggersOrActions: this.getTriggersOrActions(),
      pieceMetaData: this.getPieceMetaData(),
    };
    return combineLatest(deps$).pipe(
      map((res) => {
        const triggerOrAction = res.triggersOrActions.find(
          (v) => v.name === res.selectedTriggerOrActionName
        );
        if (triggerOrAction) {
          return addPieceAuthenticationPropertyToTriggerOrActionProperties(
            triggerOrAction,
            res
          );
        }
        return undefined;
      })
    );

    function addPieceAuthenticationPropertyToTriggerOrActionProperties(
      triggerOrAction: ActionBase | TriggerBase,
      res: {
        selectedTriggerOrActionName: string;
        triggersOrActions: ActionBase[] | TriggerBase[];
        pieceMetaData: PieceMetadataModel | undefined;
      }
    ) {
      const authProperty = extractAuthenticationProperty(
        triggerOrAction,
        res.pieceMetaData
      );

      const selected = {
        ...triggerOrAction,
        props: {
          ...spreadIfDefined(AUTHENTICATION_PROPERTY_NAME, authProperty),
          ...triggerOrAction.props,
        },
      };
      return selected;
    }
  }
  getPieceMetaData(): Observable<PieceMetadataModel | undefined> {
    const currentStep$ = this.store.select(BuilderSelectors.selectCurrentStep);
    return currentStep$.pipe(
      switchMap((step) => {
        if (!step) {
          return of(undefined);
        }
        if (step.type === ActionType.PIECE || step.type === TriggerType.PIECE) {
          return this.pieceMetaDataService.getPieceMetadata(
            step.settings.pieceName,
            step.settings.pieceVersion
          );
        }
        return of(undefined);
      })
    );
  }

  getAllConnectionsForPiece(): Observable<PieceConnectionDropdownItem[]> {
    const currentStep$ = this.store.select(BuilderSelectors.selectCurrentStep);
    return currentStep$.pipe(
      switchMap((step) => {
        if (
          !step ||
          (step.type !== ActionType.PIECE && step.type !== TriggerType.PIECE)
        )
          return of([]);
        return this.appConnectionService
          .getAllForPieceSubject(step.settings.pieceName)
          .pipe(
            map((res) => {
              return res.map((c) => {
                const result: PieceConnectionDropdownItem = {
                  label: c.name,
                  value: `{{connections['${c.name}']}}`,
                };
                return result;
              });
            })
          );
      })
    );
  }

  piecePropertiesFormValueChanged(
    result: {
      input: Record<string, unknown>;
      customizedInputs: Record<string, boolean | Record<string, boolean>>;
      valid: boolean;
    },
    step: Step,
    props: PiecePropertyMap
  ) {
    const cleanedInput = this.fixJsonValues(
      this.removeEmptyValuesFromInput(result.input),
      props
    );
    if (this.form.enabled) {
      if (step.type === TriggerType.PIECE) {
        this.store.dispatch(
          FlowsActions.updateTrigger({
            operation: {
              ...step,
              settings: {
                ...step.settings,
                input: cleanedInput,
                inputUiInfo: {
                  ...step.settings.inputUiInfo,
                  customizedInputs: result.customizedInputs,
                },
              },
              valid: result.valid,
            },
          })
        );
      } else if (step.type === ActionType.PIECE) {
        this.store.dispatch(
          FlowsActions.updateAction({
            operation: {
              ...step,
              settings: {
                ...step.settings,
                input: cleanedInput,
                inputUiInfo: {
                  ...step.settings.inputUiInfo,
                  customizedInputs: result.customizedInputs,
                },
              },
              valid: result.valid,
            },
          })
        );
      }
    }
  }

  private fixJsonValues(
    input: Record<string, unknown>,
    props: PiecePropertyMap
  ) {
    const cleanedInput: Record<string, unknown> = JSON.parse(
      JSON.stringify(input)
    );
    Object.keys(input).forEach((key) => {
      if (props[key].type === PropertyType.JSON) {
        cleanedInput[key] = this.parseJsonIfPossible(input[key]);
      }
    });
    return cleanedInput;
  }

  renameStepBasedOnSelectedTriggerOrAction() {
    return this.triggersOrActionsControl.valueChanges.pipe(
      switchMap((res) => {
        const deps = {
          triggersOrActions: this.getTriggersOrActions().pipe(take(1)),
          pieceMetaData: this.getPieceMetaData().pipe(take(1)),
        };
        return forkJoin(deps).pipe(
          map((deps) => {
            return {
              triggerOrActionName: res,
              ...deps,
            };
          })
        );
      }),
      tap(({ triggersOrActions, triggerOrActionName, pieceMetaData }) => {
        const selectedTriggerOrAction = triggersOrActions.find(
          (x) => x.name === triggerOrActionName
        );
        if (selectedTriggerOrAction) {
          const authProperty = extractAuthenticationProperty(
            selectedTriggerOrAction,
            pieceMetaData
          );
          this.store.dispatch(
            FlowsActions.newTriggerOrActionSelected({
              displayName: selectedTriggerOrAction.displayName,
              name: selectedTriggerOrAction.name,
              properties: {
                ...selectedTriggerOrAction.props,
                ...spreadIfDefined(AUTHENTICATION_PROPERTY_NAME, authProperty),
              },
            })
          );
        }
      })
    );
  }

  removeEmptyValuesFromInput(
    input: Record<string, unknown>
  ): Record<string, unknown> {
    const cleanedInput: Record<string, unknown> = {};
    Object.keys(input).forEach((key) => {
      if (
        (!isNil(input[key]) &&
          input[key] !== '' &&
          typeof input[key] !== 'object') ||
        Array.isArray(input[key])
      ) {
        cleanedInput[key] = input[key];
      } else if (typeof input[key] === 'object' && !isNil(input[key])) {
        //typeof null === 'object' so we need to check if it is null
        const cleanedObject = this.removeEmptyValuesFromInput(
          input[key] as Record<string, unknown>
        );
        cleanedInput[key] = cleanedObject;
      }
    });
    return cleanedInput;
  }

  actionErrorHandlingFormControlValueChanged(
    step: Step,
    res: ActionErrorHandlingOptions
  ) {
    if (step.type === ActionType.PIECE) {
      this.store.dispatch(
        FlowsActions.updateAction({
          operation: {
            ...step,
            settings: {
              ...step.settings,
              errorHandlingOptions: res,
            },
          },
        })
      );
    }
  }

  private parseJsonIfPossible(value: unknown) {
    if (typeof value !== 'string') {
      return value;
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
}
