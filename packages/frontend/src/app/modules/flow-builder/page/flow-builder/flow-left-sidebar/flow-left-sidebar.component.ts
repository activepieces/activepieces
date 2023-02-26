import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../store/builder/builder.selector';
import { LeftSideBarType } from '../../../../common/model/enum/left-side-bar-type.enum';

@Component({
  selector: 'app-flow-left-sidebar',
  templateUrl: './flow-left-sidebar.component.html',
  styleUrls: ['./flow-left-sidebar.component.css'],
})
export class FlowLeftSidebarComponent implements OnInit {
  leftSideBar$: Observable<LeftSideBarType>;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.leftSideBar$ = this.store.select(
      BuilderSelectors.selectCurrentLeftSidebarType
    );
  }

  get leftSideBarType() {
    return LeftSideBarType;
  }
}
