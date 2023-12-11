import { Component, Input } from '@angular/core';
import { AddButtonCoreComponent } from '../add-button-core.component';
import { Store } from '@ngrx/store';
import { FlowRendererService } from '@activepieces/ui/feature-builder-store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BIG_BUTTON_SIZE } from '../../../../canvas-utils/drawing/draw-common';

@Component({
  selector: 'app-big-add-button',
  templateUrl: './big-add-button.component.html',
  styleUrls: ['./big-add-button.component.scss'],
})
export class BigAddButtonComponent extends AddButtonCoreComponent {
  readonly BIG_BUTTON_SIZE = BIG_BUTTON_SIZE;
  showBoxShadow = false;
  @Input({ required: true })
  inReadOnlyMode = false;

  constructor(
    store: Store,
    flowRendererService: FlowRendererService,
    snackbar: MatSnackBar
  ) {
    super(store, flowRendererService, snackbar);
  }
}
