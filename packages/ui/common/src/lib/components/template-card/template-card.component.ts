import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  Flow,
  FlowOperationType,
  FlowTemplate,
  FlowVersion,
} from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import { Observable, Subject, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
type FlowTemplateWithVersion = FlowTemplate & { template: FlowVersion };
@Component({
  selector: 'ap-template-card',
  templateUrl: './template-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCardComponent {
  useTemplate$: Observable<Flow>;
  useTemplateClicked$ = new Subject<FlowTemplateWithVersion>();
  @Input() template: FlowTemplateWithVersion;
  @Input() redirecToBuilder = true;
  constructor(private flowService: FlowService, private router: Router) {}
  useTemplate() {
    if (!this.useTemplate$ && !this.redirecToBuilder) {
      this.useTemplate$ = this.flowService
        .create({
          displayName: this.template.name,
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
                  this.router.navigate(['flows', updatedFlow.id]);
                })
              );
          })
        );
    }
    this.useTemplateClicked$.next(this.template);
  }
}
