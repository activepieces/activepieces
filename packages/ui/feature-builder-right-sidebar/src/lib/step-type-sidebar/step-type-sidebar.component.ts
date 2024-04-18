import { Store } from '@ngrx/store';
import {
  debounceTime,
  filter,
  forkJoin,
  map,
  Observable,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import {
  Trigger,
  ActionType,
  TriggerType,
  AddActionRequest,
  FlowVersion,
  StepLocationRelativeToParent,
  TelemetryEventName,
  flowHelper,
  PieceType,
  PackageType,
  ApFlagId,
} from '@activepieces/shared';
import { FormControl } from '@angular/forms';
import {
  BuilderSelectors,
  canvasActions,
  CanvasActionType,
  CodeService,
  FlowsActions,
  NO_PROPS,
  RightSideBarType,
  StepTypeSideBarProps,
} from '@activepieces/ui/feature-builder-store';
import {
  extractInitialPieceStepValuesAndValidity,
  FlagService,
  FlowItemDetails,
  getDefaultDisplayNameForPiece,
  getDisplayNameForTrigger,
  TelemetryService,
} from '@activepieces/ui/common';
import { Actions, ofType } from '@ngrx/effects';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';

@Component({
  selector: 'app-step-type-sidebar',
  templateUrl: './step-type-sidebar.component.html',
  styleUrls: ['./step-type-sidebar.component.scss'],
})
export class StepTypeSidebarComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput: ElementRef;
  _showTriggers = false;
  searchFormControl = new FormControl('');
  focusSearchInput$: Observable<void>;
  searchControlTelemetry$: Observable<void>;
  showRequestPiece$: Observable<boolean>;
  loading$ = new Subject<boolean>();
  @Input() set showTriggers(shouldShowTriggers: boolean) {
    this._showTriggers = shouldShowTriggers;
    if (this._showTriggers) {
      this.sideBarDisplayName = $localize`Select Trigger`;
    } else {
      this.sideBarDisplayName = $localize`Select Step`;
    }
    this.populateTabsAndTheirLists();
  }

  sideBarDisplayName = $localize`Select Step`;
  tabsAndTheirLists: {
    displayName: string;
    list$: Observable<FlowItemDetails[]>;
    emptyListText: string;
  }[] = [];
  flowTypeSelected$: Observable<void>;
  triggersDetails$: Observable<FlowItemDetails[]>;
  constructor(
    private store: Store,
    private codeService: CodeService,
    private actions: Actions,
    private flagsService: FlagService,
    private telemetryService: TelemetryService,
    private pieceMetadataService: PieceMetadataService
  ) {
    this.focusSearchInput$ = this.actions.pipe(
      ofType(CanvasActionType.SET_RIGHT_SIDEBAR),
      tap(() => {
        this.searchInput?.nativeElement.focus();
      }),
      map(() => void 0)
    );
    this.showRequestPiece$ = this.flagsService.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
    );
    this.searchControlTelemetry$ = this.searchFormControl.valueChanges.pipe(
      debounceTime(1500),
      filter((val) => !!val),
      tap((val) => {
        this.telemetryService.capture({
          name: TelemetryEventName.PIECES_SEARCH,
          payload: {
            target: this._showTriggers ? 'triggers' : 'steps',
            search: val || '',
          },
        });
      }),
      map(() => void 0)
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 350);
  }

  populateTabsAndTheirLists() {
    this.searchFormControl.setValue(this.searchFormControl.value, {
      emitEvent: false,
    });
    this.tabsAndTheirLists = [];

    const searchQuery$ = this.searchFormControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300)
    );

    const coreItemsDetails$ = searchQuery$.pipe(
      tap(() => this.loading$.next(true)),
      switchMap((searchQuery) => {
        return this._showTriggers
          ? this.pieceMetadataService.listCoreFlowItemsDetailsForTrigger(
              searchQuery ?? undefined
            )
          : this.pieceMetadataService.listCoreFlowItemsDetailsForAction(
              searchQuery ?? undefined
            );
      }),
      tap(() => this.loading$.next(false))
    );

    const appItemsDetails$ = searchQuery$.pipe(
      tap(() => this.loading$.next(true)),
      switchMap((searchQuery) => {
        return this._showTriggers
          ? this.pieceMetadataService.listAppFlowItemsDetailsForTrigger(
              searchQuery ?? undefined
            )
          : this.pieceMetadataService.listAppFlowItemsDetailsForAction(
              searchQuery ?? undefined
            );
      }),
      tap(() => this.loading$.next(false))
    );

    const allItemDetails$ = searchQuery$.pipe(
      tap(() => this.loading$.next(true)),
      switchMap((searchQuery) => {
        return this._showTriggers
          ? this.pieceMetadataService.listAllFlowItemsDetailsForTrigger(
              searchQuery ?? undefined
            )
          : this.pieceMetadataService.listAllFlowItemsDetailsForAction(
              searchQuery ?? undefined
            );
      }),
      tap(() => this.loading$.next(false))
    );

    this.tabsAndTheirLists.push({
      displayName: $localize`All`,
      list$: allItemDetails$,
      emptyListText: $localize`Oops! We didn't find any results.`,
    });
    this.tabsAndTheirLists.push({
      displayName: $localize`Core`,
      list$: coreItemsDetails$,
      emptyListText: $localize`Oops! We didn't find any results.`,
    });
    this.tabsAndTheirLists.push({
      displayName: this._showTriggers
        ? $localize`App Events`
        : $localize`App Actions`,
      list$: appItemsDetails$,
      emptyListText: $localize`Oops! We didn't find any results.`,
    });
  }

  closeSidebar() {
    this.store.dispatch(
      canvasActions.setRightSidebar({
        sidebarType: RightSideBarType.NONE,
        props: NO_PROPS,
        deselectCurrentStep: true,
      })
    );
  }

  onTypeSelected({
    flowItemDetails,
    suggestion,
  }: {
    flowItemDetails: FlowItemDetails;
    suggestion?: ActionBase | TriggerBase;
  }) {
    this.flowTypeSelected$ = forkJoin({
      currentFlow: this.store
        .select(BuilderSelectors.selectCurrentFlow)
        .pipe(take(1)),
      rightSideBar: this.store
        .select(BuilderSelectors.selectCurrentRightSideBar)
        .pipe(take(1)),
      currentStep: this.store
        .select(BuilderSelectors.selectCurrentStep)
        .pipe(take(1)),
    }).pipe(
      take(1),
      tap((results) => {
        if (!results.currentFlow) {
          return;
        }
        if (this._showTriggers) {
          this.replaceTrigger(flowItemDetails, suggestion);
        } else {
          const operation = this.constructAddOperation(
            (results.rightSideBar.props as StepTypeSideBarProps).stepName,
            results.currentFlow.version,
            flowItemDetails.type as ActionType,
            flowItemDetails,
            (results.rightSideBar.props as StepTypeSideBarProps)
              .stepLocationRelativeToParent,
            suggestion
          );
          this.store.dispatch(
            FlowsActions.addAction({
              operation: operation,
            })
          );
        }
      }),
      map(() => {
        return void 0;
      })
    );
  }

  private replaceTrigger(
    triggerDetails: FlowItemDetails,
    suggestion?: ActionBase | TriggerBase
  ) {
    const base = {
      name: 'trigger',
      nextAction: undefined,
      displayName:
        suggestion?.displayName ||
        getDisplayNameForTrigger(triggerDetails.type as TriggerType),
    };
    let trigger: Trigger;
    switch (triggerDetails.type as TriggerType) {
      case TriggerType.EMPTY:
        trigger = {
          ...base,
          valid: false,
          type: TriggerType.EMPTY,
          settings: undefined,
        };
        break;
      case TriggerType.PIECE: {
        const { valid, initialValues } =
          this.extractSuggestionInitialValueAndValidity(suggestion);
        trigger = {
          ...base,
          type: TriggerType.PIECE,
          valid: valid,
          settings: {
            packageType:
              triggerDetails.extra?.packageType ?? PackageType.REGISTRY,
            pieceType: triggerDetails.extra?.pieceType ?? PieceType.OFFICIAL,
            pieceName: triggerDetails.extra?.pieceName ?? 'NO_APP_NAME',
            pieceVersion:
              triggerDetails.extra?.pieceVersion ?? 'NO_APP_VERSION',
            triggerName: suggestion?.name || '',
            input: initialValues,
            inputUiInfo: {
              currentSelectedData: '',
            },
          },
        };
        break;
      }
    }
    this.store.dispatch(
      FlowsActions.updateTrigger({
        operation: trigger,
      })
    );
  }

  constructAddOperation(
    parentStep: string,
    flowVersion: FlowVersion,
    actionType: ActionType,
    flowItemDetails: FlowItemDetails,
    stepLocationRelativeToParent: StepLocationRelativeToParent,
    suggestion?: ActionBase | TriggerBase
  ): AddActionRequest {
    const baseProps = {
      name: flowHelper.findAvailableStepName(flowVersion, 'step'),
      displayName:
        suggestion?.displayName ||
        getDefaultDisplayNameForPiece(
          flowItemDetails.type as ActionType,
          flowItemDetails.name
        ),
      nextAction: undefined,
      valid: true,
    };
    switch (actionType) {
      case ActionType.CODE: {
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            type: ActionType.CODE,
            settings: {
              sourceCode: this.codeService.helloWorldArtifact(),
              input: {},
              errorHandlingOptions: {
                continueOnFailure: {
                  value: false,
                },
                retryOnFailure: {
                  value: false,
                },
              },
            },
          },
        };
      }
      case ActionType.LOOP_ON_ITEMS: {
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            type: ActionType.LOOP_ON_ITEMS,
            settings: {
              items: '',
              inputUiInfo: {},
            },
            valid: false,
          },
        };
      }
      case ActionType.PIECE: {
        const { valid, initialValues } =
          this.extractSuggestionInitialValueAndValidity(suggestion);
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            type: ActionType.PIECE,
            valid: valid,
            settings: {
              packageType:
                flowItemDetails.extra?.packageType ?? PackageType.REGISTRY,
              pieceType: flowItemDetails.extra?.pieceType ?? PieceType.OFFICIAL,
              pieceName: flowItemDetails.extra?.pieceName ?? 'NO_APP_NAME',
              pieceVersion:
                flowItemDetails.extra?.pieceVersion ?? 'NO_APP_VERSION',
              actionName: suggestion?.name,
              input: initialValues,
              inputUiInfo: {
                customizedInputs: {},
              },
              errorHandlingOptions: {
                continueOnFailure: {
                  value: false,
                },
                retryOnFailure: {
                  value: false,
                },
              },
            },
          },
        };
      }
      case ActionType.BRANCH: {
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            valid: false,
            type: ActionType.BRANCH,
            settings: {
              conditions: [
                [
                  {
                    firstValue: '',
                    secondValue: '',
                    operator: undefined,
                  },
                ],
              ],
              inputUiInfo: {},
            },
          },
        };
      }
    }
  }
  private extractSuggestionInitialValueAndValidity(
    suggestion?: ActionBase | TriggerBase
  ) {
    if (!suggestion) {
      return {
        valid: false,
        initialValues: {},
      };
    }
    return extractInitialPieceStepValuesAndValidity(suggestion.props);
  }
}
