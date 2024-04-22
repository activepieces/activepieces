import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionHisoricalStatus } from '../../utils/enums';

@Component({
  selector: 'ap-version-history-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ap-rounded-full ap-w-[6.5px] ap-h-[6.5px] ap-bg-success-light"
      [class.ap-bg-description]="
        versionHistoricalStatus === VersionHisoricalStatus.OLDER_VERSION
      "
      [class.ap-bg-success-light]="
        versionHistoricalStatus === VersionHisoricalStatus.PUBLISHED
      "
      [class.ap-bg-warn]="
        versionHistoricalStatus === VersionHisoricalStatus.DRAFT
      "
    ></div>
  `,
})
export class VersionHistoryIndicatorComponent {
  VersionHisoricalStatus = VersionHisoricalStatus;
  @Input({ required: true }) versionHistoricalStatus: VersionHisoricalStatus =
    VersionHisoricalStatus.DRAFT;
}
