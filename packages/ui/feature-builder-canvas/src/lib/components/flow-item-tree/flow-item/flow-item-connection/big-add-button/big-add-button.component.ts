import { Component, Input } from '@angular/core';
import { AddButtonCoreComponent } from '../add-button-core.component';
import { Store } from '@ngrx/store';
import { FlowRendererService } from '@activepieces/ui/feature-builder-store';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BIG_BUTTON_SIZE,
  FLOW_ITEM_BOTTOM_PADDING,
  FLOW_ITEM_HEIGHT,
} from '../../../../canvas-utils/drawing/draw-common';
import { SvgDrawer } from '../../../../canvas-utils/drawing/svg-drawer';

@Component({
  selector: 'app-big-add-button',
  templateUrl: './big-add-button.component.html',
  styleUrls: ['./big-add-button.component.scss'],
})
export class BigAddButtonComponent extends AddButtonCoreComponent {
  readonly BIG_BUTTON_SIZE = BIG_BUTTON_SIZE;
  readonly PADDING_BETWEEN_BUTTON_AND_LINE = 12;
  showBoxShadow = false;
  @Input({ required: true })
  inReadOnlyMode = false;
  /**the two lines above and below the add button that connect it to the graph */
  fillerLinesCommand = '';
  replacementLineWhenViewingRun = '';
  constructor(
    store: Store,
    flowRendererService: FlowRendererService,
    snackbar: MatSnackBar
  ) {
    super(store, flowRendererService, snackbar);
    const startX = BIG_BUTTON_SIZE / 2;
    const startY =
      -FLOW_ITEM_BOTTOM_PADDING - (FLOW_ITEM_HEIGHT - BIG_BUTTON_SIZE) / 2;
    const lineLength =
      FLOW_ITEM_BOTTOM_PADDING + (FLOW_ITEM_HEIGHT - BIG_BUTTON_SIZE) / 2;
    this.fillerLinesCommand = SvgDrawer.empty()
      .move(startX, startY)
      .drawVerticalLine(lineLength - this.PADDING_BETWEEN_BUTTON_AND_LINE)
      .move(startX, BIG_BUTTON_SIZE + this.PADDING_BETWEEN_BUTTON_AND_LINE)
      .drawVerticalLine(lineLength)
      .toSvg().content;
    this.replacementLineWhenViewingRun = SvgDrawer.empty()
      .move(startX, startY)
      .drawVerticalLine(2 * lineLength + BIG_BUTTON_SIZE)
      .toSvg().content;
  }
}
