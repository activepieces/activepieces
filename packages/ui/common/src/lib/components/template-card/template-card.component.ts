import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  Flow,
  FlowOperationType,
  FlowTemplate,
  FlowVersion,
} from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import { Observable, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
type FlowTemplateWithVersion = FlowTemplate & { template: FlowVersion };
@Component({
  selector: 'ap-template-card',
  templateUrl: './template-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCardComponent implements AfterViewInit {
  useTemplate$: Observable<Flow>;
  @Output() useTemplateClicked = new EventEmitter<FlowTemplateWithVersion>();
  @Input() template: FlowTemplateWithVersion;
  @Input() redirecToBuilder = true;
  @Input() showBtnOnHover = false;
  constructor(
    private flowService: FlowService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private matDialog: MatDialog
  ) {}
  useTemplate() {
    if (!this.useTemplate$ && this.redirecToBuilder) {
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
