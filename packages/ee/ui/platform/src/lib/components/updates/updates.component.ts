import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FlagService, fadeInUp400ms } from '@activepieces/ui/common';
import { Observable, map, combineLatest } from 'rxjs';
import { ApFlagId } from '@activepieces/shared';
import { AsyncPipe } from '@angular/common';
import semver from 'semver';

const compareVersions = (latestVersion: string, currentVersion: string) => {
  let message = 'Up to date!';
  let needUpdate = false;
  let emoji = '🤩';

  if (semver.gt(latestVersion, currentVersion)) {
    const diff = semver.diff(latestVersion, currentVersion);

    if (diff === 'minor' || diff === 'major') {
      message = 'Major update is available. Please update.';
    } else if (diff === 'patch') {
      message = 'Patch update is available. Please update.';
    }

    needUpdate = true;
    emoji = '😞';
  }

  return {
    needUpdate,
    message,
    emoji,
  };
};

@Component({
  selector: 'app-updates',
  templateUrl: './updates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [AsyncPipe],
})
export class UpdatesComponent {
  currentVersion$?: Observable<string>;
  latestVersion$?: Observable<string>;
  message$?: Observable<{
    needUpdate: boolean;
    emoji: string;
    message: string;
  }>;

  constructor(private flagService: FlagService) {
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
}
