import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JsonViewDialogComponent } from './json-view-dialog/json-view-dialog.component';
import { copyText } from '../../utils/tables.utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { downloadFile } from '../../utils/consts';
import { FormControl } from '@angular/forms';
import { JsonEditorOptions } from 'ang-jsoneditor';

@Component({
  selector: 'ap-json-viewer',
  templateUrl: './json-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewComponent {
  jsonFormController = new FormControl({});
  _content = '';
  contentIsAnObject = false;
  contentType:
    | 'object'
    | 'string'
    | 'number'
    | 'boolean'
    | 'bigint'
    | 'symbol'
    | 'function'
    | 'undefined' = 'string';
  containerHeight = 0;
  @Input() hideTitle = false;
  @Input() hideMaximize = false;
  @Input() viewTitle: string;
  jsonEditorOptions: JsonEditorOptions = new JsonEditorOptions();
  @Input() set content(value: unknown) {
    this.contentType = typeof value;
    if (this.contentType === 'object') {
      this._content = JSON.stringify(value, null, 2);
      this.jsonFormController.setValue(JSON.parse(this._content));
    } else {
      if (typeof value === 'string' && this.isStringValidJson(value)) {
        this._content = JSON.stringify(JSON.parse(value), null, 2);
      } else {
        this._content = JSON.stringify(value);
      }
    }
    this.setExpandAllNodesInEditor();
  }
  editor?: unknown;
  constructor(private dialogService: MatDialog, private snackbar: MatSnackBar) {
    this.jsonEditorOptions.mode = 'view';
  }

  private setExpandAllNodesInEditor() {
    const contentSize = (this._content.length * 2) / 1024;
    this.jsonEditorOptions.expandAll = contentSize < 400;
  }

  openModal() {
    this.dialogService.open(JsonViewDialogComponent, {
      data: { title: this.viewTitle, content: this._content },
    });
  }
  copyContent() {
    copyText(this._content);
    this.snackbar.open(`${this.viewTitle} copied`);
  }

  downloadContent() {
    downloadFile(
      this._content,
      this.viewTitle,
      this.contentIsAnObject ? 'txt' : 'json'
    );
  }
  private isStringValidJson(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
