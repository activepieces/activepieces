import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Project } from '@activepieces/shared';

interface UpdateProjectForm {
  displayName: FormControl<string>;
}
@Component({
  selector: 'app-update-project-dialog',
  templateUrl: './update-project-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateProjectDialogComponent {
  formGroup: FormGroup<UpdateProjectForm>;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { project: Project }
  ) {
    this.formGroup = this.fb.group({
      displayName: this.fb.control(
        {
          value: this.data.project.displayName,
          disabled: false,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
    });
  }
  updateProject() {
    //update project logic
    if (this.formGroup.valid) this.dialogRef.close(true);
  }
}
