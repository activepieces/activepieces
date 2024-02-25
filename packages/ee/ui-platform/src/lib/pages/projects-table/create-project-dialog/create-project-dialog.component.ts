import { ProjectWithLimits } from '@activepieces/shared';
import { PlatformProjectService } from '@activepieces/ui/common';
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
    private platformProjectService: PlatformProjectService
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
    //Create project logic
    if (this.formGroup.valid && !this.loading) {
      this.createProject$ = this.platformProjectService
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
