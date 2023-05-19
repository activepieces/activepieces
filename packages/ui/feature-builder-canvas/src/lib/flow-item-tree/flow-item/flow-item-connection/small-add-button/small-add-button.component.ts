import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FlowRendererService } from '@activepieces/ui/feature-builder-store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-small-add-button',
  templateUrl: './small-add-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallAddButtonComponent {
  @Input() left = '';
  @Input() top = '';
  @Input() showDropzoneIndicator = false;
  isInDraggingMode$: Observable<boolean>;
  constructor(private flowRendererService: FlowRendererService) {
    this.isInDraggingMode$ =
      this.flowRendererService.draggingSubject.asObservable();
  }
}
