import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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

  constructor(store: Store) {
    super(store);
  }
}
