import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BillingResponse }from "@activepieces/ee/shared";
import { environment } from '@activepieces/ui/common';

@Injectable({
	providedIn: 'root',
})
export class BillingService {

	constructor(private http: HttpClient) { }

	getUsage() {
		return this.http.get<BillingResponse>(environment.apiUrl + '/billing')
	}
}
