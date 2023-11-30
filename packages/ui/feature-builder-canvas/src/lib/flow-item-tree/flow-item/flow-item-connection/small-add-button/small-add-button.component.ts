import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AddButtonCoreComponent } from '../add-button-core.component';
import { Store } from '@ngrx/store';
import { FlowRendererService } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-small-add-button',
  templateUrl: './small-add-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallAddButtonComponent extends AddButtonCoreComponent {
  constructor(store: Store, flowRendererService: FlowRendererService) {
    super(store, flowRendererService);
  }
}
