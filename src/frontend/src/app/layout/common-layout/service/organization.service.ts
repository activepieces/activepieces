import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Organization } from '../model/organisation.interface';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { OrganizationSize } from '../model/enum/organization-size';

@Injectable({
	providedIn: 'root',
})
export class OrganizationService {
	constructor(private http: HttpClient) {}

	cachedOrg: Observable<Organization>;
	waitingForOrg: boolean = false;

	create(request: { name: string; size: OrganizationSize }): Observable<Organization> {
		return this.http.post<Organization>(environment.apiUrl + '/organizations', request);
	}

	update(organization: Organization): Observable<Organization> {
		return this.http.post<Organization>(environment.apiUrl + '/organizations/' + organization.id, organization);
	}

	get(organizationId: string): Observable<Organization> {
		return this.http.get<Organization>(environment.apiUrl + '/organizations/' + organizationId);
	}

	list(): Observable<Organization[]> {
		return this.http.get<Organization[]>(environment.apiUrl + '/organizations');
	}

	delete(organisationId: string): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/organizations/' + organisationId);
	}
}
