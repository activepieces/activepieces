import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FlowTemplate, PopulatedFlow } from '@activepieces/shared';
import { Observable } from 'rxjs';
import { FlowBuilderService } from '../../../service';

export type ImporFlowDialogData = {
  flowToOverWrite?: PopulatedFlow;
};

@Component({
  selector: 'ap-import-flow-dialog',
  templateUrl: './import-flow-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFlowDialogComponent {
  fileControl = new FormControl(null);
  loading = false;
  emitTemplate$: Observable<void>;
  constructor(
    private builderService: FlowBuilderService,
    private cd: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: ImporFlowDialogData,
    private matDialog: MatDialog
  ) {}

  importFlow() {
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
      if (this.data.flowToOverWrite) {
        this.builderService.importTemplate$.next({
          flowId: this.data.flowToOverWrite.id,
          template,
        });
        this.matDialog.closeAll();
      }
      this.cd.markForCheck();
    };
    reader.readAsText(this.fileControl.value);
  }
}
