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
  showText = false;
  containerHeight = 0;
  @Input() hideTitle = false;
  @Input() hideMaximize = false;
  @Input() viewTitle: string;
  jsonEditorOptions: JsonEditorOptions = new JsonEditorOptions();
  @Input() set content(value: unknown) {
    if (typeof value === 'string') {
      this._content = value;
    } else {
      this._content = JSON.stringify(value, null, 2);
    }
    this.showText = !this.isContentAnObject(this._content);
    if (!this.showText) {
      this.jsonFormController.setValue(JSON.parse(this._content));
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
    downloadFile(this._content, this.viewTitle, this.showText ? 'txt' : 'json');
  }

  private isContentAnObject(content: string) {
    try {
      const value = JSON.parse(content);
      return typeof value === 'object' && value !== null;
    } catch (e) {
      return false;
    }
  }
}
