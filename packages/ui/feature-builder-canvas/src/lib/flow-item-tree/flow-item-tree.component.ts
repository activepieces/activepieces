import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FlowItem,
  FlowRendererService,
} from '@activepieces/ui/feature-builder-store';
import {
  ActionType,
  TriggerType,
  Action,
  Trigger,
  LoopOnItemsAction,
} from '@activepieces/shared';
import { FlowDrawer } from '../canvas-utils/drawing/flow-drawer';

@Component({
  selector: 'app-flow-item-tree',
  templateUrl: './flow-item-tree.component.html',
})
export class FlowItemTreeComponent implements OnInit {
  activePiece$: Observable<FlowItem | undefined>;
  navbarOpen = false;
  flowDrawer: FlowDrawer = FlowDrawer.construct(nestedBranching).offset(
    700,
    40
  );

  constructor(private flowService: FlowRendererService) {}

  ngOnInit(): void {
    this.activePiece$ = this.flowService.structureChanged;
  }
}

const codeStep: Action = {
  type: ActionType.CODE,
  displayName: 'code',
  name: 'code',
  settings: {
    sourceCode: {
      packageJson: 'javascript',
      code: 'console.log("Hello world")',
    },
    input: {},
    inputUiInfo: {},
  },
  valid: true,
};

const loop: LoopOnItemsAction = {
  type: ActionType.LOOP_ON_ITEMS,
  displayName: 'loop',
  name: 'loop',
  firstLoopAction: codeStep,
  settings: {
    items: 'asd',
  },
  nextAction: {
    type: ActionType.BRANCH,
    displayName: 'branch',
    name: 'branch',
    onSuccessAction: codeStep,
    onFailureAction: codeStep,
    settings: {
      conditions: [],
      inputUiInfo: {
        currentSelectedData: 'data',
      },
    },
    valid: true,
  },
  valid: true,
};

const nestedBranching: Trigger = {
  type: TriggerType.EMPTY,
  displayName: 'http',
  name: 'http',
  settings: {},
  valid: false,
  nextAction: loop,
};
/*nextAction: {
      type: ActionType.BRANCH,
      displayName: 'branch',
      name: 'branch',
      //onSuccessAction: codeStep,
      onSuccessAction: {
        type: ActionType.BRANCH,
        displayName: 'branch',
        name: 'branch',
        onSuccessAction: codeStep,
        onFailureAction: codeStep,
        settings: {
          conditions: [],
          inputUiInfo: {
            currentSelectedData: 'data',
          },
        },
        valid: true,
      },
      onFailureAction: codeStep,
      settings: {
        conditions: [],
        inputUiInfo: {
          currentSelectedData: 'data',
        },
      },
      valid: true,
    },*/
