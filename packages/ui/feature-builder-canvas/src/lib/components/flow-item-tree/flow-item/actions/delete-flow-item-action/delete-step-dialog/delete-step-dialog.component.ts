import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { FlowsActions } from '@activepieces/ui/feature-builder-store';
import { ActionType, TriggerType } from '@activepieces/shared';

export type DeleteStepDialogData = {
  stepName: string;
  type: ActionType | TriggerType;
};

@Component({
  selector: 'app-delete-step-dialog',
  templateUrl: './delete-step-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteStepDialogComponent {
  readonly ActionType = ActionType;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: DeleteStepDialogData,
    private dialogRef: MatDialogRef<DeleteStepDialogComponent>,
    private store: Store
  ) {}
  deleteStep() {
    this.store.dispatch(
      FlowsActions.deleteAction({ operation: { name: this.data.stepName } })
    );
    this.dialogRef.close(true);
  }
}
