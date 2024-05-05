import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { RunsTableComponent } from '../../components/runs-table/runs-table.component';
import { IssuesTableComponent } from '../../components/issues-table/issues-table.component';
import { TabsPageCoreComponent } from '../../components/tabs-page-core/tabs-page-core.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { PopulatedIssue } from '@activepieces/ee-shared';
import { FlowRunStatus } from '@activepieces/shared';

@Component({
  selector: 'app-executions',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    RunsTableComponent,
    IssuesTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class=" ap-px-[30px] ap-pt-[50px]">
      <ap-page-title title="Executions" i18n-title></ap-page-title>
      <mat-tab-group
        #tabs
        (selectedTabChange)="tabChanged($event)"
        class="ap-gap-4"
        dynamicHeight
        mat-stretch-tabs="false"
        mat-align-tabs="start"
        animationDuration="0"
      >
        <mat-tab i18n-label label="Runs">
          <div class="ap-mt-1">
            <app-runs-table #runsTable></app-runs-table>
          </div>
        </mat-tab>

        <mat-tab i18n-label label="Issues">
          <div class="ap-mt-1">
            <app-issues-table
              (issueClicked)="issueClicked($event.issue)"
              #IssuesTable
            ></app-issues-table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
    @if(fragmentChanged$ | async){}
  `,
})
export class ExecutionsComponent
  extends TabsPageCoreComponent
  implements AfterViewInit
{
  @ViewChild('tabs') tabGroupView?: MatTabGroup;
  @ViewChild('runsTable') runsTable?: RunsTableComponent;
  @ViewChild('IssuesTable') IssuesTable?: IssuesTableComponent;
  constructor(router: Router, route: ActivatedRoute) {
    super(
      [
        {
          fragmentName: 'Runs',
        },
        {
          fragmentName: 'Issues',
        },
      ],
      router,
      route
    );
  }
  ngAfterViewInit(): void {
    this.tabGroup = this.tabGroupView;
    this.afterViewInit();
  }
  override tabChanged(event: MatTabChangeEvent) {
    if (event.index < 0 || event.index >= this.tabIndexFragmentMap.length) {
      console.warn('tab index out of bounds');
      return;
    }

    if (
      this.route.snapshot.fragment !==
      this.tabIndexFragmentMap[event.index].fragmentName
    ) {
      const queryParams =
        event.index === 0
          ? this.runsTable?.getCurrentQueryParams()
          : this.IssuesTable?.getCurrentQueryParams();
      this.updateFragment(
        this.tabIndexFragmentMap[event.index].fragmentName,
        queryParams ?? {}
      );
    }
  }

  issueClicked(issue: PopulatedIssue) {
    const runsTabIndex = this.tabIndexFragmentMap.findIndex(
      (i) => i.fragmentName === 'Runs'
    );
    if (this.tabGroup) {
      this.tabGroup.selectedIndex = runsTabIndex;
    }
    this.runsTable?.setParams(FlowRunStatus.FAILED, issue.flowId);
  }
}
