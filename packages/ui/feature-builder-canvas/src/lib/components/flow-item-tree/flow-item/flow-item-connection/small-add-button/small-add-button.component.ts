import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AddButtonCoreComponent } from '../add-button-core.component';
import { Store } from '@ngrx/store';
import { FlowRendererService } from '@activepieces/ui/feature-builder-store';
import { BUTTON_SIZE } from '../../../../canvas-utils/drawing/draw-common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-small-add-button',
  templateUrl: './small-add-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallAddButtonComponent extends AddButtonCoreComponent {
  readonly BUTTON_SIZE = BUTTON_SIZE;
  constructor(
    store: Store,
    flowRendererService: FlowRendererService,
    snackbar: MatSnackBar
  ) {
    super(store, flowRendererService, snackbar);
  }
}
