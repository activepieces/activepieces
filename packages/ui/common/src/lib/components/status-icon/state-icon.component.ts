import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ap-state-icon',
  templateUrl: './state-icon.component.html',
})
export class StateIconComponent implements OnInit {
  @Input() size = 16;
  @Input() succeeded: boolean | undefined;
  @Input() showStatusText = true;
  @Input() textAfter = '';
  ngOnInit(): void {
    if (!this.textAfter || this.textAfter.length === 0) {
      this.textAfter = this.succeeded ? 'Success' : 'Failed';
    }
  }
}
