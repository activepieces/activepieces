import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Step } from '@activepieces/ui/feature-builder-store';
import { DeleteStepDialogComponent } from './delete-step-dialog/delete-step-dialog.component';

@Component({
  selector: 'app-delete-flow-item-action',
  templateUrl: './delete-flow-item-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteFlowItemActionComponent {
  @Input()
  flowItem: Step;
  constructor(private dialogService: MatDialog) {}
  deleteStep() {
    const stepName = this.flowItem.name;
    if (stepName == undefined) {
      return;
    }
    this.dialogService.open(DeleteStepDialogComponent, { data: stepName });
  }
}
