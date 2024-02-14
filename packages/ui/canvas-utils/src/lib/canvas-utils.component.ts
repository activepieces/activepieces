import { AfterViewInit, Component } from '@angular/core';
import { PannerService } from './panning/panner.service';
import { ZoomingService } from './zooming/zooming.service';
import { Store } from '@ngrx/store';
import { Observable, map, take, tap } from 'rxjs';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { FlowDrawer } from './drawing/flow-drawer';

@Component({
  selector: 'app-canvas-utils',
  templateUrl: './canvas-utils.component.html',
})
export class CanvasUtilsComponent implements AfterViewInit {
  constructor(
    private zoomingService: ZoomingService,
    private pannerService: PannerService,
    private store: Store
  ) {}
  ngAfterViewInit(): void {
    this.recenter();
  }
  recenter$: Observable<void>;
  zoomIn() {
    this.zoomingService.zoomingScale$.next(
      Math.min(
        this.zoomingService.zoomingScale$.value +
          this.zoomingService.zoomingStep,
        this.zoomingService.zoomingMax
      )
    );
  }
  zoomOut() {
    this.zoomingService.zoomingScale$.next(
      Math.max(
        this.zoomingService.zoomingScale$.value -
          this.zoomingService.zoomingStep,
        this.zoomingService.zoomingMin
      )
    );
  }
  recenter() {
    this.recenter$ = this.store
      .select(BuilderSelectors.selectViewedVersion)
      .pipe(
        take(1),
        map((version) => {
          FlowDrawer.trigger = version.trigger;
          return FlowDrawer.construct(version.trigger).offset(0, 40);
        }),
        tap((drawer) => {
          this.pannerService.recenter(drawer.boundingBox().height);
        }),
        map(() => void 0)
      );
  }
}
