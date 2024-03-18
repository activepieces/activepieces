import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FlagService,
  PieceConnectionDropdownItem,
  PieceMetadataModel,
  UiCommonModule,
  appConnectionsSelectors,
} from '@activepieces/ui/common';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { Store } from '@ngrx/store';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import {
  BuilderSelectors,
  FlowsActions,
  Step,
} from '@activepieces/ui/feature-builder-store';
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  AUTHENTICATION_PROPERTY_NAME,
  ActionType,
  PopulatedFlow,
  TriggerType,
  spreadIfDefined,
} from '@activepieces/shared';
import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-piece-input-form',
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
      @if (
        deps.currentStep && deps.selectedTriggerOrAction && deps.pieceMetaData
      ) {
        <app-new-piece-properties-form
          [stepName]="deps.currentStep.name"
          [actionOrTriggerName]="
            deps.currentStep.settings.triggerName ||
            deps.currentStep.settings.actionName
          "
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
            piecePropertiesFormValueChanged($event, deps.currentStep)
          "
        ></app-new-piece-properties-form>
      }
    } @else {
      <div
        class="ap-flex ap-flex-grow ap-justify-center ap-items-center ap-h-[250px]"
      >
        <ap-loading-icon> </ap-loading-icon>
      </div>
    }
    @if (renameStepBasedOnSelectedTriggerOrAction$ | async) {}
  `,
})
export class NewPieceInputFormComponent {
  triggersOrActionsControl: FormControl<string>;
  renameStepBasedOnSelectedTriggerOrAction$?: Observable<unknown>;
  deps$: Observable<{
    currentStep: Step | undefined;
    triggersOrActions: (TriggerBase | ActionBase)[];
    selectedTriggerOrAction: TriggerBase | ActionBase | undefined;
    pieceMetaData: PieceMetadataModel | undefined;
    webhookPrefix: string;
    formPieceTriggerPrefix: string;
    currentFlow: PopulatedFlow;
    allConnectionsForPiece: PieceConnectionDropdownItem[];
  }>;

  constructor(
    private store: Store,
    private pieceMetaDataService: PieceMetadataService,
    private flagService: FlagService,
  ) {
    this.triggersOrActionsControl = new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.required,
    });
    this.deps$ = combineLatest({
      currentStep: this.store.select(BuilderSelectors.selectCurrentStep),
      triggersOrActions: this.getTriggersOrActions(),
      selectedTriggerOrAction: this.getSelectedTriggerOrAction(),
      pieceMetaData: this.getPieceMetaData(),
      webhookPrefix: this.flagService.getWebhookUrlPrefix(),
      formPieceTriggerPrefix: this.flagService.getFormUrlPrefix(),
      currentFlow: this.store.select(BuilderSelectors.selectCurrentFlow),
      allConnectionsForPiece: this.getAllConnectionsForPiece(),
    });
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
                step.type === ActionType.PIECE ? res.actions : res.triggers,
              );
            }),
          );
      }),
    );
  }
  getSelectedTriggerOrAction() {
    const deps$ = {
      selectedTriggerOrActionName: this.store
        .select(BuilderSelectors.selectCurrentPieceStepTriggerOrActionName)
        .pipe(
          distinctUntilChanged(
            (curr, prev) => curr?.stepName === prev?.stepName,
          ),
          tap((step) => {
            this.triggersOrActionsControl.setValue(
              step.triggerOrActionname || '',
              { emitEvent: false },
            );
          }),
          switchMap((step) => {
            return this.triggersOrActionsControl.valueChanges.pipe(
              startWith(step.triggerOrActionname || ''),
            );
          }),
        ),
      triggersOrActions: this.getTriggersOrActions(),
      pieceMetaData: this.getPieceMetaData(),
    };
    return combineLatest(deps$).pipe(
      map((res) => {
        const triggerOrAction = res.triggersOrActions.find(
          (v) => v.name === res.selectedTriggerOrActionName,
        );
        if (triggerOrAction) {
          return addPieceAuthenticationPropertyToTriggerOrActionProperties(
            triggerOrAction,
            res,
          );
        }
        return undefined;
      }),
    );

    function addPieceAuthenticationPropertyToTriggerOrActionProperties(
      triggerOrAction: ActionBase | TriggerBase,
      res: {
        selectedTriggerOrActionName: string;
        triggersOrActions: ActionBase[] | TriggerBase[];
        pieceMetaData: PieceMetadataModel | undefined;
      },
    ) {
      const selected = {
        ...triggerOrAction,
        props: {
          ...spreadIfDefined(
            AUTHENTICATION_PROPERTY_NAME,
            res.pieceMetaData?.auth,
          ),
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
            step.settings.pieceVersion,
          );
        }
        console.error('step type is not piece');
        return of(undefined);
      }),
    );
  }

  getAllConnectionsForPiece() {
    const currentStep$ = this.store.select(BuilderSelectors.selectCurrentStep);
    return currentStep$.pipe(
      switchMap((step) => {
        if (
          !step ||
          (step.type !== ActionType.PIECE && step.type !== TriggerType.PIECE)
        )
          return of([]);
        return this.store.select(
          appConnectionsSelectors.selectAllConnectionsForPiece(
            step.settings.pieceName,
          ),
        );
      }),
    );
  }

  piecePropertiesFormValueChanged(
    result: {
      input: Record<string, unknown>;
      customizedInputs: Record<string, boolean | Record<string, boolean>>;
      valid: boolean;
    },
    step: Step,
  ) {
    if (step.type === TriggerType.PIECE) {
      this.store.dispatch(
        FlowsActions.updateTrigger({
          operation: {
            ...step,
            settings: {
              ...step.settings,
              input: result.input,
              inputUiInfo: {
                ...step.settings.inputUiInfo,
                customizedInputs: result.customizedInputs,
              },
            },
            valid: result.valid,
          },
        }),
      );
    } else if (step.type === ActionType.PIECE) {
      this.store.dispatch(
        FlowsActions.updateAction({
          operation: {
            ...step,
            settings: {
              ...step.settings,
              input: result.input,
              inputUiInfo: {
                ...step.settings.inputUiInfo,
                customizedInputs: result.customizedInputs,
              },
            },
            valid: result.valid,
          },
        }),
      );
    }
  }

  renameStepBasedOnSelectedTriggerOrAction() {
    return combineLatest({
      triggersOrActions: this.getTriggersOrActions(),
      triggerOrActionName: this.triggersOrActionsControl.valueChanges,
    }).pipe(
      tap(({ triggersOrActions, triggerOrActionName }) => {
        const selectedTriggerOrAction = triggersOrActions.find(
          (x) => x.name === triggerOrActionName,
        );
        if (selectedTriggerOrAction) {
          this.store.dispatch(
            FlowsActions.newTriggerOrActionSelected({
              displayName: selectedTriggerOrAction.displayName,
              name: selectedTriggerOrAction.name,
            }),
          );
        }
      }),
    );
  }
}
