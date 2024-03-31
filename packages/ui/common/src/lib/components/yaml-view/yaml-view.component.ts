import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { YamlViewDialogComponent } from './yaml-view-dialog/yaml-view-dialog.component';
import { copyText } from '../../utils/tables.utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { downloadYaml, yamlEditorOptionsMonaco } from '../../utils/consts';
import { FormControl } from '@angular/forms';
import { outputLog } from '../../pipe/output-log.pipe';
import { Observable, tap } from 'rxjs';

@Component({
  selector: 'ap-yaml-viewer',
  templateUrl: './yaml-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YamlViewComponent {
  readonly yamlEditorOptionsMonaco = {
    ...yamlEditorOptionsMonaco,
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden',
      handleMouseWheel: false,
    },
    wordWrap: 'on',
  };
  yamlFormControl = new FormControl('');
  _content = '';
  containerWidthChange$?: Observable<number>;
  @Input() isInput = false;
  @Input() title: string;
  @Input() set content(value: unknown) {
    this._content = outputLog(value, false);
    this.yamlFormControl.setValue(this._content || '');
  }

  constructor(
    private dialogService: MatDialog,
    private snackbar: MatSnackBar
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
    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      editor.layout({
        height: contentHeight,
        width: container.clientWidth,
      });
    };
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();

    this.containerWidthChange$ = new Observable<number>((observer) => {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          observer.next(entry.target.clientWidth);
        }
      });
      resizeObserver.observe(container);
      // Cleanup function
      return () => resizeObserver.unobserve(container);
    }).pipe(
      tap(() => {
        updateHeight();
      })
    );
  }
}
