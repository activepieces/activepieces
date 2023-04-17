import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';
import { Flow } from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delete-flow-dialog',
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
    private flowService: FlowService,
    private router: Router
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
      this.deleteFlow$ = this.flowService.delete(this.flow.id).pipe(
        tap(() => {
          this.router.navigate(['/']);
          this.dialogRef.close();
        })
      );
    }
  }
}
