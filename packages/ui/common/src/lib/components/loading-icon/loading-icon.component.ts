import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ap-loading-icon',
  templateUrl: './loading-icon.component.html',
  styleUrls: ['./loading-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingIconComponent {
  @Input() whiteLoader = false;
  @Input() outlineLoader = false;
  @Input() height = '20px';
  @Input() width = '21px';
}
