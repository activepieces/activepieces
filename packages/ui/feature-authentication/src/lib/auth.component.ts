import { Component } from '@angular/core';
import { FlagService } from '@activepieces/ui/common';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthLayoutComponent {
  fullLogoUrl$: Observable<string>;
  constructor(private flagService: FlagService) {
    this.fullLogoUrl$ = this.flagService
      .getLogos()
      .pipe(map((logos) => logos.fullLogoUrl));
  }
}
