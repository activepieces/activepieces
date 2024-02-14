import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasUtilsComponent } from './canvas-utils.component';
import { CanvasPannerDirective } from './panning/panner.directive';
import { UiCommonModule } from '@activepieces/ui/common';
@NgModule({
  imports: [CommonModule, UiCommonModule],
  declarations: [CanvasUtilsComponent, CanvasPannerDirective],
  exports: [CanvasUtilsComponent, CanvasPannerDirective],
})
export class UiCanvasUtilsModule {}
