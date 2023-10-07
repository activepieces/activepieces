import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  TemplateRef
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  FlagService,
  ProjectSelectors,
  TelemetryService,
  TemplatesService
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
  tap
} from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { ShareFlowRequest } from '@activepieces/ee-shared';
import { ApFlagId, FlowTemplate, TelemetryEventName } from '@activepieces/shared';

@Component({
  selector: 'ap-share-flow-template-dialog',
  templateUrl: './share-flow-template-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShareFlowTemplateDialogComponent {
  form: FormGroup<{
    description: FormControl<string>;
    featuredDescription: FormControl<string>;
    isFeatured: FormControl<boolean>;
    tags: FormControl<string[]>;
    imageUrl: FormControl<string>;
    blogUrl: FormControl<string>;
  }>;
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
    this.isPublicTemplatesProject$ = combineLatest({
      templateProjectId: this.flagsService.getAllFlags().pipe(
        map((flags) => {
          return flags[ApFlagId.TEMPLATES_PROJECT_ID] as string;
        })
      ),
      project: this.store.select(ProjectSelectors.selectProject)
    }).pipe(
      map(({ templateProjectId, project }) => {
        return templateProjectId === project.id;
      })
    );
    this.form = this.fb.group({
      blogUrl: new FormControl('', { nonNullable: true }),
      description: new FormControl('', { nonNullable: true }),
      imageUrl: new FormControl<string>('',{nonNullable:true}),
      tags: new FormControl<string[]>([''], { nonNullable: true }),
      isFeatured: new FormControl(false, { nonNullable: true }),
      featuredDescription: new FormControl('', { nonNullable: true }),
    });
  }
  submit() {
    if (!this.loading) {
      this.loading = true;
      this.shareFlow$ = this.store
        .select(BuilderSelectors.selectCurrentFlow)
        .pipe(
          take(1),
          switchMap((flow) => {
            const request: ShareFlowRequest = {
              description: this.form.value.description,
              flowId: flow.id,
              flowVersionId: flow.version.id,
              blogUrl: this.form.value.blogUrl,
              imageUrl: this.form.value.imageUrl,
              tags: this.form.value.tags,
              featuredDescription:this.form.value.featuredDescription,
              isFeatured: this.form.value.isFeatured
            };
            this.telemetryService.capture({
              name: TelemetryEventName.FLOW_SHARED,
              payload: {
                flowId: flow.id,
                projectId: flow.projectId
              }
            })
            return this.templatesService.shareTemplate(request).pipe(
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
              description: template.description,
              blogUrl: template.blogUrl,
              imageUrl:template.imageUrl || '',
              tags: template.tags,
              featuredDescription:template.featuredDescription,
              isFeatured:template.isFeatured
            });
          }
        })
      );
    this.dialogService.open(template);
  }
}
