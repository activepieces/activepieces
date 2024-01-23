import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
export interface UseAsDraftConfirmationDialogData {
  versionNumber: number;
}

@Component({
  selector: 'app-use-as-draft-confirmation-dialog',
  templateUrl: './use-as-draft-confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseAsDraftConfirmationDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<UseAsDraftConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: UseAsDraftConfirmationDialogData
  ) {}

  confirm() {
    this.dialogRef.close(true);
  }
}
