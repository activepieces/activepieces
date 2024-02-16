import { Component, Input, OnInit } from '@angular/core';
import { AddButtonCoreComponent } from '../add-button-core.component';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StepLocationRelativeToParent } from '@activepieces/shared';
import {
  BIG_BUTTON_SIZE,
  FLOW_ITEM_BOTTOM_PADDING,
  FLOW_ITEM_HEIGHT,
  SvgDrawer,
} from '@activepieces/ui-canvas-utils';
import { FlowRendererService } from '@activepieces/ui/common';

@Component({
  selector: 'app-big-add-button',
  templateUrl: './big-add-button.component.html',
  styleUrls: ['./big-add-button.component.scss'],
})
export class BigAddButtonComponent
  extends AddButtonCoreComponent
  implements OnInit
{
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
  }
  ngOnInit(): void {
    if (
      this.stepLocationRelativeToParent ===
      StepLocationRelativeToParent.INSIDE_LOOP
    ) {
      this.setFillerLinesCommandForLoop();
      this.setFillerLinesForReadOnlyLoop();
    } else if (
      this.stepLocationRelativeToParent ===
        StepLocationRelativeToParent.INSIDE_FALSE_BRANCH ||
      this.stepLocationRelativeToParent ===
        StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
    ) {
      this.setFillerLinesCommandForBranch();
      this.setFillerLinesForReadOnlyBranch();
    }
  }

  setFillerLinesCommandForLoop() {
    const startX = BIG_BUTTON_SIZE / 2;
    const startY = -(FLOW_ITEM_HEIGHT - BIG_BUTTON_SIZE) / 2;
    const lineLength =
      (FLOW_ITEM_HEIGHT - BIG_BUTTON_SIZE) / 2 -
      this.PADDING_BETWEEN_BUTTON_AND_LINE;
    this.fillerLinesCommand = SvgDrawer.empty()
      .move(startX, startY)
      .drawVerticalLine(lineLength)
      .move(startX, BIG_BUTTON_SIZE + this.PADDING_BETWEEN_BUTTON_AND_LINE)
      .drawVerticalLine(lineLength + FLOW_ITEM_BOTTOM_PADDING)
      .toSvg().content;
  }
  setFillerLinesCommandForBranch() {
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
  }

  setFillerLinesForReadOnlyLoop() {
    const startX = BIG_BUTTON_SIZE / 2;
    const startY = -(FLOW_ITEM_HEIGHT - BIG_BUTTON_SIZE) / 2;
    const lineLength =
      FLOW_ITEM_BOTTOM_PADDING + (FLOW_ITEM_HEIGHT - BIG_BUTTON_SIZE) / 2;
    this.replacementLineWhenViewingRun = SvgDrawer.empty()
      .move(startX, startY)
      .drawVerticalLine(2 * lineLength + BIG_BUTTON_SIZE)
      .toSvg().content;
  }
  setFillerLinesForReadOnlyBranch() {
    const startX = BIG_BUTTON_SIZE / 2;
    const startY =
      -FLOW_ITEM_BOTTOM_PADDING - (FLOW_ITEM_HEIGHT - BIG_BUTTON_SIZE) / 2;
    const lineLength =
      FLOW_ITEM_BOTTOM_PADDING + (FLOW_ITEM_HEIGHT - BIG_BUTTON_SIZE) / 2;
    this.replacementLineWhenViewingRun = SvgDrawer.empty()
      .move(startX, startY)
      .drawVerticalLine(2 * lineLength + BIG_BUTTON_SIZE)
      .toSvg().content;
  }
}
