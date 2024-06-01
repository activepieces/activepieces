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
import { GeneralSettingsComponent } from '../../components/general-settings/general-settings.component';
import { AlertsTableComponent } from '../../components/alerts-table/alerts-table.component';

@Component({
  standalone: true,
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    UiCommonModule,
    SyncProjectComponent,
    UiFeaturePiecesModule,
    GeneralSettingsComponent,
    AlertsTableComponent,
  ],
})
export class SettingsPageComponent implements AfterViewInit {
  @ViewChild('tabs') tabGroup?: MatTabGroup;
  title = $localize`Settings`;
  fragmentChanged$?: Observable<string | null>;
  readonly gitSyncTableTitle = $localize`Git Sync`;
  readonly piecesTable = $localize`Pieces`;
  readonly generalSettingsTable = $localize`General`;
  readonly alertsTable = $localize`Alerts`;
  readonly tabIndexFragmentMap = [
    { fragmentName: 'General' },
    { fragmentName: 'Pieces' },
    { fragmentName: 'GitSync' },
    { fragmentName: 'Alerts' },
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
