import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AuthenticationService,
  PlatformProjectService,
  ProjectActions,
  ProjectSelectors,
  UiCommonModule,
} from '@activepieces/ui/common';
import { AsyncPipe } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  ApFlagId,
  ProjectMemberRole,
  ProjectWithLimits,
} from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

interface UpdateProjectForm {
  displayName: FormControl<string>;
  teamMembers?: FormControl<number>;
  tasks?: FormControl<number>;
}

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, UiCommonModule],
})
export class GeneralSettingsComponent {
  readonly permissionMessage = $localize` 'You don\'t have permissions to edit project settings'`;
  formGroup: FormGroup<UpdateProjectForm>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  saving$: Observable<void>;
  project$: Observable<ProjectWithLimits>;
  updateForm$: Observable<void>;
  projectLimitsEnabled: boolean;
  canSave$: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private projectService: PlatformProjectService,
    private authenticationService: AuthenticationService,
    private matSnackbar: MatSnackBar
  ) {
    this.projectLimitsEnabled =
      this.route.snapshot.data['flags'][ApFlagId.PROJECT_LIMITS_ENABLED];

    this.canSave$ = this.authenticationService.currentUserSubject.pipe(
      map((user) => user?.projectRole === ProjectMemberRole.ADMIN)
    );
    const projectLimitsForm = {
      tasks: this.fb.control(
        {
          value: 50000,
          disabled: false,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
      teamMembers: this.fb.control(
        {
          value: 5,
          disabled: false,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
    };
    this.formGroup = this.fb.group({
      displayName: this.fb.control(
        {
          value: 'Untitled',
          disabled: false,
        },
        {
          nonNullable: true,
          validators: Validators.required,
        }
      ),
      ...(this.projectLimitsEnabled ? projectLimitsForm : {}),
    });
    this.project$ = this.store.select(ProjectSelectors.selectCurrentProject);
    this.updateForm$ = this.project$.pipe(
      tap((project) => {
        this.formGroup.patchValue({
          displayName: project.displayName,
          tasks: project.plan?.tasks,
          teamMembers: project.plan?.teamMembers,
        });
      }),
      switchMap(() => this.canSave$),
      tap((canSave) => {
        if (!canSave) {
          this.formGroup.disable();
        } else {
          this.formGroup.enable();
        }
      }),
      map(() => {
        return void 0;
      })
    );
  }

  save() {
    if (this.formGroup.valid && !this.loading$.value) {
      this.loading$.next(true);
      this.saving$ = this.project$.pipe(
        take(1),
        switchMap((project) => {
          return this.projectService.update(project.id, {
            displayName: this.formGroup.getRawValue().displayName,
            notifyStatus: project.notifyStatus,
            plan: !this.projectLimitsEnabled
              ? undefined
              : {
                  tasks: this.formGroup.getRawValue().tasks,
                  teamMembers: this.formGroup.getRawValue().teamMembers,
                },
          });
        }),
        tap((updatedProject) => {
          this.matSnackbar.open($localize`Saved successfully`);
          this.store.dispatch(
            ProjectActions.updateProject({ project: updatedProject })
          );
          this.loading$.next(false);
        }),
        catchError((error) => {
          console.error(error);
          this.matSnackbar.open(
            $localize`Error occurred while saving, please try again`,
            '',
            { panelClass: 'error' }
          );
          this.loading$.next(false);
          return of(undefined);
        }),
        map(() => {
          return void 0;
        })
      );
    }
  }
}
