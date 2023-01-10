import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
@Injectable({
	providedIn: 'root',
})
export class PosthogService {
	constructor() {}
	init() {
		posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
			api_host: 'https://app.posthog.com',
			autocapture: false,
		});
	}
	captureEvent(eventName: string, eventDetails: Object) {
		posthog.capture(eventName, eventDetails);
	}
}
