import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Platform } from '@activepieces/shared';
import { FlagService, PLATFORM_RESOLVER_KEY } from '@activepieces/ui/common';
import {
  APPEARANCE_DISABLED_RESOLVER_KEY,
  AUDIT_LOG_DISABLED_RESOLVER_KEY,
  CUSTOM_DOMAINS_DISABLED_RESOLVER_KEY,
  SIGNING_KEY_DISABLED_RESOLVER_KEY,
} from '@activepieces/ui/common';

@Component({
  selector: 'app-platform-settings',
  templateUrl: './platform-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformSettingsComponent implements AfterViewInit {
  @ViewChild('tabs') tabGroup?: MatTabGroup;
  title = $localize`Settings`;
  fragmentChanged$: Observable<string | null>;
  readonly apiKeysTabTitle = $localize`API Keys`;
  readonly signingKeysTabTitle = $localize`Signing Keys`;
  readonly AuditLogTabTitle = $localize`Audit Log`;
  readonly customDomainTabTitle = $localize`Custom Domains`;
  readonly accountManagementEmailTabTitle = $localize`Mail Server`;
  readonly newUpdateMessage = $localize`New update available`;

  readonly tabIndexFragmentMap = [
    { fragmentName: 'Updates' },
    { fragmentName: 'SigningKeys' },
    { fragmentName: 'MailServer' },
    { fragmentName: 'CustomDomains' },
    { fragmentName: 'ApiKeys' },
    { fragmentName: 'SSO' },
    { fragmentName: 'AuditLog' },
  ];
  removeSigningKey = false;
  removeMailServer = false;
  removeCustomDomain = false;
  auditLogFeatureLocked = false;
  platform?: Platform;
  isVersionMatch$: Observable<boolean>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private flagService: FlagService
  ) {
    this.auditLogFeatureLocked =
      this.route.snapshot.data[AUDIT_LOG_DISABLED_RESOLVER_KEY];
    this.removeSigningKey =
      this.route.snapshot.data[SIGNING_KEY_DISABLED_RESOLVER_KEY];
    if (this.removeSigningKey) {
      this.tabIndexFragmentMap = this.tabIndexFragmentMap.filter(
        (i) => i.fragmentName !== 'SigningKeys'
      );
    }
    this.removeMailServer =
      this.route.snapshot.data[APPEARANCE_DISABLED_RESOLVER_KEY];
    if (this.removeMailServer) {
      this.tabIndexFragmentMap = this.tabIndexFragmentMap.filter(
        (i) => i.fragmentName !== 'MailServer'
      );
    }
    this.removeCustomDomain =
      this.route.snapshot.data[CUSTOM_DOMAINS_DISABLED_RESOLVER_KEY];
    if (this.removeCustomDomain) {
      this.tabIndexFragmentMap = this.tabIndexFragmentMap.filter(
        (i) => i.fragmentName !== 'CustomDomains'
      );
    }
    this.platform = this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
    this.fragmentChanged$ = this.route.fragment.pipe(
      tap((fragment) => {
        if (fragment === null) {
          this.updateFragment(this.tabIndexFragmentMap[0].fragmentName);
        } else {
          this.fragmentCheck(fragment);
        }
      })
    );
    this.isVersionMatch$ = this.flagService.isVersionMatch();
  }
  ngAfterViewInit(): void {
    const fragment = this.route.snapshot.fragment;
    if (fragment === null) {
      this.updateFragment(this.tabIndexFragmentMap[0].fragmentName);
    } else {
      this.fragmentCheck(fragment);
    }
  }

  private fragmentCheck(fragment: string) {
    if (this.tabGroup) {
      const tabIndex = this.tabIndexFragmentMap.findIndex(
        (i) => i.fragmentName === fragment
      );
      if (tabIndex >= 0) {
        this.tabGroup.selectedIndex = tabIndex;
      }
    }
  }

  updateFragment(newFragment: string) {
    this.router.navigate([], {
      fragment: newFragment,
    });
  }

  tabChanged(event: MatTabChangeEvent) {
    if (event.index < 0 || event.index >= this.tabIndexFragmentMap.length)
      return;
    this.updateFragment(this.tabIndexFragmentMap[event.index].fragmentName);
  }
}
