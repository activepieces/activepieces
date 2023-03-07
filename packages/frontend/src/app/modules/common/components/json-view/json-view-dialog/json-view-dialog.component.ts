import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HighlightService } from '../../../service/highlight.service';

@Component({
  selector: 'app-json-view-dialog',
  templateUrl: './json-view-dialog.component.html',
  styleUrls: ['./json-view-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewDialogComponent implements AfterViewInit {
  title = '';
  content = '';
  constructor(
    @Inject(MAT_DIALOG_DATA) dialogData: { title: string; content: string },
    private highlightService: HighlightService
  ) {
    this.title = dialogData.title;
    this.content = dialogData.content;
  }
  ngAfterViewInit(): void {
    this.highlightService.highlightAll();
  }
}
