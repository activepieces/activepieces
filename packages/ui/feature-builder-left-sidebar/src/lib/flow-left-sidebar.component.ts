import { Component, OnInit } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  LeftSideBarType,
} from '@activepieces/ui/feature-builder-store';
import { PopulatedFlow, ProjectWithLimits } from '@activepieces/shared';
import { ProjectService } from '@activepieces/ui/common';

@Component({
  selector: 'app-flow-left-sidebar',
  templateUrl: './flow-left-sidebar.component.html',
})
export class FlowLeftSidebarComponent implements OnInit {
  leftSideBar$: Observable<LeftSideBarType>;
  flow$: Observable<PopulatedFlow>;
  project$: Observable<ProjectWithLimits>;
  constructor(private store: Store, private projectService: ProjectService) {
    this.flow$ = this.store.select(BuilderSelectors.selectCurrentFlow);
    this.project$ = this.projectService.currentProject$.pipe(
      map((project) => project!)
    );
  }

  ngOnInit(): void {
    this.leftSideBar$ = this.store.select(
      BuilderSelectors.selectCurrentLeftSidebarType
    );
  }

  get leftSideBarType() {
    return LeftSideBarType;
  }
}
