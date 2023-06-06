import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
} from '@angular/core';
import {
  Flow,
  FlowOperationType,
  FlowTemplate,
  FolderId,
} from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import { Observable, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CollectionBuilderService } from '@activepieces/ui/feature-builder-store';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  BLOG_URL_TOKEN,
  TemplateBlogNotificationComponent,
} from '../template-blog-notification/template-blog-notification.component';
@Component({
  selector: 'app-template-card',
  templateUrl: './template-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCardComponent implements AfterViewInit {
  useTemplate$: Observable<Flow>;
  @Output() useTemplateClicked = new EventEmitter<FlowTemplate>();
  @Input() template: FlowTemplate;
  @Input() insideBuilder = true;
  @Input() showBtnOnHover = false;
  @Input() folderId?: FolderId | null;
  constructor(
    private flowService: FlowService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private matDialog: MatDialog,
    private builderService: CollectionBuilderService
  ) {}
  useTemplate() {
    if (!this.useTemplate$ && !this.insideBuilder) {
      this.useTemplate$ = this.flowService
        .create({
          displayName: this.template.name,
          folderId: this.folderId || undefined,
        })
        .pipe(
          switchMap((flow) => {
            return this.flowService
              .update(flow.id, {
                type: FlowOperationType.IMPORT_FLOW,
                request: this.template.template,
              })
              .pipe(
                tap((updatedFlow: Flow) => {
                  if (this.template.blogUrl) {
                    this.builderService.componentToShowInsidePortal$.next(
                      new ComponentPortal(
                        TemplateBlogNotificationComponent,
                        null,
                        Injector.create({
                          providers: [
                            {
                              provide: BLOG_URL_TOKEN,
                              useValue: this.template.blogUrl,
                            },
                          ],
                        })
                      )
                    );
                  }
                  this.router.navigate(['flows', updatedFlow.id]);
                })
              );
          })
        );
      this.matDialog.closeAll();
    }
    this.useTemplateClicked.emit(this.template);
  }
  ngAfterViewInit(): void {
    //This is a workaround to make tooltip appear.
    setTimeout(() => {
      this.cd.markForCheck();
    }, 100);
  }
}
