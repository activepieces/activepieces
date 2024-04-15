import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectService, UiCommonModule } from '@activepieces/ui/common';
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
import {
  ApFlagId,
  ProjectMemberRole,
  ProjectWithLimits,
} from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { ProjectMemberService } from 'ee-project-members';

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
  readonly permissionMessage = $localize`You don\'t have permissions to edit project settings`;
  formGroup: FormGroup<UpdateProjectForm>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  saving$: Observable<void>;
  project$: Observable<ProjectWithLimits>;
  initForm$: Observable<boolean>;
  projectLimitsEnabled: boolean;
  canSave$: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private matSnackbar: MatSnackBar,
    private projectMemberService: ProjectMemberService
  ) {
    this.projectLimitsEnabled =
      this.route.snapshot.data['flags'][ApFlagId.PROJECT_LIMITS_ENABLED];

    this.canSave$ = this.projectMemberService.isRole(ProjectMemberRole.ADMIN);
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
    this.project$ = this.projectService.currentProject$.pipe(
      map((project) => project!)
    );
    this.initForm$ = this.project$.pipe(
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
        return true;
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
        tap(() => {
          this.matSnackbar.open($localize`Saved successfully`);
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
