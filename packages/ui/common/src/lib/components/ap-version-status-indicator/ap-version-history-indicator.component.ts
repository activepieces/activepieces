import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ap-version-history-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ap-rounded-full ap-w-[6.5px] ap-h-[6.5px] ap-bg-success-light"
      [class.ap-bg-description]="versionHistoricalStatus === 'OLDER_VERSION'"
      [class.ap-bg-success-light]="versionHistoricalStatus === 'PUBLISHED'"
      [class.ap-bg-warn]="versionHistoricalStatus === 'DRAFT'"
    ></div>
  `,
})
export class VersionHistoryIndicatorComponent {
  @Input({ required: true }) versionHistoricalStatus:
    | 'OLDER_VERSION'
    | 'DRAFT'
    | 'PUBLISHED' = 'DRAFT';
}
