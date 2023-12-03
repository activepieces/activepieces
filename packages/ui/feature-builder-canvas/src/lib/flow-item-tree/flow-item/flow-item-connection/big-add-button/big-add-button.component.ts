import { Component } from '@angular/core';
import { AddButtonCoreComponent } from '../add-button-core.component';
import { Store } from '@ngrx/store';
import { FlowRendererService } from '@activepieces/ui/feature-builder-store';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-big-add-button',
  templateUrl: './big-add-button.component.html',
  styleUrls: ['./big-add-button.component.scss'],
})
export class BigAddButtonComponent extends AddButtonCoreComponent {
  showBoxShadow = false;
  constructor(
    store: Store,
    flowRendererService: FlowRendererService,
    snackbar: MatSnackBar
  ) {
    super(store, flowRendererService, snackbar);
  }
}
