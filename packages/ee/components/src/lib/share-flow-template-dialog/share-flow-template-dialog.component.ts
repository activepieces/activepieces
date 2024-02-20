import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  TemplateRef,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  FlagService,
  ProjectSelectors,
  TelemetryService,
  TemplatesService,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import {
  Observable,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import {
  ApEdition,
  ApFlagId,
  FlowTemplate,
  PopulatedFlow,
  TelemetryEventName,
  TemplateType,
} from '@activepieces/shared';
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared';

@Component({
  selector: 'ap-share-flow-template-dialog',
  templateUrl: './share-flow-template-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareFlowTemplateDialogComponent {
  form: FormGroup<{
    description: FormControl<string>;
    tags: FormControl<string[]>;
    blogUrl: FormControl<string>;
  }>;
  @Input({ required: true }) flow!: PopulatedFlow;
  shareTemplateMarkdown = `
  Generate or update a template link for the current flow to easily share it with others. 
  <br>
  <br>
  The template will not have any credentials in connection fields, keeping sensitive information secure.
  `;
  shareFlow$: Observable<void> | undefined;
  loadExistingTemplate$:
    | Observable<FlowTemplate | Record<string, never>>
    | undefined;
  loading = false;
  isPublicTemplatesProject$: Observable<boolean>;
  show$: Observable<boolean>;
  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private flagsService: FlagService,
    private dialogService: MatDialog,
    private templatesService: TemplatesService,
    private store: Store,
    private cd: ChangeDetectorRef,
    private telemetryService: TelemetryService
  ) {
    this.show$ = this.flagsService
      .getEdition()
      .pipe(map((ed) => ed === ApEdition.CLOUD));
    this.isPublicTemplatesProject$ = combineLatest({
      templateProjectId: this.flagsService.getAllFlags().pipe(
        map((flags) => {
          return flags[ApFlagId.TEMPLATES_PROJECT_ID] as string;
        })
      ),
      project: this.store.select(ProjectSelectors.selectCurrentProject),
    }).pipe(
      map(({ templateProjectId, project }) => {
        return templateProjectId === project.id;
      })
    );
    this.form = this.fb.group({
      blogUrl: new FormControl('', { nonNullable: true }),
      description: new FormControl('', { nonNullable: true }),
      tags: new FormControl<string[]>([''], { nonNullable: true }),
    });
  }
  submit() {
    if (!this.loading) {
      this.loading = true;
      const request: CreateFlowTemplateRequest = {
        template: this.flow.version,
        type: TemplateType.PROJECT,
        blogUrl: this.form.value.blogUrl,
        tags: this.form.value.tags,
      };
      this.telemetryService.capture({
        name: TelemetryEventName.FLOW_SHARED,
        payload: {
          flowId: this.flow.id,
          projectId: this.flow.projectId,
        },
      });
      this.shareFlow$ = this.templatesService.create(request).pipe(
        switchMap((flowTemplate) => {
          return this.flagsService
            .getFrontendUrl()
            .pipe(map((url) => `${url}/templates/${flowTemplate.id}`));
        }),
        tap((url) => {
          this.dialogService.closeAll();
          navigator.clipboard.writeText(url);
          this.snackbar.open('Template URL copied to clipboard');
          window.open(url, '_blank');
          this.loading = false;
        }),
        map(() => {
          return void 0;
        })
      );

      this.cd.markForCheck();
    }
  }
  openDialog(template: TemplateRef<unknown>) {
    this.loadExistingTemplate$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        take(1),
        switchMap((flow) => {
          return this.templatesService.getTemplate(flow.id).pipe(
            catchError(() => {
              return of({});
            })
          );
        }),
        tap((template) => {
          if (template) {
            this.form.patchValue({
              blogUrl: template.blogUrl,
              tags: template.tags,
            });
          }
        })
      );
    this.dialogService.open(template);
  }
}
