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

@Component({
  selector: 'ap-json-viewer',
  templateUrl: './json-view.component.html',
  styleUrls: ['./json-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewComponent implements AfterViewInit {
  highlight = false;
  @Input() isInput = false;
  @Input() title: string;
  @Input() maxHeight: number | undefined = undefined;
  @Input() stepDisplayName: string;
  _content: unknown;
  @Input() set content(value: unknown) {
    this.highlight = false;
    this._content = value;
    if (
      typeof this._content === 'string' &&
      this._content !== 'undefined' &&
      this._content !== '0' &&
      this._content !== 'null' &&
      this._content !== JSON.stringify('')
    ) {
      this._content = `"${this._content}"`;
    }
    setTimeout(() => {
      this.highlightService.highlightAll();
    }, 10);
  }

  constructor(
    private highlightService: HighlightService,
    private dialogService: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    if (!this.highlight) {
      this.highlight = true;
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
      if (
        this._content !== 'undefined' &&
        this._content !== '0' &&
        this._content !== 'null' &&
        this._content !== JSON.stringify('')
      ) {
        copyText(this._content.slice(1, this._content.length - 1));
      } else {
        copyText(this._content);
      }
    } else {
      copyText(JSON.stringify(this._content));
    }

    this.snackbar.open(
      `${this.stepDisplayName} ${this.isInput ? 'input' : 'output'} copied`
    );
  }
}
