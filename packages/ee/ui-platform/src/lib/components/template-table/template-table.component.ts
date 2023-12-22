import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { startWith } from 'rxjs';
import { TemplatesService } from '@activepieces/ui/common';
import { TemplatesDataSource } from './template-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import { CreateTemplateDialogueComponent } from '../dialogs/create-template-dialogue/create-template-dialogue.component';

@Component({
  selector: 'app-template-table',
  templateUrl: './template-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTableComponent {
  displayedColumns = ['id', 'displayName', 'created', 'action'];
  dataSource: TemplatesDataSource;
  refresh$: Subject<boolean> = new Subject();
  dialogClosed$?: Observable<unknown>;
  constructor(private templateService: TemplatesService,
    private matDialog: MatDialog) {
    this.dataSource = new TemplatesDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.templateService
    );
  }
  create() {
    const dialog = this.matDialog.open(CreateTemplateDialogueComponent, {
      disableClose: true,
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
