import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JsonViewDialogComponent } from './json-view-dialog/json-view-dialog.component';
import { copyText } from '../../utils/tables.utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { downloadFile } from '../../utils/consts';
import { FormControl } from '@angular/forms';
import { JSONEditor, Mode } from 'vanilla-jsoneditor';
@Component({
  selector: 'ap-json-viewer',
  templateUrl: './json-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewComponent implements AfterViewInit {
  jsonFormController = new FormControl({});
  _content = '';
  showText = false;
  containerHeight = 0;
  jsonEditor?: JSONEditor;
  @Input() hideTitle = false;
  @Input() hideMaximize = false;
  @Input() viewTitle: string;
  @ViewChild('jsonEditorContainer')
  jsonEditorContainer: ElementRef<HTMLDivElement>;
  @Input() set content(value: unknown) {
    if (typeof value === 'string') {
      this._content = value;
    } else {
      this._content = JSON.stringify(value, null, 2);
    }
    this.showText = !this.isContentAnObject(this._content);
    this.jsonEditor?.set({
      json: this.showText ? undefined : JSON.parse(this._content),
      text: this.showText ? this._content : undefined,
    });

    this.setExpandAllNodesInEditor();
  }
  constructor(
    private dialogService: MatDialog,
    private snackbar: MatSnackBar
  ) {}
  ngAfterViewInit(): void {
    this.jsonEditor = new JSONEditor({
      target: this.jsonEditorContainer.nativeElement,
      props: {
        content: {
          json: this.showText ? undefined : JSON.parse(this._content),
          text: this.showText ? this._content : undefined,
        },
        mode: Mode.tree,
        readOnly: true,
        navigationBar: false,
        mainMenuBar: false,
      },
    });
    this.jsonEditor?.set({
      json: this.showText ? undefined : JSON.parse(this._content),
      text: this.showText ? this._content : undefined,
    });
    this.setExpandAllNodesInEditor();
  }

  private setExpandAllNodesInEditor() {
    setTimeout(() => {
      const contentSize = (this._content.length * 2) / 1024;
      const expandAll = contentSize < 400;
      if (expandAll) {
        this.jsonEditor?.expand(() => true);
      }
    });
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
