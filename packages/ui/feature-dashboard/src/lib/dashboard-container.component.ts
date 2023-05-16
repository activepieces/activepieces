import { Component, OnInit } from '@angular/core';
import { initialiseBeamer } from '@activepieces/ui/common';

@Component({
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss'],
  selector: 'app-dashboard-container',
})
export class DashboardContainerComponent implements OnInit {
  ngOnInit(): void {
    initialiseBeamer();
  }
}
