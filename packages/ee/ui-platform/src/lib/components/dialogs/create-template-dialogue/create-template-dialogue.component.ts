import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { FlowTemplate, TemplateType } from '@activepieces/shared';
import { Observable, catchError, map, of } from 'rxjs';
import { TemplatesService } from '@activepieces/ui/common';

@Component({
  selector: 'app-create-template-dialogue',
  templateUrl: './create-template-dialogue.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTemplateDialogueComponent {
  fileControl = new FormControl(null);
  loading = false;
  invalidJson = false;
  createTemplate$: Observable<void> | undefined;
  constructor(
    private matDialog: MatDialog,
    private templateService: TemplatesService,
    private cd: ChangeDetectorRef
  ) {}

  createTemplate() {
    if (this.fileControl.valid) {
      this.readFile();
      this.loading = true;
    }
  }

  readFile() {
    if (this.fileControl.value === null) {
      return;
    }
    this.invalidJson = false;
    const reader = new FileReader();
    reader.onload = () => {
      const template: FlowTemplate = JSON.parse(reader.result as string);
      this.createTemplate$ = this.templateService
        .create({
          ...template,
          type: TemplateType.PLATFORM,
        })
        .pipe(
          catchError(() => {
            this.invalidJson = true;
            return of({});
          }),
          map(() => void 0)
        );
      this.matDialog.closeAll();
      this.cd.markForCheck();
    };
    reader.readAsText(this.fileControl.value);
  }
}
