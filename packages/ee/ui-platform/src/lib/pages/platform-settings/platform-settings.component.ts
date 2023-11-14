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
  readonly signingKeysTabTitle = $localize`Signing Keys`;
  readonly privacyAndTermsTabTitle = $localize`Privacy & Terms`;
  readonly accountManagementEmailTabTitle = $localize`Account Management Emails`;
  readonly tabIndexFragmentMap: { [index: number]: string } = {
    0: 'signingKeys',
    1: 'SMTP',
    2: 'privacyAndTerms',
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
    if (event.index < 0 || event.index > 2) return;
    this.updateFragment(this.tabIndexFragmentMap[event.index]);
  }
}
