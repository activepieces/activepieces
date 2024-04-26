import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Platform } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { Observable, catchError, of, tap } from 'rxjs';
import { AddAllowedEmailDomainDialogComponent } from '../../dialogs/add-allowed-email-domain-dialog/add-allowed-email-domain-dialog.component';
import {
  GenericSnackbarTemplateComponent,
  PlatformService,
  unexpectedErrorMessage,
} from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformSettingsBaseComponent } from '../../platform-settings-base.component';

@Component({
  selector: 'app-allowed-email-domains-list',
  templateUrl: './allowed-email-domains-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllowedEmailDomainsListComponent extends PlatformSettingsBaseComponent {
  domainsBeingRemoved: Record<string, boolean> = {};
  addDomain$?: Observable<string>;
  removeDomain$?: Observable<void>;
  constructor(
    private matDialog: MatDialog,
    private platformService: PlatformService,
    private matSnackbar: MatSnackBar
  ) {
    super();
  }
  addDomain() {
    this.addDomain$ = this.matDialog
      .open(AddAllowedEmailDomainDialogComponent, {
        data: {
          platform: this.platform,
        },
      })
      .afterClosed()
      .pipe(
        tap((domain) => {
          if (domain) {
            const platform: Platform = JSON.parse(
              JSON.stringify(this.platform)
            );
            platform.allowedAuthDomains.push(domain);
            this.matSnackbar.openFromComponent(
              GenericSnackbarTemplateComponent,
              {
                data: `Added <b>${domain}</b>`,
              }
            );
          }
        })
      );
  }
  removeDomain(domain: string) {
    const platform: Platform = JSON.parse(JSON.stringify(this.platform));
    platform.allowedAuthDomains = platform.allowedAuthDomains.filter(
      (d) => d !== domain
    );
    platform.enforceAllowedAuthDomains = platform.allowedAuthDomains.length > 0;
    this.domainsBeingRemoved[domain] = true;
    this.removeDomain$ = this.platformService
      .updatePlatform(
        {
          enforceAllowedAuthDomains: platform.enforceAllowedAuthDomains,
          allowedAuthDomains: platform.allowedAuthDomains,
        },
        platform.id
      )
      .pipe(
        tap(() => {
          this.matSnackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `Removed <b>${domain}</b>`,
          });
          this.domainsBeingRemoved[domain] = false;
        }),
        catchError((err) => {
          console.error(err);
          this.matSnackbar.open(unexpectedErrorMessage, '', {
            panelClass: 'error',
          });
          platform.allowedAuthDomains.push(domain);
          return of(void 0);
        })
      );
  }
}
