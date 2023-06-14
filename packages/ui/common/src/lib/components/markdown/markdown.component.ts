import { Component, Input } from '@angular/core';

@Component({
  selector: 'ap-markdown',
  templateUrl: './markdown.component.html',
  styleUrls: ['./markdown.component.scss'],
})
export class MarkdownComponent {
  @Input() data: string | undefined;
  @Input() smallText = false;
  @Input() fullWidth = false;
}
