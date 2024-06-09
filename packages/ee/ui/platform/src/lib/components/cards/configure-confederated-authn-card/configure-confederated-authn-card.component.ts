import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
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
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import {
  AtLeastOneLoginMethodMsg,
  doesPlatformHaveAtLeastOneLoginMethodEnabled,
} from '../../util';
import { PlatformSettingsBaseComponent } from '../../platform-settings-base.component';
import { Platform, ThirdPartyAuthnProviderEnum } from '@activepieces/shared';
import { EnableSAMLAuthnProviderDialogComponent } from '../../dialogs/enable-saml-authn-provider-dialog.component/enable-saml-authn-provider-dialog.component';

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
  federatedAuthnProvider!: ThirdPartyAuthnProviderEnum;
  enableFederatedAuthn$?: Observable<Platform | undefined>;
  disableFederatedAuthn$?: Observable<void>;
  readonly ThirdPartyAuthnProviderEnum = ThirdPartyAuthnProviderEnum;
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
      this.toggleChecked = this.isToggled(
        this.federatedAuthnProvider,
        this.platform
      );
    }
  }

  findIcon(provider: ThirdPartyAuthnProviderEnum) {
    switch (provider) {
      case ThirdPartyAuthnProviderEnum.GOOGLE:
        return 'assets/img/custom/auth/google-icon.svg';
      case ThirdPartyAuthnProviderEnum.GITHUB:
        return 'assets/img/custom/auth/github.svg';
      case ThirdPartyAuthnProviderEnum.SAML:
        return 'assets/img/custom/auth/saml.svg';
    }
  }

  isToggled(provider: ThirdPartyAuthnProviderEnum, platform: Platform) {
    switch (provider) {
      case ThirdPartyAuthnProviderEnum.GOOGLE:
        return platform.federatedAuthProviders.google !== undefined;
      case ThirdPartyAuthnProviderEnum.GITHUB:
        return platform.federatedAuthProviders.github !== undefined;
      case ThirdPartyAuthnProviderEnum.SAML:
        return platform.federatedAuthProviders.saml !== undefined;
    }
  }

  disableAuthnProvider($event: MatSlideToggleChange) {
    const platform: Platform = JSON.parse(JSON.stringify(this.platform));
    switch (this.federatedAuthnProvider) {
      case ThirdPartyAuthnProviderEnum.GOOGLE:
        delete platform.federatedAuthProviders.google;
        break;
      case ThirdPartyAuthnProviderEnum.GITHUB:
        delete platform.federatedAuthProviders.github;
        break;
      case ThirdPartyAuthnProviderEnum.SAML:
        delete platform.federatedAuthProviders.saml;
        break;
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
            data: `<b>${this.getTitle(
              this.federatedAuthnProvider
            )}</b> SSO disabled`,
          });
        })
      );
    this.toggleChecked = false;
  }

  enableAuthnProvider() {
    if (this.platform) {
      const data: EnableFederatedAuthnProviderDialogData = {
        platform: this.platform,
        provider: this.federatedAuthnProvider,
      };
      let dialogObservable;
      switch (this.federatedAuthnProvider) {
        case ThirdPartyAuthnProviderEnum.SAML:
          dialogObservable = this.matDialog
            .open(EnableSAMLAuthnProviderDialogComponent, { data })
            .afterClosed();
          break;
        case ThirdPartyAuthnProviderEnum.GOOGLE:
        case ThirdPartyAuthnProviderEnum.GITHUB:
          dialogObservable = this.matDialog
            .open(EnableFederatedAuthnProviderDialogComponent, { data })
            .afterClosed();
          break;
      }

      this.enableFederatedAuthn$ = dialogObservable.pipe(
        tap((platform) => {
          if (platform) {
            this.toggleChecked = true;
            this.matSnackbar.openFromComponent(
              GenericSnackbarTemplateComponent,
              {
                data: `<b>${this.getTitle(
                  this.federatedAuthnProvider
                )}</b> SSO enabled`,
              }
            );
          }
        })
      );
    }
  }

  getTitle(provider: ThirdPartyAuthnProviderEnum) {
    switch (provider) {
      case ThirdPartyAuthnProviderEnum.GOOGLE:
        return 'Google';
      case ThirdPartyAuthnProviderEnum.GITHUB:
        return 'GitHub';
      case ThirdPartyAuthnProviderEnum.SAML:
        return 'SAML 2.0';
    }
  }

  toggleClicked($event: MatSlideToggleChange) {
    if (this.platform) {
      $event.source.checked = this.toggleChecked;
      const federatedAuthnProviderValue = this.isToggled(
        this.federatedAuthnProvider,
        this.platform
      );
      if (federatedAuthnProviderValue) {
        this.disableAuthnProvider($event);
      } else {
        this.enableAuthnProvider();
      }
    }
  }
}
