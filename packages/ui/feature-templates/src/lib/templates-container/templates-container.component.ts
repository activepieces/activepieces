import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { FlowTemplate, FolderId } from '@activepieces/shared';
import { Observable, map, shareReplay } from 'rxjs';
import { FlagService, TemplatesService } from '@activepieces/ui/common';
import {
  TemplateDialogData,
  TemplatesDialogComponent,
} from '../templates-dialog/templates-dialog.component';

@Component({
  selector: 'app-templates-container',
  templateUrl: './templates-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesContainerComponent {
  @Input() folderId$: Observable<FolderId | undefined>;
  templates$: Observable<FlowTemplate[]>;
  showTemplates$: Observable<boolean>;
  constructor(
    private matDialog: MatDialog,
    private templatesService: TemplatesService,
    private flagService: FlagService
  ) {
    this.templates$ = this.templatesService
      .getPinnedTemplates()
      .pipe(shareReplay(1));
    this.showTemplates$ = this.flagService
      .getTemplatesSourceUrl()
      .pipe(map((url) => !!url));
  }
  openTemplateDialog() {
    const templateDialogData: TemplateDialogData = {
      insideBuilder: false,
      folderId$: this.folderId$,
    };
    this.matDialog.open(TemplatesDialogComponent, { data: templateDialogData });
  }
}
