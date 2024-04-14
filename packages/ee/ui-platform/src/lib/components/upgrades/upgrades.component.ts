import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FlagService, fadeInUp400ms } from '@activepieces/ui/common';
import { Observable, map, combineLatest } from 'rxjs';
import { PlatformSettingsBaseComponent } from '../platform-settings-base.component';
import { ApFlagId } from '@activepieces/shared';
import { AsyncPipe } from '@angular/common';

const compareVersions = (latestVersion: string, currentVersion: string) => {
  const latest = latestVersion.split('.').map(Number);
  const current = currentVersion.split('.').map(Number);

  if (latest[1] > current[1]) {
    return {
      emoji: '😞',
      message: 'Major update is available. Please update.',
    };
  } else if (latest[2] > current[2]) {
    return {
      emoji: '😞',
      message: 'Patch update is available. Please update.',
    };
  }

  return {
    emoji: '🙂',
    message: 'Up to date!',
  };
};

@Component({
  selector: 'app-upgrades',
  templateUrl: './upgrades.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [AsyncPipe],
})
export class UpgradesComponent
  extends PlatformSettingsBaseComponent
  implements OnInit
{
  currentVersion$?: Observable<string>;
  latestVersion$?: Observable<string>;
  message$?: Observable<{
    emoji: string;
    message: string;
  }>;

  constructor(private flagService: FlagService) {
    super();
    this.currentVersion$ = this.flagService.getStringFlag(
      ApFlagId.CURRENT_VERSION
    );
    this.latestVersion$ = this.flagService.getStringFlag(
      ApFlagId.LATEST_VERSION
    );
    this.message$ = combineLatest({
      currentVersion: this.currentVersion$,
      latestVersion: this.latestVersion$,
    }).pipe(
      map(({ currentVersion, latestVersion }) => {
        return compareVersions(latestVersion, currentVersion);
      })
    );
  }

  ngOnInit(): void {}
}
