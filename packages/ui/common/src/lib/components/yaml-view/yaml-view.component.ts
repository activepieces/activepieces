import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Renderer2,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { YamlViewDialogComponent } from './yaml-view-dialog/yaml-view-dialog.component';
import { copyText } from '../../utils/tables.utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { downloadYaml, yamlEditorOptionsMonaco } from '../../utils/consts';
import { FormControl } from '@angular/forms';
import { outputLog } from '../../pipe/output-log.pipe';
import { Observable } from 'rxjs';

@Component({
  selector: 'ap-yaml-viewer',
  templateUrl: './yaml-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YamlViewComponent {
  readonly yamlEditorOptionsMonaco = {
    ...yamlEditorOptionsMonaco,
  };
  yamlFormControl = new FormControl('');
  _content = '';
  containerWidthChange$?: Observable<number>;
  readonly containerMaxHeight = 600;
  @Input() isInput = false;
  @Input() title: string;
  @Input() set content(value: unknown) {
    this._content = outputLog(value, false);
    this.yamlFormControl.setValue(this._content || '');
  }

  constructor(
    private dialogService: MatDialog,
    private snackbar: MatSnackBar,
    private renderer: Renderer2
  ) {}

  openModal() {
    this.dialogService.open(YamlViewDialogComponent, {
      data: { title: this.title, content: this._content },
    });
  }
  copyContent() {
    copyText(this._content);
    this.snackbar.open(`${this.isInput ? 'Input' : 'Output'} copied`);
  }

  downloadContent() {
    downloadYaml(this._content, this.title);
  }
  resizeEditorToContent(editor: any, container: HTMLElement) {
    const contentHeight = editor.getContentHeight();
    this.renderer.setStyle(
      container,
      'height',
      Math.min(contentHeight, this.containerMaxHeight) + 'px'
    );
  }
}
