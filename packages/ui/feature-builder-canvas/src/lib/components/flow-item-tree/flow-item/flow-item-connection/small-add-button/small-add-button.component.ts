import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AddButtonCoreComponent } from '../add-button-core.component';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BUTTON_SIZE } from '@activepieces/ui-canvas-utils';
import { FlowRendererService } from '@activepieces/ui/common';

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
