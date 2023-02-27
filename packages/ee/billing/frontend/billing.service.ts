import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BillingResponse } from '../shared/billing-response';
import { environment } from '../../../frontend/src/environments/environment';


@Injectable({
	providedIn: 'root',
})
export class BillingService {

	constructor(private http: HttpClient) { }

	getUsage() {
		return this.http.get<BillingResponse>(environment.apiUrl + '/billing')
	}
}
