import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-billing-sidenav-item',
  templateUrl: './billing-sidenav-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingSidenavItemComponent {
  options = {
    path: '/assets/lottie/gift.json',
  };
}
