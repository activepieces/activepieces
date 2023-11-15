import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FlowItem,
  FlowRendererService,
} from '@activepieces/ui/feature-builder-store';
import {
  ActionType,
  FlowDrawer,
  TriggerType,
  Action,
  Trigger,
} from '@activepieces/shared';

@Component({
  selector: 'app-flow-item-tree',
  templateUrl: './flow-item-tree.component.html',
})
export class FlowItemTreeComponent implements OnInit {
  activePiece$: Observable<FlowItem | undefined>;
  navbarOpen = false;
  flowDrawer: FlowDrawer = FlowDrawer.construct(nestedBranching).offset(
    800,
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

const nestedBranching: Trigger = {
  type: TriggerType.EMPTY,
  displayName: 'http',
  name: 'http',
  settings: {},
  valid: false,
  nextAction: {
    type: ActionType.BRANCH,
    displayName: 'branch',
    name: 'branch',
    onFailureAction: codeStep,
    onSuccessAction: codeStep,
  },
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
