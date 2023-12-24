import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { startWith } from 'rxjs';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  TemplatesService,
} from '@activepieces/ui/common';
import { TemplatesDataSource } from './template-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import { CreateTemplateDialogueComponent } from '../dialogs/create-template-dialogue/create-template-dialogue.component';
import { FlowTemplate } from '@activepieces/shared';

@Component({
  selector: 'app-template-table',
  templateUrl: './template-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTableComponent {
  displayedColumns = ['name', 'created', 'action'];
  dataSource: TemplatesDataSource;
  refresh$: Subject<boolean> = new Subject();
  dialogClosed$?: Observable<unknown>;
  constructor(
    private templateService: TemplatesService,
    private matDialog: MatDialog
  ) {
    this.dataSource = new TemplatesDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.templateService
    );
  }
  create() {
    const dialog = this.matDialog.open(CreateTemplateDialogueComponent, {
      disableClose: true,
    });
    this.dialogClosed$ = dialog.afterClosed().pipe(
      tap(() => {
        this.refresh$.next(true);
      })
    );
  }
  deleteTemplate(key: FlowTemplate) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.templateService.delete(key.id).pipe(
        tap(() => {
          this.refresh$.next(true);
        })
      ),
      entityName: key.name,
      note: $localize`This will permanently delete the flow template.`,
    };
    const dialog = this.matDialog.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.dialogClosed$ = dialog.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }
}
