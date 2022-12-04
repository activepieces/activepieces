import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class TimeHelperService {
	constructor() {}

	formatDateTimeMilli(epochMilli: number) {
		const date = new Date(epochMilli);
		return date.toLocaleString();
	}

	countDownTimeDaysOnly(epochTimestamp: number) {
		const now = new Date();
		const utcSecondsSinceEpoch = now.getTime() / 1000;
		const diff = epochTimestamp - utcSecondsSinceEpoch;
		if (diff < 0) {
			return undefined;
		}
		const days = Math.floor(diff / (24 * 60 * 60));
		const daysString = days.toString();
		return `${daysString}-Day` + (days > 1 ? 's' : '');
	}

	countDownTimeLeft(epochTimestamp: number) {
		const now = new Date();
		const utcSecondsSinceEpoch = now.getTime() / 1000;
		const diff = epochTimestamp - utcSecondsSinceEpoch;
		if (diff < 0) {
			return '00 d - 00 hrs';
		}
		const days = Math.floor(diff / (24 * 60 * 60));
		const hours = Math.floor((diff - days * 24 * 60 * 60) / (60 * 60));
		const daysString = days.toString().padStart(2, '0');
		const hoursString = hours.toString().padStart(2, '0');
		return `${daysString} d - ${hoursString} hrs `;
	}

	formatDateTimeMills(epochMills: number) {
		const date = new Date(epochMills);
		return date.toLocaleString();
	}

	formatDateTime(epochSeconds: number) {
		const date = new Date(epochSeconds * 1000);
		return date.toLocaleString();
	}

	formatDate(epochSeconds: number) {
		const date = new Date(epochSeconds * 1000);
		return date.toLocaleDateString();
	}

	formatDateToString(date: Date) {
		const dateMonthAndYear = date.toLocaleDateString('en-us', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
		const dateTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
		return `${dateMonthAndYear} at ${dateTime}`;
	}
}
