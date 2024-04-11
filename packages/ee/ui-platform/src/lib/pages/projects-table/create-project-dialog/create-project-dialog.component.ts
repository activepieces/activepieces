import { ProjectWithLimits } from '@activepieces/shared';
import { ProjectService } from '@activepieces/ui/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, catchError, tap } from 'rxjs';

interface CreateProjectForm {
  displayName: FormControl<string>;
}
@Component({
  selector: 'app-create-project-dialog',
  templateUrl: './create-project-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectDialogComponent {
  formGroup: FormGroup<CreateProjectForm>;
  loading = false;
  createProject$?: Observable<ProjectWithLimits>;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    private projectService: ProjectService
  ) {
    this.formGroup = this.fb.group({
      displayName: this.fb.control(
        {
          value: '',
          disabled: false,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
    });
  }
  createProject() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid && !this.loading) {
      this.createProject$ = this.projectService
        .create({
          displayName: this.formGroup.getRawValue().displayName,
        })
        .pipe(
          tap((res) => {
            this.loading = true;
            this.dialogRef.close(res);
          }),
          catchError((err) => {
            console.error(err);
            throw err;
          })
        );
    }
  }
}
