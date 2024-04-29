import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JsonViewDialogComponent } from './json-view-dialog/json-view-dialog.component';
import { copyText } from '../../utils/tables.utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { downloadJson } from '../../utils/consts';
import { FormControl } from '@angular/forms';
import { outputLog } from '../../pipe/output-log.pipe';
import { JsonEditorOptions } from 'ang-jsoneditor';

@Component({
  selector: 'ap-json-viewer',
  templateUrl: './json-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewComponent {
  jsonFormController = new FormControl({});
  _content = '';
  showText=false;
  containerHeight = 0;
  @Input() hideMaximize = false;
  @Input() title: string;
  jsonEditorOptions:JsonEditorOptions = new JsonEditorOptions();
  @Input() set content(value: unknown) {
    const formattedOutput = outputLog(value, false);
    if (formattedOutput !== this._content) {
      this._content = formattedOutput;
      try {
        let controllerValue = JSON.parse(this._content);
        if(typeof controllerValue === 'object' && controllerValue !== null){
          this.jsonFormController.setValue(controllerValue);
          this.showText=false;
        }
        else{
         this.showText=true;
        }
      } catch (e) {
        this.showText = true;
       }
       const contentSize = this._content.length * 2 / 1024;
       this.jsonEditorOptions.expandAll = contentSize < 400;
    }
  }
  editor?: unknown;
  constructor(
    private dialogService: MatDialog,
    private snackbar: MatSnackBar,
  ) {
    this.jsonEditorOptions.mode = 'view';
  }

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

}
