import { Component, Input } from '@angular/core';
import { AddButtonCore } from '../add-button-core';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-big-add-button',
  templateUrl: './big-add-button.component.html',
  styleUrls: ['./big-add-button.component.scss'],
})
export class BigAddButtonComponent extends AddButtonCore {
  @Input() top = '';
  @Input() left = '';
  @Input() showDropZoneIndicator = false;
  showBoxShadow = false;
  constructor(store: Store) {
    super(store);
  }
}
