import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  EnableFederatedAuthnProviderDialogComponent,
  EnableFederatedAuthnProviderDialogData,
} from '../../dialogs/enable-federated-authn-provider-dialog/enable-federated-authn-provider-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  GenericSnackbarTemplateComponent,
  PlatformService,
} from '@activepieces/ui/common';
import { FederatedAuthnProviderEnum } from '../../sso-settings/federated-authn-provider.enum';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import {
  AtLeastOneLoginMethodMsg,
  doesPlatformHaveAtLeastOneLoginMethodEnabled,
} from '../../util';
import { PlatformSettingsBaseComponent } from '../../platform-settings-base.component';
import { Platform } from '@activepieces/shared';

@Component({
  selector: 'app-configure-confederated-authn-card',
  templateUrl: './configure-confederated-authn-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigureConfederatedAuthnCardComponent
  extends PlatformSettingsBaseComponent
  implements OnInit
{
  @Input({ required: true })
  federatedAuthnProvider!: FederatedAuthnProviderEnum;
  @Output() platformUpdated = new EventEmitter<Platform>();
  enableFederatedAuthn$?: Observable<Platform | undefined>;
  disableFederatedAuthn$?: Observable<void>;
  toggleDisabled = false;
  toggleChecked = false;
  constructor(
    private matDialog: MatDialog,
    private matSnackbar: MatSnackBar,
    private platformService: PlatformService
  ) {
    super();
  }
  ngOnInit() {
    if (this.platform) {
      this.toggleChecked =
        this.federatedAuthnProvider === 'Google'
          ? this.platform.federatedAuthProviders.google !== undefined
          : this.platform.federatedAuthProviders.github !== undefined;
    }
  }
  disableAuthnProvider($event: MatSlideToggleChange) {
    const platform: Platform = JSON.parse(JSON.stringify(this.platform));

    if (this.federatedAuthnProvider === 'Google') {
      delete platform.federatedAuthProviders.google;
    } else if (this.federatedAuthnProvider === 'Github') {
      delete platform.federatedAuthProviders.github;
    }
    if (!doesPlatformHaveAtLeastOneLoginMethodEnabled(platform)) {
      this.matSnackbar.open(AtLeastOneLoginMethodMsg);
      $event.source.checked = true;
      return;
    }

    this.toggleDisabled = true;
    this.disableFederatedAuthn$ = this.platformService
      .updatePlatform(
        { federatedAuthProviders: platform.federatedAuthProviders },
        platform.id
      )
      .pipe(
        tap(() => {
          this.toggleDisabled = false;
          this.matSnackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b>${this.federatedAuthnProvider}</b> SSO disabled`,
          });
        })
      );
    this.platformUpdated.emit(platform);
    this.toggleChecked = false;
  }
  enableAuthnProvider() {
    if (this.platform) {
      const data: EnableFederatedAuthnProviderDialogData = {
        platform: this.platform,
        provider: this.federatedAuthnProvider,
      };
      this.enableFederatedAuthn$ = this.matDialog
        .open(EnableFederatedAuthnProviderDialogComponent, { data })
        .afterClosed()
        .pipe(
          tap((platform) => {
            if (platform) {
              this.toggleChecked = true;
              this.platformUpdated.emit(platform);
              this.matSnackbar.openFromComponent(
                GenericSnackbarTemplateComponent,
                {
                  data: `<b>${this.federatedAuthnProvider}</b> SSO enabled`,
                }
              );
            }
          })
        );
    }
  }
  toggleClicked($event: MatSlideToggleChange) {
    if (this.platform) {
      $event.source.checked = this.toggleChecked;
      const federatedAuthnProviderValue =
        this.federatedAuthnProvider === FederatedAuthnProviderEnum.Github
          ? this.platform.federatedAuthProviders.github
          : this.platform.federatedAuthProviders.google;
      if (federatedAuthnProviderValue === undefined) {
        this.enableAuthnProvider();
      } else {
        this.disableAuthnProvider($event);
      }
    }
  }
}
