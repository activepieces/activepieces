import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-delete-step-dialog',
	templateUrl: './confirm-cloud-auth-config-use-dialog.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmCloudAuthConfigUseDialog {
	constructor(private dialogRef: MatDialogRef<ConfirmCloudAuthConfigUseDialog>) {}
	useCloud() {
		this.dialogRef.close(true);
	}
}
