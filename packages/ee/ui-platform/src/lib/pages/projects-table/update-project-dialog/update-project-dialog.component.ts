import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, catchError, tap } from 'rxjs';
import { PlatformProjectService } from '@activepieces/ui/common';
import { ProjectWithLimits } from '@activepieces/shared';

interface UpdateProjectForm {
  displayName: FormControl<string>;
  teamMembers: FormControl<number>;
  tasks: FormControl<number>;
}
export type UpdateProjectDialogData = {
  project: ProjectWithLimits;
};
@Component({
  selector: 'app-update-project-dialog',
  templateUrl: './update-project-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateProjectDialogComponent {
  formGroup: FormGroup<UpdateProjectForm>;
  loading = false;
  updateProject$?: Observable<ProjectWithLimits>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: UpdateProjectDialogData,
    private projectService: PlatformProjectService
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
      tasks: this.fb.control(
        {
          value: this.data.project.plan.tasks,
          disabled: false,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
      teamMembers: this.fb.control(
        {
          value: this.data.project.plan.teamMembers,
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
          plan: {
            tasks: this.formGroup.getRawValue().tasks,
            teamMembers: this.formGroup.getRawValue().teamMembers,
          },
        })
        .pipe(
          tap((res) => {
            this.dialogRef.close(res);
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
