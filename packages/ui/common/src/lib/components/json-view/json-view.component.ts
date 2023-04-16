import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HighlightService } from '../../service/highlight.service';
import { JsonViewDialogComponent } from './json-view-dialog/json-view-dialog.component';

@Component({
  selector: 'ap-json-viewer',
  templateUrl: './json-view.component.html',
  styleUrls: ['./json-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewComponent implements AfterViewInit {
  highlight = false;

  @Input() title: string;
  @Input() maxHeight: number | undefined = undefined;

  _content: unknown;
  @Input() set content(value: unknown) {
    this.highlight = false;
    this._content = value;
    setTimeout(() => {
      this.highlightService.highlightAll();
    }, 10);
  }

  constructor(
    private highlightService: HighlightService,
    private dialogService: MatDialog
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
}
