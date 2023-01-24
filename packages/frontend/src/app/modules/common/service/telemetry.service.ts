import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import { TelemetryEvent } from "@activepieces/shared";
import { AuthenticationService } from './authentication.service';

@Injectable({
	providedIn: 'root',
})
export class TelemetryService {
	constructor(private authService: AuthenticationService) { }
	init() {
		posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
			api_host: 'https://app.posthog.com',
			autocapture: false,
		});
		this.authService.currentUserSubject.subscribe(user => {
			if (user !== null && user !== undefined) {
				posthog.identify(user.id);
			}
		});
	}
	captureEvent(telemetry: TelemetryEvent) {
		this.authService.isTelemetryEnabled().subscribe(value => {
			if (value) {
				posthog.capture(telemetry.name, telemetry.payload ?? {});
			}
		});
	}
}
