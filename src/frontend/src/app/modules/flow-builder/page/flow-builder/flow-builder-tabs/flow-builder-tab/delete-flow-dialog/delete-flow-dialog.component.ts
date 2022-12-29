import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Flow } from 'src/app/modules/common/model/flow.class';
import { FlowsActions } from 'src/app/modules/flow-builder/store/action/flows.action';

@Component({
	templateUrl: './delete-flow-dialog.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteFlowDialogComponent {
	confirmationForm: FormGroup<{ confirmation: FormControl<string> }>;
	deleteFlow$: Observable<void>;
	constructor(
		private formBuilder: FormBuilder,
		@Inject(MAT_DIALOG_DATA) public flow: Flow,
		private dialogRef: MatDialogRef<DeleteFlowDialogComponent>,
		private store: Store
	) {
		this.confirmationForm = this.formBuilder.group({
			confirmation: new FormControl('', {
				nonNullable: true,
				validators: [Validators.required, Validators.pattern('DELETE')],
			}),
		});
	}
	deleteFlow() {
		if (this.confirmationForm.valid) {
			this.store.dispatch(FlowsActions.deleteFlow({ flowId: this.flow.id }));
			this.dialogRef.close(true);
		}
	}
}
