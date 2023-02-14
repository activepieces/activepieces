import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import { TelemetryEvent, User } from "@activepieces/shared";
import { FlagService } from './flag.service';

@Injectable({
	providedIn: 'root',
})
export class TelemetryService {
	constructor(private flagService: FlagService) { }
	init(user: User) {
		posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
			api_host: 'https://app.posthog.com',
			autocapture: false,
		});
		if (user !== null && user !== undefined) {
			posthog.identify(user.id);
		}
	}
	captureEvent(telemetry: TelemetryEvent) {
		this.flagService.isTelemetryEnabled().subscribe(value => {
			if (value) {
				posthog.capture(telemetry.name, telemetry.payload ?? {});
			}
		});
	}
}
