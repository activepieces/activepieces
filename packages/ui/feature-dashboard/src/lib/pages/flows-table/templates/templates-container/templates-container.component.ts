import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  TemplateDialogData,
  TemplatesDialogComponent,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import { FlowTemplate, FolderId } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { FoldersSelectors } from '../../../../store/folders/folders.selector';
import { Observable, shareReplay } from 'rxjs';
import { TemplatesService } from '@activepieces/ui/common';

@Component({
  selector: 'app-templates-container',
  templateUrl: './templates-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesContainerComponent {
  folderId$: Observable<FolderId | undefined>;
  templates$: Observable<FlowTemplate[]>;
  constructor(
    private matDialog: MatDialog,
    private store: Store,
    private templatesService: TemplatesService
  ) {
    this.folderId$ = this.store.select(FoldersSelectors.selectCurrentFolderId);
    this.templates$ = this.templatesService
      .getPinnedTemplates()
      .pipe(shareReplay(1));
  }
  openTemplateDialog() {
    const templateDialogData: TemplateDialogData = {
      insideBuilder: false,
      folderId$: this.folderId$,
    };
    this.matDialog.open(TemplatesDialogComponent, { data: templateDialogData });
  }
}
