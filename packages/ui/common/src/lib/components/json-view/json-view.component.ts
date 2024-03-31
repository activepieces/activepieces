import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HighlightService } from '../../service/highlight.service';
import { JsonViewDialogComponent } from './json-view-dialog/json-view-dialog.component';
import { copyText } from '../../utils/tables.utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { downloadJson } from '../../utils/consts';

@Component({
  selector: 'ap-json-viewer',
  templateUrl: './json-view.component.html',
  styleUrls: ['./json-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewComponent implements AfterViewInit {
  highlight = false;
  _content: unknown;
  @Input() isInput = false;
  @Input() title: string;
  @Input() maxHeight: number | undefined = undefined;
  @Input() set content(value: unknown) {
    this.highlight = false;
    this._content = value;
    if (typeof this._content !== 'string') {
      this.highlight = true;
    }
    setTimeout(() => {
      if (this.highlight) {
        this.highlightService.highlightAll();
      }
    }, 10);
  }

  constructor(
    private highlightService: HighlightService,
    private dialogService: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    if (this.highlight) {
      this.highlightService.highlightAll();
    }
  }

  openModal() {
    this.dialogService.open(JsonViewDialogComponent, {
      data: { title: this.title, content: this._content },
    });
  }
  copyContent() {
    if (typeof this._content === 'string') {
      copyText(this._content);
    } else {
      copyText(JSON.stringify(this._content));
    }

    this.snackbar.open(`${this.isInput ? 'Input' : 'Output'} copied`);
  }

  downloadContent() {
    downloadJson(this._content, this.title);
  }
}
