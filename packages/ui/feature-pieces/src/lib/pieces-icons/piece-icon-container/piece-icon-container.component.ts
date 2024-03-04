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
  @Input() iconSize = 20;
  paddingSize='0px';
  moreNumberFontSize = '12px'
  ngOnInit() {
    if (!this.moreIconsNumber && !this.url) {
      console.warn('Warning: No url or moreIconsNumber provided');
    }
    this.paddingSize = this.iconSize * 0.35 + 'px';
    this.moreNumberFontSize = this.iconSize * 0.6 + 'px'
  }
}
