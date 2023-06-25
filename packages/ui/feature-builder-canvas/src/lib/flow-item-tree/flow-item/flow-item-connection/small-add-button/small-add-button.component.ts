import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FlowRendererService } from '@activepieces/ui/feature-builder-store';
import { Observable } from 'rxjs';
import { AddButtonCore } from '../add-button-core';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-small-add-button',
  templateUrl: './small-add-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallAddButtonComponent extends AddButtonCore {
  @Input() left = '';
  @Input() top = '';
  @Input() showDropzoneIndicator = false;
  isInDraggingMode$: Observable<boolean>;
  constructor(private flowRendererService: FlowRendererService, store: Store) {
    super(store);
    this.isInDraggingMode$ =
      this.flowRendererService.draggingSubject.asObservable();
  }
}
