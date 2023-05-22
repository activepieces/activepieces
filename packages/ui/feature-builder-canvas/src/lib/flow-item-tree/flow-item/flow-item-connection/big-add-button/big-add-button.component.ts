import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-big-add-button',
  templateUrl: './big-add-button.component.html',
  styleUrls: ['./big-add-button.component.scss'],
})
export class BigAddButtonComponent {
  @Input() top = '';
  @Input() left = '';
  showBoxShadow = false;
  @Input() showDropZoneIndicator = false;
}
