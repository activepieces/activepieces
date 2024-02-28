import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Platform } from '@activepieces/shared';

@Component({
  selector: 'app-platform-settings-base',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export class PlatformSettingsBaseComponent {
  @Input({ required: true }) isDemo = false;
  @Input() platform?: Platform;
}
