import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { FlowsActions } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-delete-step-dialog',
  templateUrl: './delete-step-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteStepDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public stepName: string,
    private dialogRef: MatDialogRef<DeleteStepDialogComponent>,
    private store: Store
  ) {}
  deleteStep() {
    this.store.dispatch(
      FlowsActions.deleteAction({ operation: { name: this.stepName } })
    );
    this.dialogRef.close(true);
  }
}
