import { Component, Input, OnInit } from '@angular/core';
import { HighlightService } from '../../service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'ap-markdown',
  templateUrl: './ap-markdown.component.html',
  styleUrls: [],
})
export class ApMarkdownComponent implements OnInit {
  @Input() data: string | undefined;
  @Input() smallText = false;
  @Input() fullWidth = false;

  constructor(
    private highlightService: HighlightService,
    private matSnackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.highlightService.highlightAll();
    }, 1);
  }

  showCopy() {
    this.matSnackbar.open('Copied to clipboard', '', {
      duration: 2000,
    });
  }
}
