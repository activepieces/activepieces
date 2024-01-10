import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@activepieces/ee-shared';
import { fadeInUp400ms } from '@activepieces/ui/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-sso-settings',
  templateUrl: './sso-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
})
export class SsoSettingsComponent {
  platform$: BehaviorSubject<Platform>;
  addDomain$?: Observable<string>;
  removeDomain$?: Observable<void>;
  constructor(private route: ActivatedRoute) {
    const platform: Platform = this.route.snapshot.data['platform'];
    this.platform$ = new BehaviorSubject(platform);
  }
  platformUpdated(platform: Platform) {
    this.platform$.next(platform);
  }
}
