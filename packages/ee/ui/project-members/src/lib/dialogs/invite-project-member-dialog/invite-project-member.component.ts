import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ProjectMemberService } from '../../service/project-members.service';
import { DialogRef } from '@angular/cdk/dialog';
import { HttpStatusCode } from '@angular/common/http';
import { ProjectMemberRole, isNil } from '@activepieces/shared';
import { AuthenticationService } from '@activepieces/ui/common';
import { RolesDisplayNames } from '../../utils';

@Component({
  templateUrl: './invite-project-member.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteProjectMemberDialogComponent {
  invitationForm: FormGroup<{
    email: FormControl<string>;
    role: FormControl<ProjectMemberRole>;
  }>;
  inviteMember$: Observable<void> | undefined;
  loading = false;
  invalidEmail = false;
  RolesDisplayNames = RolesDisplayNames;
  ProjectMemberRole = Object.values(ProjectMemberRole)
    .filter((f) => !isNil(RolesDisplayNames[f]))
    .map((role) => {
      return {
        role,
        condition$: of(true),
      };
    });
  constructor(
    private formBuilder: FormBuilder,
    private snackbar: MatSnackBar,
    private projectMemberService: ProjectMemberService,
    private authenticationService: AuthenticationService,
    private dialogRef: DialogRef
  ) {
    this.invitationForm = this.formBuilder.group({
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      role: new FormControl(ProjectMemberRole.EDITOR, {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }
  submit() {
    if (this.invitationForm.valid && !this.loading) {
      this.loading = true;
      this.invalidEmail = false;
      this.inviteMember$ = this.projectMemberService
        .invite({
          projectId: this.authenticationService.getProjectId(),
          email: this.invitationForm.value['email']!,
          role: this.invitationForm.value['role']!,
        })
        .pipe(
          catchError((err) => {
            this.invalidEmail = true;
            if (err.status === HttpStatusCode.Conflict) {
              this.invitationForm.controls['email'].setErrors({
                exists: true,
              });
            } else {
              this.snackbar.open(
                $localize`Internal error occurred please contact support`,
                '',
                {
                  duration: undefined,
                  panelClass: 'error',
                }
              );
            }
            this.loading = false;
            console.error(err);
            return of(err);
          }),
          map(() => {
            return void 0;
          }),
          tap(() => {
            if (!this.invalidEmail) {
              this.dialogRef.close();
            }
            this.loading = false;
          })
        );
    }
  }
}
