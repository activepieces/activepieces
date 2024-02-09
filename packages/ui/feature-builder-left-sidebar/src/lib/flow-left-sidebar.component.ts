import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  LeftSideBarType,
} from '@activepieces/ui/feature-builder-store';
import { PopulatedFlow, Project } from '@activepieces/shared';
import { ProjectSelectors } from '@activepieces/ui/common';

@Component({
  selector: 'app-flow-left-sidebar',
  templateUrl: './flow-left-sidebar.component.html',
})
export class FlowLeftSidebarComponent implements OnInit {
  leftSideBar$: Observable<LeftSideBarType>;
  flow$: Observable<PopulatedFlow>;
  project$: Observable<Project>;
  constructor(private store: Store) {
    this.flow$ = this.store.select(BuilderSelectors.selectCurrentFlow);
    this.project$ = this.store.select(ProjectSelectors.selectCurrentProject);
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
