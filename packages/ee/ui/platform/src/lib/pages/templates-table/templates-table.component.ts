import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { startWith } from 'rxjs';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  MANAGE_TEMPLATES_DISABLED_RESOLVER_KEY,
  TemplatesService,
} from '@activepieces/ui/common';
import { TemplatesDataSource } from './templates-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import {
  CreateOrUpdateTemplateDialogData,
  CreateOrUpdateTemplateDialogueComponent,
} from '../../components/dialogs/create-or-update-template-dialogue/create-or-update-template-dialogue.component';
import { FlowTemplate } from '@activepieces/shared';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-template-table',
  templateUrl: './templates-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesTableComponent {
  title = $localize`Templates`;
  displayedColumns = ['name', 'created', 'pieces', 'action'];
  dataSource: TemplatesDataSource;
  refresh$: Subject<boolean> = new Subject();
  dialogClosed$?: Observable<unknown>;
  isLocked!: boolean;
  upgradeNoteTitle = $localize`Unlock Templates`;
  upgradeNote = $localize`Convert the most common automations into reusable templates 1 click away from your users`;
  constructor(
    private templateService: TemplatesService,
    private matDialog: MatDialog,
    private route: ActivatedRoute
  ) {
    this.isLocked =
      this.route.snapshot.data[MANAGE_TEMPLATES_DISABLED_RESOLVER_KEY];
    this.dataSource = new TemplatesDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.templateService,
      this.isLocked
    );
  }
  create() {
    const dialog = this.matDialog.open(CreateOrUpdateTemplateDialogueComponent);
    this.dialogClosed$ = dialog.afterClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }
  edit(template: FlowTemplate) {
    const data: CreateOrUpdateTemplateDialogData = { template };
    const dialog = this.matDialog.open(
      CreateOrUpdateTemplateDialogueComponent,
      {
        data,
      }
    );
    this.dialogClosed$ = dialog.afterClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }
  deleteTemplate(key: FlowTemplate) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.templateService.delete(key.id),
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
