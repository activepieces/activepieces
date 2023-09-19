import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ActionType,
  BranchAction,
  LoopOnItemsAction,
} from '@activepieces/shared';
import { FlowItem } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-flow-item-connection',
  templateUrl: './flow-item-connection.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowItemConnectionComponent {
  @Input() flowItem: FlowItem;
  @Input() readOnly: boolean;
  @Input() insideLoopOrBranch = false;

  get ActionType() {
    return ActionType;
  }

  castToLoopItem() {
    return this.flowItem as LoopOnItemsAction;
  }

  castToBranchItem() {
    return this.flowItem as BranchAction;
  }
}
