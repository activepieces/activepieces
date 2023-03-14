import { Store } from '@ngrx/store';
import {
  combineLatest,
  forkJoin,
  map,
  Observable,
  startWith,
  take,
  tap,
} from 'rxjs';
import { FlowItemDetails } from './step-type-item/flow-item-details';
import { FlowsActions } from '../../../../store/flow/flows.action';
import { RightSideBarType } from '../../../../../common/model/enum/right-side-bar-type.enum';
import { Component, Input, OnInit } from '@angular/core';

import { ComponentItemDetails } from './step-type-item/component-item-details';
import {
  Trigger,
  ActionType,
  TriggerType,
  Flow,
  AddActionRequest,
  FlowVersion,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { FormControl } from '@angular/forms';
import { CodeService } from '../../../../service/code.service';
import { BuilderSelectors } from '../../../../store/builder/builder.selector';
import { FlowStructureUtil } from '../../../../service/flowStructureUtil';
import {
  defaultCronJobForScheduleTrigger,
  getDefaultDisplayNameForPiece,
  getDisplayNameForTrigger,
} from '../../../../../common/utils';
import { StepTypeSideBarProps } from '../../../../store/model/tab-state';

@Component({
  selector: 'app-step-type-sidebar',
  templateUrl: './step-type-sidebar.component.html',
  styleUrls: ['./step-type-sidebar.component.scss'],
})
export class StepTypeSidebarComponent implements OnInit {
  _showTriggers = false;
  searchFormControl = new FormControl('');
  @Input() set showTriggers(shouldShowTriggers) {
    this._showTriggers = shouldShowTriggers;
    if (this._showTriggers) {
      this.sideBarDisplayName = 'Select Trigger';
    } else {
      this.sideBarDisplayName = 'Select Step';
    }
    this.populateTabsAndTheirLists();
  }

  sideBarDisplayName = 'Select Step';
  tabsAndTheirLists: {
    displayName: string;
    list$: Observable<FlowItemDetails[]>;
    emptyListText: string;
  }[] = [];
  flowTypeSelected$: Observable<Flow | undefined>;
  flowItemDetailsLoaded$: Observable<boolean>;
  triggersDetails$: Observable<FlowItemDetails[]>;
  constructor(private store: Store, private codeService: CodeService) {}

  ngOnInit(): void {
    this.flowItemDetailsLoaded$ = this.store
      .select(BuilderSelectors.selectAllFlowItemsDetailsLoadedState)
      .pipe(tap(console.log));
  }

  populateTabsAndTheirLists() {
    this.searchFormControl.setValue('', { emitEvent: false });
    this.tabsAndTheirLists = [];
    const coreItemsDetails$ = this._showTriggers
      ? this.store.select(BuilderSelectors.selectFlowItemDetailsForCoreTriggers)
      : this.store.select(BuilderSelectors.selectCoreFlowItemsDetails);
    const customPiecesItemDetails$ = this._showTriggers
      ? this.store.select(
          BuilderSelectors.selectFlowItemDetailsForCustomPiecesTriggers
        )
      : this.store.select(
          BuilderSelectors.selectFlowItemDetailsForCustomPiecesActions
        );

    const allItemDetails$ = forkJoin({
      apps: customPiecesItemDetails$.pipe(take(1)),
      core: coreItemsDetails$.pipe(take(1)),
    }).pipe(
      map((res) => {
        return [...res.core, ...res.apps];
      })
    );
    this.tabsAndTheirLists.push({
      displayName: 'All',
      list$: this.applySearchToObservable(allItemDetails$),
      emptyListText: "Oops! We didn't find any results.",
    });

    this.tabsAndTheirLists.push({
      displayName: 'Core',
      list$: this.applySearchToObservable(coreItemsDetails$),
      emptyListText: "Oops! We didn't find any results.",
    });

    this.tabsAndTheirLists.push({
      displayName: this._showTriggers ? 'App Events' : 'App Actions',
      list$: this.applySearchToObservable(customPiecesItemDetails$),
      emptyListText: "Oops! We didn't find any results.",
    });
  }

  closeSidebar() {
    this.store.dispatch(
      FlowsActions.setRightSidebar({
        sidebarType: RightSideBarType.NONE,
        props: {},
      })
    );
  }

  onTypeSelected(flowItemDetails: FlowItemDetails) {
    this.flowTypeSelected$ = forkJoin({
      currentFlow: this.store
        .select(BuilderSelectors.selectCurrentFlow)
        .pipe(take(1)),
      rightSideBar: this.store
        .select(BuilderSelectors.selectCurrentRightSideBar)
        .pipe(take(1)),
    }).pipe(
      take(1),
      tap((results) => {
        if (!results.currentFlow) {
          return;
        }
        if (this._showTriggers) {
          this.replaceTrigger(flowItemDetails);
        } else {
          const operation = this.constructOperation(
            (results.rightSideBar.props as StepTypeSideBarProps).stepName,
            results.currentFlow.version!,
            flowItemDetails.type as ActionType,
            flowItemDetails,
            (results.rightSideBar.props as StepTypeSideBarProps)
              .stepLocationRelativeToParent
          );

          this.store.dispatch(
            FlowsActions.addAction({
              operation: operation,
            })
          );
        }
      }),
      map((results) => {
        return results[0];
      })
    );
  }

  private replaceTrigger(triggerDetails: FlowItemDetails) {
    const base = {
      name: 'trigger',
      nextAction: undefined,
      displayName: getDisplayNameForTrigger(triggerDetails.type as TriggerType),
    };
    let trigger: Trigger;
    switch (triggerDetails.type as TriggerType) {
      case TriggerType.EMPTY:
        trigger = {
          ...base,
          valid: false,
          type: TriggerType.EMPTY,
          settings: {},
        };
        break;
      case TriggerType.SCHEDULE:
        trigger = {
          ...base,
          valid: true,
          type: TriggerType.SCHEDULE,
          settings: {
            cronExpression: defaultCronJobForScheduleTrigger,
          },
        };
        break;
      case TriggerType.WEBHOOK:
        trigger = {
          ...base,
          valid: true,
          type: TriggerType.WEBHOOK,
          settings: {},
        };
        break;
      case TriggerType.PIECE:
        trigger = {
          ...base,
          type: TriggerType.PIECE,
          valid: false,
          settings: {
            pieceName: triggerDetails.extra!.appName,
            pieceVersion: '0.0.1',
            triggerName: '',
            input: {},
          },
        };
        break;
    }
    this.store.dispatch(
      FlowsActions.updateTrigger({
        operation: trigger,
      })
    );
  }

  constructOperation(
    parentStep: string,
    flowVersion: FlowVersion,
    actionType: ActionType,
    flowItemDetails: FlowItemDetails,
    stepLocationRelativeToParent: StepLocationRelativeToParent
  ): AddActionRequest {
    const baseProps = {
      name: FlowStructureUtil.findAvailableName(flowVersion, 'step'),
      displayName: getDefaultDisplayNameForPiece(
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
              artifact: this.codeService.helloWorldBase64(),
              artifactSourceId: '',
              artifactPackagedId: '',
              input: {},
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
              items: [],
            },
          },
        };
      }
      case ActionType.PIECE: {
        const componentDetails = flowItemDetails as ComponentItemDetails;
        return {
          parentStep: parentStep,
          stepLocationRelativeToParent: stepLocationRelativeToParent,
          action: {
            ...baseProps,
            type: ActionType.PIECE,
            valid: false,
            settings: {
              pieceName: componentDetails.extra!.appName,
              pieceVersion: '0.0.1',
              actionName: undefined,
              input: {},
              inputUiInfo: {
                customizedInputs: {},
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
            },
          },
        };
      }
    }
  }

  applySearchToObservable(
    obs$: Observable<FlowItemDetails[]>
  ): Observable<FlowItemDetails[]> {
    return combineLatest({
      items: obs$,
      search: this.searchFormControl.valueChanges.pipe(
        startWith(''),
        map((search) => (search ? search : ''))
      ),
    }).pipe(
      map((res) => {
        return res.items.filter(
          (item) =>
            item.description
              .toLowerCase()
              .includes(res.search.trim().toLowerCase()) ||
            item.name.toLowerCase().includes(res.search.trim().toLowerCase())
        );
      })
    );
  }
}
