import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { GitRepo } from '@activepieces/ee-shared';
import { ProjectSelectors } from '@activepieces/ui/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, switchMap, tap } from 'rxjs';
import { SyncProjectService } from '../../../services/sync-project.service';

type ConfigureRepoDialogData = {
  repo?: GitRepo;
};
type ConfigreRepoDialogForm = {
  slug: FormControl<string>;
  remoteUrl: FormControl<string>;
  branch: FormControl<string>;
  sshPrivateKey: FormControl<string>;
};
@Component({
  selector: 'app-configure-repo-dialog',
  templateUrl: './configure-repo-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigureRepoDialogComponent {
  title = $localize`Configure Repo`;
  projectIds$ = this.store.select(ProjectSelectors.selectCurrentProject);
  configureRepoForm: FormGroup<ConfigreRepoDialogForm>;
  configreRepo$?: Observable<GitRepo>;
  constructor(
    private store: Store,
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
    if (this.configureRepoForm.valid && !this.configreRepo$) {
      this.configreRepo$ = this.store
        .select(ProjectSelectors.selectCurrentProject)
        .pipe(
          switchMap((project) => {
            return this.syncProjectService
              .configureRepo({
                ...this.configureRepoForm.getRawValue(),
                projectId: project.id,
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
