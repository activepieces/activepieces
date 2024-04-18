import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FlowItemDetails } from '@activepieces/ui/common';
import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';

@Component({
  selector: 'app-step-type-list',
  templateUrl: './step-type-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepTypeListComponent {
  @Input() typesList: FlowItemDetails[];
  @Output() typeSelected: EventEmitter<{
    flowItemDetails: FlowItemDetails;
    suggestion?: ActionBase | TriggerBase;
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
}
