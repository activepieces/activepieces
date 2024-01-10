import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Platform } from '@activepieces/ee-shared';
import { MatDialog } from '@angular/material/dialog';
import { Observable, catchError, of, tap } from 'rxjs';
import { AddAllowedEmailDomainDialogComponent } from '../dialogs/add-allowed-email-domain-dialog/add-allowed-email-domain-dialog.component';
import {
  GenericSnackbarTemplateComponent,
  PlatformService,
  unexpectedErrorMessage,
} from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-allowed-email-domains-list',
  templateUrl: './allowed-email-domains-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllowedEmailDomainsListComponent {
  @Input({ required: true }) platform!: Platform;
  @Output() platformUpdated = new EventEmitter<Platform>();
  domainsBeingRemoved: Record<string, boolean> = {};
  addDomain$?: Observable<string>;
  removeDomain$?: Observable<void>;
  constructor(
    private matDialog: MatDialog,
    private platformService: PlatformService,
    private matSnackbar: MatSnackBar
  ) {}
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
            this.platformUpdated.emit(platform);
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
    this.domainsBeingRemoved[domain] = true;
    this.removeDomain$ = this.platformService
      .updatePlatform(platform, platform.id)
      .pipe(
        tap(() => {
          this.platformUpdated.emit(platform);
          this.matSnackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `Removed <b>${domain}</b>`,
          });
          this.domainsBeingRemoved[domain] = true;
        }),
        catchError((err) => {
          console.error(err);
          this.matSnackbar.open(unexpectedErrorMessage, '', {
            panelClass: 'error',
          });
          platform.allowedAuthDomains.push(domain);
          this.platformUpdated.emit(platform);
          return of(void 0);
        })
      );
  }
}
