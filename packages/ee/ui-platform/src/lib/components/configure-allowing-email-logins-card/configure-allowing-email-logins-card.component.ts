import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Platform } from '@activepieces/ee-shared';
import { Observable, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformService } from '@activepieces/ui/common';
import {
  AtLeastOneLoginMethodMsg,
  doesPlatformHaveAtLeastOneLoginMethodEnabled,
} from '../util';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-configure-allowing-email-logins-card',
  templateUrl: './configure-allowing-email-logins-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigureAllowingEmailLoginsCardComponent implements OnInit {
  @Input({ required: true }) platform!: Platform;
  @Output() platformUpdated = new EventEmitter<Platform>();

  toggleEmailAuthnEnabled$?: Observable<void>;
  toggleDisabled = false;
  toggleChecked = false;
  constructor(
    private matSnackbar: MatSnackBar,
    private platformService: PlatformService
  ) {}
  ngOnInit() {
    this.toggleChecked = this.platform.emailAuthEnabled;
  }

  toggleClicked($event: MatSlideToggleChange) {
    const platform: Platform = JSON.parse(JSON.stringify(this.platform));
    platform.emailAuthEnabled = !platform.emailAuthEnabled;
    if (!doesPlatformHaveAtLeastOneLoginMethodEnabled(platform)) {
      this.matSnackbar.open(AtLeastOneLoginMethodMsg);
      $event.source.checked = true;
      return;
    }
    this.toggleDisabled = true;
    this.platformUpdated.emit(platform);
    this.toggleEmailAuthnEnabled$ = this.platformService
      .updatePlatform(
        { emailAuthEnabled: platform.emailAuthEnabled },
        platform.id
      )
      .pipe(
        tap(() => {
          this.toggleDisabled = false;
          if (platform.emailAuthEnabled) {
            this.matSnackbar.open($localize`Email logins enabled`);
          } else {
            this.matSnackbar.open($localize`Email logins disabled`);
          }
        })
      );
  }
}
