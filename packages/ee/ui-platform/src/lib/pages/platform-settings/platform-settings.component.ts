import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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
  readonly customDomainTabTitle = $localize`Custom Domains`;
  readonly privacyAndTermsTabTitle = $localize`Privacy & Terms`;
  readonly accountManagementEmailTabTitle = $localize`Mail Server`;

  readonly tabIndexFragmentMap: { [index: number]: string } = {
    0: 'SigningKeys',
    1: 'MailServer',
    2: 'TermsAndServices',
    3: 'CustomDomains',
    4: 'ApiKeys',
    5: 'SSO',
  };

  constructor(private router: Router, private route: ActivatedRoute) {
    this.fragmentChanged$ = this.route.fragment.pipe(
      tap((fragment) => {
        if (fragment === null) {
          this.updateFragment(this.tabIndexFragmentMap[0]);
        } else {
          this.fragmentCheck(fragment);
        }
      })
    );
  }
  ngAfterViewInit(): void {
    const fragment = this.route.snapshot.fragment;
    if (fragment === null) {
      this.updateFragment(this.tabIndexFragmentMap[0]);
    } else {
      this.fragmentCheck(fragment);
    }
  }

  private fragmentCheck(fragment: string) {
    if (this.tabGroup) {
      const tabIndex = Object.values(this.tabIndexFragmentMap).indexOf(
        fragment
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
    const checkIfTabIndexIsInTabsMap = (index: number) => {
      return Object.keys(this.tabIndexFragmentMap).includes(index.toString());
    };
    if (!checkIfTabIndexIsInTabsMap(event.index)) return;
    this.updateFragment(this.tabIndexFragmentMap[event.index]);
  }
}
