import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { FlowVersion } from '@activepieces/shared';
import {
  BuilderSelectors,
  Step,
  NO_PROPS,
  RightSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { FlowItemDetails } from '@activepieces/ui/common';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

@Component({
  selector: 'app-edit-step-sidebar',
  templateUrl: './edit-step-sidebar.component.html',
  styleUrls: [],
})
export class EditStepSidebarComponent implements OnInit {
  displayNameChanged$: BehaviorSubject<string> = new BehaviorSubject('Step');
  selectedStepAndFlowId$?: Observable<{
    step: Step | null | undefined;
    version: FlowVersion;
  }>;
  selectedFlowItemDetails$: Observable<FlowItemDetails | undefined> =
    of(undefined);
  constructor(
    private store: Store,
    private cd: ChangeDetectorRef,
    private pieceService: PieceMetadataService
  ) {}

  ngOnInit(): void {
    //in case you switch piece while the edit piece panel is opened
    this.selectedStepAndFlowId$ = combineLatest({
      step: this.store.select(BuilderSelectors.selectCurrentStep),
      version: this.store.select(BuilderSelectors.selectViewedVersion),
    }).pipe(
      distinctUntilChanged((prev, current) => {
        return (
          prev.version.id === current.version.id &&
          prev.step?.name === current.step?.name
        );
      }),
      tap((result) => {
        if (result.step) {
          this.displayNameChanged$.next(result.step.displayName);
          this.selectedFlowItemDetails$ = this.pieceService.getStepDetails(
            result.step
          );
          this.cd.markForCheck();
        } else {
          this.selectedFlowItemDetails$ = of(undefined);
        }
      })
    );
  }

  closeSidebar() {
    this.store.dispatch(
      canvasActions.setRightSidebar({
        sidebarType: RightSideBarType.NONE,
        props: NO_PROPS,
        deselectCurrentStep: true,
      })
    );
  }
}
