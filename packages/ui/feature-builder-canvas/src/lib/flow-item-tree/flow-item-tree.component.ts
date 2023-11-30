import { Component, OnInit } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  BuilderSelectors,
  FlowItem,
} from '@activepieces/ui/feature-builder-store';
import { FlowDrawer } from '../canvas-utils/drawing/flow-drawer';
import { Store } from '@ngrx/store';
import { PositionedStep } from '../canvas-utils/drawing/step-card';
import { PositionButton } from '../canvas-utils/drawing/draw-common';

@Component({
  selector: 'app-flow-item-tree',
  templateUrl: './flow-item-tree.component.html',
})
export class FlowItemTreeComponent implements OnInit {
  activePiece$: Observable<FlowItem | undefined>;
  navbarOpen = false;
  flowDrawer$: Observable<FlowDrawer>;
  constructor(private store: Store) {}

  ngOnInit(): void {
    const flowVersion$ = this.store.select(
      BuilderSelectors.selectShownFlowVersion
    );
    this.flowDrawer$ = flowVersion$.pipe(
      map((version) => {
        return FlowDrawer.construct(version.trigger).offset(575, 110);
      })
    );
  }

  flowItemsTrackBy(_: number, item: PositionedStep) {
    return item.content?.name;
  }
  buttonsTrackBy(_: number, item: PositionButton) {
    return `${item.x}+${item.y}`;
  }
}
