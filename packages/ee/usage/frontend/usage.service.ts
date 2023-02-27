import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../frontend/src/environments/environment';


@Injectable({
	providedIn: 'root',
})
export class UsageService {

	constructor(private http: HttpClient) { }

	getUsage() {
		return this.http.get<{ metrics: { steps: { remaining: number, consumed: number, nextResetInMs: number } } }>(environment.apiUrl + '/usage')
	}
}
