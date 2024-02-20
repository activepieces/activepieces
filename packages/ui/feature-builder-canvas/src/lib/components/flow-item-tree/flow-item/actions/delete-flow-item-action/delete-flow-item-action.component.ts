import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Step } from '@activepieces/ui/feature-builder-store';
import { DeleteStepDialogComponent } from './delete-step-dialog/delete-step-dialog.component';
import { ACTION_BUTTON_ICON_DIMENSION } from '../common';

@Component({
  selector: 'app-delete-flow-item-action',
  templateUrl: './delete-flow-item-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteFlowItemActionComponent {
  @Input()
  flowItem: Step;
  readonly ACTION_BUTTON_ICON_DIMENSION = ACTION_BUTTON_ICON_DIMENSION;
  constructor(private dialogService: MatDialog) {}
  deleteStep() {
    const stepName = this.flowItem.name;
    if (stepName == undefined) {
      return;
    }
    this.dialogService.open(DeleteStepDialogComponent, { data: stepName });
  }
}
