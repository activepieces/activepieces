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
import { PLATFORM_RESOLVER_KEY } from '@activepieces/ui/common';
import { PLATFORM_DEMO_RESOLVER_KEY } from '../../is-platform-demo.resolver';
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
  readonly tabIndexFragmentMap = [
    { fragmentName: 'Updates', removeOnDemo: false },
    { fragmentName: 'SigningKeys', removeOnDemo: true },
    { fragmentName: 'MailServer', removeOnDemo: true },
    { fragmentName: 'CustomDomains', removeOnDemo: true },
    { fragmentName: 'ApiKeys', removeOnDemo: false },
    { fragmentName: 'SSO', removeOnDemo: false },
    { fragmentName: 'AuditLog', removeOnDemo: false },
  ];
  isDemo = false;
  platform?: Platform;
  constructor(private router: Router, private route: ActivatedRoute) {
    this.isDemo = this.route.snapshot.data[PLATFORM_DEMO_RESOLVER_KEY];
    if (this.isDemo) {
      this.tabIndexFragmentMap = this.tabIndexFragmentMap.filter(
        (i) => !i.removeOnDemo
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
