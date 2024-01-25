import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import {
  FlowOperationType,
  FlowTemplate,
  PopulatedFlow,
  TelemetryEventName,
} from '@activepieces/shared';
import { Observable, map, switchMap, tap } from 'rxjs';
import {
  FlowBuilderService,
  FlowService,
  TelemetryService,
} from '../../../service';
import { Router } from '@angular/router';

type ImportTemplateWithoutExistingFlowData = { projectId: string };
type ImportFlowToOverwriteFlowData = { flowToOverwriteId: string };
export type ImporFlowDialogData =
  | ImportFlowToOverwriteFlowData
  | ImportTemplateWithoutExistingFlowData;

@Component({
  selector: 'ap-import-flow-dialog',
  templateUrl: './import-flow-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFlowDialogComponent {
  fileControl = new FormControl<null | File>(null, {
    validators: Validators.required,
  });
  loading = false;
  importFLow$?: Observable<void>;
  showOverWritingFlowNote = false;
  constructor(
    private builderService: FlowBuilderService,
    private matDialog: MatDialog,
    private flowService: FlowService,
    private telemetryService: TelemetryService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA)
    public data: ImporFlowDialogData,
    private cd: ChangeDetectorRef
  ) {
    this.showOverWritingFlowNote = this.isOverwritingFlow(this.data);
  }

  submit() {
    this.fileControl.markAsTouched();
    if (this.fileControl.valid) {
      this.readFile();
      this.loading = true;
    }
  }
  readFile() {
    if (this.fileControl.value === null) return;
    const reader = new FileReader();
    reader.onload = () => {
      const template: FlowTemplate = JSON.parse(reader.result as string);
      if (this.isOverwritingFlow(this.data)) {
        this.importFlowWithinTheBuilder(this.data.flowToOverwriteId, template);
      } else {
        this.importFLow$ = this.flowService
          .create({
            displayName: template.name,
            projectId: this.data.projectId,
          })
          .pipe(
            tap(() => {
              this.captureEvent({
                templateId: template.id,
                templateName: template.name,
              });
            }),
            switchMap((flow) => {
              return this.flowService
                .update(flow.id, {
                  type: FlowOperationType.IMPORT_FLOW,
                  request: template.template,
                })
                .pipe(
                  tap((updatedFlow: PopulatedFlow) => {
                    this.router.navigate(['flows', updatedFlow.id]);
                    this.matDialog.closeAll();
                  }),
                  map(() => void 0)
                );
            })
          );
      }
      this.cd.markForCheck();
    };
    reader.readAsText(this.fileControl.value);
  }
  /**Trigger loading indicator that covers full screen */
  importFlowWithinTheBuilder(
    flowToOverwriteId: string,
    template: FlowTemplate
  ) {
    this.builderService.importTemplate$.next({
      flowId: flowToOverwriteId,
      template,
    });
    this.matDialog.closeAll();
  }

  captureEvent(req: { templateName: string; templateId: string }) {
    this.telemetryService.capture({
      name: TelemetryEventName.FLOW_IMPORTED,
      payload: {
        id: req.templateId,
        name: req.templateName,
        location: `from dialog in the dashboard`,
      },
    });
  }

  isOverwritingFlow(
    data: ImporFlowDialogData
  ): data is ImportFlowToOverwriteFlowData {
    return Object.keys(data).some((k) => k === 'flowToOverwriteId');
  }
}
