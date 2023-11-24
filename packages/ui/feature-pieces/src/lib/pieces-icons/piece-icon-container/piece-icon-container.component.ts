import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'ap-piece-icon-container',
  templateUrl: './piece-icon-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceIconContainerComponent implements OnInit {
  @Input() url!: string;
  @Input() moreIconsNumber!: number;
  ngOnInit() {
    if (!this.moreIconsNumber && !this.url) {
      console.warn('Warning: No url or moreIconsNumber provided');
    }
  }
}
