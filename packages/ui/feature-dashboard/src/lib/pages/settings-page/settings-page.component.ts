import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Observable, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeaturePiecesModule } from '@activepieces/ui/feature-pieces';
import { SyncProjectComponent } from '@activepieces/ui-feature-git-sync';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    SyncProjectComponent,
    UiFeaturePiecesModule,
  ],
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements AfterViewInit {
  @ViewChild('tabs') tabGroup?: MatTabGroup;
  title = $localize`Settings`;
  fragmentChanged$: Observable<string | null>;
  readonly gitSyncTableTitle = $localize`Git Sync`;
  readonly piecesTable = $localize`Pieces`;
  readonly tabIndexFragmentMap = [
    { fragmentName: 'Pieces' },
    { fragmentName: 'GitSync' },
  ];

  constructor(private router: Router, private route: ActivatedRoute) {
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

  public showTab(fragment: string) {
    return (
      this.tabIndexFragmentMap.findIndex((i) => i.fragmentName === fragment) !==
      -1
    );
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
