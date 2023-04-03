import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AuthenticationService } from '@activepieces/ui/common';

import { FlowItemDetails } from '../step-type-item/flow-item-details';

@Component({
  selector: 'app-step-type-list',
  templateUrl: './step-type-list.component.html',
  styleUrls: ['./step-type-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepTypeListComponent {
  @Input() typesList: FlowItemDetails[];
  @Output() typeSelected: EventEmitter<FlowItemDetails> = new EventEmitter();
  @Input() emptyListText: string;

  constructor(private authenticationService: AuthenticationService) {}
  openFeedbackPopover() {
    this.authenticationService.openFeedbackPopover$.next();
  }
}
