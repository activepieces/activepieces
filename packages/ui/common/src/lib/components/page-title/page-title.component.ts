import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ap-page-title',
  templateUrl: './page-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageTitleComponent {
  @Input() title!: string;
  @Input() isBeta = false;
}
