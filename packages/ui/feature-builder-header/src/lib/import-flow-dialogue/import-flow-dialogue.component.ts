import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  BuilderSelectors,
  CollectionBuilderService,
} from '@activepieces/ui/feature-builder-store';
import { MatDialog } from '@angular/material/dialog';
import { FlowTemplate } from '@activepieces/shared';
import { Observable, tap, take, map } from 'rxjs';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-import-flow-dialogue',
  templateUrl: './import-flow-dialogue.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFlowDialogueComponent {
  fileControl = new FormControl(null);
  loading = false;
  emitTemplate$: Observable<void>;
  constructor(
    private builderService: CollectionBuilderService,
    private matDialog: MatDialog,
    private store: Store,
    private cd: ChangeDetectorRef
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
      this.emitTemplate$ = this.store
        .select(BuilderSelectors.selectCurrentFlow)
        .pipe(
          take(1),
          tap((flow) => {
            this.builderService.importTemplate$.next({
              flowId: flow.id,
              template,
            });
            this.matDialog.closeAll();
          }),
          map(() => void 0)
        );
      this.cd.markForCheck();
    };
    reader.readAsText(this.fileControl.value);
  }
}
