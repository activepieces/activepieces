import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { UiCommonModule } from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import {
  InvitationType,
  PlatformRole,
  ProjectMemberRole,
  isNil,
} from '@activepieces/shared';
import { LottieModule } from 'ngx-lottie';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialogRef } from '@angular/material/dialog';
import { RolesDisplayNames } from '@ee/ui/project-members/src/lib/utils';

@Component({
  templateUrl: './invite-user-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, UiCommonModule, LottieModule],
})
export class InviteUserDialogComponent {
  readonly dialogTitle = $localize`Invite User`;
  loading$ = new BehaviorSubject(false);
  readonly platformRole = PlatformRole;
  readonly projectRole = ProjectMemberRole;
  readonly invitationType = InvitationType;

  formGroup: FormGroup<{
    email: FormControl<string>;
    type: FormControl<InvitationType>;
    platformRole: FormControl<PlatformRole>;
    projectRole: FormControl<ProjectMemberRole>;
  }>;
  invitationTypeSubject: BehaviorSubject<InvitationType> =
    new BehaviorSubject<InvitationType>(InvitationType.PROJECT);

  readonly projectMemberRolesOptions = Object.values(ProjectMemberRole)
    .filter((f) => !isNil(RolesDisplayNames[f]))
    .map((role) => {
      return {
        value: role,
        name: RolesDisplayNames[role],
      };
    });

  constructor(
    private fb: FormBuilder,
    private clipboard: Clipboard,
    private matsnackbar: MatSnackBar,
    private dialogRef: MatDialogRef<InviteUserDialogComponent>
  ) {
    this.formGroup = this.fb.group({
      email: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      type: this.fb.control<InvitationType>(this.invitationTypeSubject.value, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      platformRole: this.fb.control<PlatformRole>(PlatformRole.ADMIN, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      projectRole: this.fb.control<ProjectMemberRole>(ProjectMemberRole.ADMIN, {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  listenForInvitationTypeChange(type: InvitationType) {
    this.invitationTypeSubject.next(type);
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      this.loading$.next(true);
    }
  }

  close() {
    this.dialogRef.close();
  }

  copy(text: string) {
    this.clipboard.copy(text);
    this.matsnackbar.open('Copied to clipboard', '', {
      duration: 2000,
    });
  }
}
