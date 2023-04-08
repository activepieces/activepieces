import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  AuthenticationService,
  FlowItemDetails,
} from '@activepieces/ui/common';

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
