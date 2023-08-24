import { Component } from '@angular/core';
import { environment, initialiseBeamer } from '@activepieces/ui/common';

@Component({
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss'],
  selector: 'app-dashboard-container',
})
export class DashboardContainerComponent {
  constructor() {
    if (environment.activateBeamer) {
      initialiseBeamer();
    }
  }

  get environment() {
    return environment;
  }
}
