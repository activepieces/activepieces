import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Project } from '@activepieces/shared';
import { Observable, catchError, tap } from 'rxjs';
import { ProjectService } from '@activepieces/ui/common';

interface UpdateProjectForm {
  displayName: FormControl<string>;
}
export type UpdateProjectDialogData = {
  project: Project;
};
@Component({
  selector: 'app-update-project-dialog',
  templateUrl: './update-project-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateProjectDialogComponent {
  formGroup: FormGroup<UpdateProjectForm>;
  loading = false;
  updateProject$?: Observable<Project>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: UpdateProjectDialogData,
    private projectService: ProjectService
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
    if (this.formGroup.valid && !this.loading) {
      this.loading = true;
      this.updateProject$ = this.projectService
        .update(this.data.project.id, {
          displayName: this.formGroup.getRawValue().displayName,
          notifyStatus: this.data.project.notifyStatus,
        })
        .pipe(
          tap(() => {
            this.dialogRef.close(true);
            this.loading = false;
          }),
          catchError((err) => {
            console.error(err);
            this.loading = false;
            throw err;
          })
        );
    }
  }
}
