import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  Flow,
  FlowOperationType,
  FlowTemplate,
  FlowVersion,
} from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import { Observable, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
type FlowTemplateWithVersion = FlowTemplate & { template: FlowVersion };
@Component({
  selector: 'app-template-card',
  templateUrl: './template-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCardComponent {
  useTemplate$: Observable<Flow>;
  @Input() template: FlowTemplateWithVersion;
  @Input() redirecToBuilder = true;
  constructor(private flowService: FlowService, private router: Router) {}
  useTemplate() {
    if (!this.useTemplate$) {
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
  }
}
