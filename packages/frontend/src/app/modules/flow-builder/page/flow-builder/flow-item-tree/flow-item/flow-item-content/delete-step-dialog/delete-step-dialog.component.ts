import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { FlowsActions } from 'src/app/modules/flow-builder/store/action/flows.action';

@Component({
	selector: 'app-delete-step-dialog',
	templateUrl: './delete-step-dialog.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteStepDialogComponent {
	confirmationForm: FormGroup<{ confirmation: FormControl<string> }>;
	constructor(
		private formBuilder: FormBuilder,
		@Inject(MAT_DIALOG_DATA) public stepName: string,
		private dialogRef: MatDialogRef<DeleteStepDialogComponent>,
		private store: Store
	) {
		this.confirmationForm = this.formBuilder.group({
			confirmation: new FormControl('', {
				nonNullable: true,
				validators: [Validators.required, Validators.pattern('DELETE')],
			}),
		});
	}
	deleteStep() {
		if (this.confirmationForm.valid) {
			this.store.dispatch(FlowsActions.deleteAction({operation :{ name: this.stepName }}));
			this.dialogRef.close(true);
		}
	}
}
