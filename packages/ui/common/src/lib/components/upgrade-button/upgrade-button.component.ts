import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ap-upgrade-button',
  templateUrl: './upgrade-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeButtonComponent {
  @Input() urlToOpen = 'https://www.activepieces.com/pricing';

  openUrl() {
    window.open(this.urlToOpen, '_blank', 'noopener noreferer');
  }
}
