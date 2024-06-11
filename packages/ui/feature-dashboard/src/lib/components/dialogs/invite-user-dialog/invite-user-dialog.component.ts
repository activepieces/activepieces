import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import {
  AuthenticationService,
  NavigationService,
  ProjectService,
  UiCommonModule,
  UserInvitationService,
} from '@activepieces/ui/common';
import { CommonModule } from '@angular/common';
import {
  InvitationType,
  Platform,
  PlatformRole,
  ProjectMemberRole,
  isNil,
} from '@activepieces/shared';
import { LottieModule } from 'ngx-lottie';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RolesDisplayNames } from 'ee-project-members';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  platform$: Observable<Platform>;
  isPlatformOwner$: Observable<boolean>;
  invitationTypeSubject: BehaviorSubject<InvitationType> =
    new BehaviorSubject<InvitationType>(InvitationType.PROJECT);
  currentProjectName$: Observable<string | undefined>;
  sendUser$: Observable<void>;

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
    private userInvitationService: UserInvitationService,
    private projectService: ProjectService,
    private authService: AuthenticationService,
    private matsnackBar: MatSnackBar,
    private dialogRef: MatDialogRef<InviteUserDialogComponent>,
    private navigationService: NavigationService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      platform: Platform;
    }
  ) {
    this.currentProjectName$ = this.projectService.currentProject$.pipe(
      map((p) => p?.displayName)
    );
    this.isPlatformOwner$ = this.authService.isPlatformOwner$();
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
    if (data.platform.manageProjectsEnabled) {
      this.invitationTypeSubject.next(InvitationType.PROJECT);
      this.formGroup.controls.type.setValue(InvitationType.PROJECT);
    } else {
      this.invitationTypeSubject.next(InvitationType.PLATFORM);
      this.formGroup.controls.type.setValue(InvitationType.PLATFORM);
    }
  }

  listenForInvitationTypeChange(type: InvitationType) {
    this.invitationTypeSubject.next(type);
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      this.loading$.next(true);
      const { email, type, platformRole, projectRole } = this.formGroup.value;
      this.sendUser$ = this.userInvitationService
        .inviteUser({
          email: email!,
          type: type!,
          platformRole: platformRole!,
          projectRole:
            type === InvitationType.PLATFORM ? undefined : projectRole!,
        })
        .pipe(
          tap(() => {
            this.loading$.next(false);
            this.matsnackBar.open($localize`${email} invitation is sent`);
            this.navigationService.navigate({
              route:
                this.formGroup.value.type === InvitationType.PLATFORM
                  ? ['/platform/users']
                  : ['/team'],
            });
            this.dialogRef.close();
          })
        );
    }
  }

  close() {
    this.dialogRef.close();
  }
}
