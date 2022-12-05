import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { SeekPage } from './seek-page';
import { Account } from '../model/account.interface';

@Injectable({
	providedIn: 'root',
})
export class AccountService {
	constructor(private http: HttpClient) {}

	create(environmentId: UUID, request: { name: string }): Observable<Account> {
		return this.http.post<Account>(environment.apiUrl + '/environments/' + environmentId + '/accounts', request);
	}

	get(accountId: UUID): Observable<Account> {
		return this.http.get<Account>(environment.apiUrl + '/accounts/' + accountId);
	}

	getByNameAndEnvironment(environmentId: UUID, accountName: string): Observable<Account> {
		return this.http.get<Account>(
			environment.apiUrl + '/environments/' + environmentId + '/accounts/' + encodeURIComponent(accountName)
		);
	}

	list(environmentId: UUID, limit: number): Observable<SeekPage<Account>> {
		return this.http.get<SeekPage<Account>>(
			environment.apiUrl + '/environments/' + environmentId + '/accounts?limit=' + limit
		);
	}

	delete(accountId: UUID): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/accounts/' + accountId);
	}

	emptyPage() {
		return {
			hasMore: false,
			data: [],
		};
	}
}
