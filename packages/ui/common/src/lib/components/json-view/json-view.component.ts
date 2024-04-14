import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JsonViewDialogComponent } from './json-view-dialog/json-view-dialog.component';
import { copyText } from '../../utils/tables.utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { downloadJson, jsonEditorOptionsMonaco } from '../../utils/consts';
import { FormControl } from '@angular/forms';
import { outputLog } from '../../pipe/output-log.pipe';
import { Observable } from 'rxjs';

@Component({
  selector: 'ap-json-viewer',
  templateUrl: './json-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewComponent {
  readonly jsonEditorOptionsMonaco = jsonEditorOptionsMonaco;
  jsonFormController = new FormControl('');
  _content = '';
  containerWidthChange$?: Observable<number>;
  readonly containerMaxHeight = 600;
  readonly containerMinHeight = 100;
  containerHeight = 0;
  @Input() hideMaximize = false;
  @Input() title: string;
  @Input() set content(value: unknown) {
    const formattedOutput = outputLog(value, false);
    if (formattedOutput !== this._content) {
      this._content = formattedOutput;
      this.jsonFormController.setValue(this._content || '');
      if (this.editor) {
        setTimeout(() => {
          this.resizeEditorToContent(this.editor);
        });
      }
    }
  }
  editor?: unknown;
  constructor(
    private dialogService: MatDialog,
    private snackbar: MatSnackBar,
    private cd: ChangeDetectorRef
  ) {}

  openModal() {
    this.dialogService.open(JsonViewDialogComponent, {
      data: { title: this.title, content: this._content },
    });
  }
  copyContent() {
    copyText(this._content);
    this.snackbar.open(`${this.title} copied`);
  }

  downloadContent() {
    downloadJson(this._content, this.title);
  }
  resizeEditorToContent(editor: any) {
    this.editor = editor;
    const contentHeight = editor.getContentHeight();
    this.containerHeight = Math.max(
      Math.min(contentHeight, this.containerMaxHeight),
      this.containerMinHeight
    );
    this.cd.markForCheck();
  }
}
