import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FlagService, fadeInUp400ms } from '@activepieces/ui/common';
import { Observable, map, combineLatest } from 'rxjs';
import { ApFlagId } from '@activepieces/shared';
import { AsyncPipe } from '@angular/common';
import semver from 'semver';
import { UpdatesService } from '../../service/updates.service';
import { UiCommonModule } from '@activepieces/ui/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  imports: [AsyncPipe, UiCommonModule],
})
export class UpdatesComponent {
  currentVersion$?: Observable<string>;
  latestVersion$?: Observable<string>;
  message$?: Observable<{
    needUpdate: boolean;
    emoji: string;
    message: string;
  }>;
  patchNotes$?: Observable<{
    [key: string]: string | { [key: string]: string } | string[] | number;
  }>;

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('us', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  }

  splitBody(body: string): SafeHtml {
    const title = (text: string) =>
      `<span class="ap-typography-subtitle-1 ap-mt-2">${text}</span>`;
    const point = (text: string) =>
      `<li class="ap-typography-subtitle-1 ap-mr-2 ap-mt-1">${text}</li>`;
    let html = '';
    let titleTemp = '';

    const sections = body.split('## Thanks')[0].split('\r\n\r\n');
    sections.forEach((section) => {
      if (section.startsWith('##') || section.startsWith('\r\n')) {
        const t = title(section.split('## ')[1]);
        if (titleTemp !== t) {
          titleTemp = t;
          html += '</ul>';
        }
        html += t;
        html += '<ul class="ap-pl-12 ap-list-disc">';
      } else if (section.startsWith('*')) {
        section.split('* ').forEach((sectionPoint) => {
          if (sectionPoint !== '') {
            html += point(sectionPoint);
          }
        });
      }
    });

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  constructor(
    private flagService: FlagService,
    private updatesService: UpdatesService,
    private sanitizer: DomSanitizer
  ) {
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
    this.patchNotes$ = this.updatesService.getReleaseNotes();
  }
}
