import { FlagService } from '@activepieces/ui/common';
import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';

@Component({
	templateUrl: './firebase-auth-container.component.html',
	styleUrls: [],
})
export class FirebaseAuthContainerComponent {
	fullLogoUrl$: Observable<string>;
	constructor(private flagService: FlagService) {
	  this.fullLogoUrl$ = this.flagService
		.getLogos()
		.pipe(map((logos) => logos.fullLogoUrl));
	}
  }
  