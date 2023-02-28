import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-img',
  templateUrl: './ap-img.component.html',
  styleUrls: ['./ap-img.component.css'],
})
export class ApImgComponent {
  @Input() width: number;
  @Input() height: number;
  @Input() defaultSrc: string;
  @Input() src: string | undefined;
  @Input() rounded = false;
}
