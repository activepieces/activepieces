import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FlowService } from '@activepieces/ui/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FlowOperationType, PopulatedFlow } from '@activepieces/shared';
import { Observable, tap } from 'rxjs';

export type RenameFlowDialogData = {
  flow: PopulatedFlow;
};

@Component({
  selector: 'app-rename-flow-dialog',
  templateUrl: './rename-flow-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameFlowDialogComponent {
  form: FormGroup<{ displayName: FormControl<string> }>;
  rename$?: Observable<PopulatedFlow>;
  constructor(
    private flowService: FlowService,
    private fb: FormBuilder,
    private matDialogRef: MatDialogRef<RenameFlowDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: RenameFlowDialogData
  ) {
    this.form = this.fb.group({
      displayName: new FormControl(this.data.flow.version.displayName, {
        nonNullable: true,
        validators: Validators.required,
      }),
    });
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid && !this.rename$) {
      this.rename$ = this.flowService
        .update(this.data.flow.id, {
          type: FlowOperationType.CHANGE_NAME,
          request: {
            displayName: this.form.getRawValue().displayName,
          },
        })
        .pipe(
          tap(() => {
            this.matDialogRef.close(true);
          })
        );
    }
  }
}
