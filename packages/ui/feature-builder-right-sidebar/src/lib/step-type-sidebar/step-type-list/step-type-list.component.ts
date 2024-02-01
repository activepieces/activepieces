import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FlowItemDetails } from '@activepieces/ui/common';
import { ActionOrTriggerName } from '../const';

@Component({
  selector: 'app-step-type-list',
  templateUrl: './step-type-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepTypeListComponent {
  @Input() typesList: FlowItemDetails[];
  @Output() typeSelected: EventEmitter<FlowItemDetails> = new EventEmitter();
  @Output() actionOrTriggerSelected: EventEmitter<{
    actionOrTriggerName: ActionOrTriggerName;
    flowItemDetails: FlowItemDetails;
  }> = new EventEmitter();
  @Input() emptyListText: string;
  @Input() showRequestPieceButton: boolean | null;
  requestPiece() {
    window.open(
      'https://www.activepieces.com/pieces-roadmap',
      '_blank',
      'noopener'
    );
  }
  actionOrTirggerClicked(
    flowItemDetails: FlowItemDetails,
    actionOrTriggerName: {
      displayName: string;
      name: string;
    }
  ) {
    this.actionOrTriggerSelected.emit({
      actionOrTriggerName,
      flowItemDetails,
    });
  }
}
