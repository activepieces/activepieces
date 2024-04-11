import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { GitBranchType, GitRepo } from '@activepieces/ee-shared';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, switchMap, tap } from 'rxjs';
import { SyncProjectService } from '../../../services/sync-project.service';
import { AsyncPipe } from '@angular/common';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatError, MatHint } from '@angular/material/form-field';
import { ProjectService, UiCommonModule } from '@activepieces/ui/common';

type ConfigureRepoDialogData = {
  repo?: GitRepo;
};
type ConfigureRepoDialogForm = {
  slug: FormControl<string>;
  remoteUrl: FormControl<string>;
  branch: FormControl<string>;
  branchType: FormControl<GitBranchType>;
  sshPrivateKey: FormControl<string>;
};
@Component({
  selector: 'app-configure-repo-dialog',
  templateUrl: './configure-repo-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    UiCommonModule,
    MatDialogContent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatHint,
    MatDialogActions,
    MatDialogClose,
    AsyncPipe,
  ],
})
export class ConfigureRepoDialogComponent {
  GitBranchType = GitBranchType
  title = $localize`Configure Repo`;
  configureRepoForm: FormGroup<ConfigureRepoDialogForm>;
  configureRepo$?: Observable<GitRepo>;
  constructor(
    private projectService: ProjectService,
    private syncProjectService: SyncProjectService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConfigureRepoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: ConfigureRepoDialogData
  ) {
    if (this.data?.repo) {
      this.title = $localize`Edit ${this.data.repo.remoteUrl}`;
    }

    this.configureRepoForm = this.fb.group({
      slug: new FormControl(this.data?.repo?.slug || '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      branch: new FormControl(this.data?.repo?.branch || '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      branchType: new FormControl(this.data?.repo?.branchType || GitBranchType.DEVELOPMENT, {
        nonNullable: true,
        validators: Validators.required,
      }),
      remoteUrl: new FormControl(this.data?.repo?.remoteUrl || '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      sshPrivateKey: new FormControl(this.data?.repo?.sshPrivateKey || '', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(
            /^-----BEGIN ((RSA|DSA|EC|OPENSSH) )?PRIVATE KEY-----\r?\n([A-Za-z0-9/+=]+\r?\n)+-----END ((RSA|DSA|EC|OPENSSH) )?PRIVATE KEY-----\n$/m
          ),
        ],
      }),
    });
  }
  submit() {
    this.configureRepoForm.markAllAsTouched();
    if (this.configureRepoForm.valid && !this.configureRepo$) {
      this.configureRepo$ = this.projectService.currentProject$
        .pipe(
          switchMap((project) => {
            return this.syncProjectService
              .configure({
                ...this.configureRepoForm.getRawValue(),
                projectId: project!.id,
              })
              .pipe(
                tap((res) => {
                  this.dialogRef.close(res);
                })
              );
          })
        );
    }
  }
}
