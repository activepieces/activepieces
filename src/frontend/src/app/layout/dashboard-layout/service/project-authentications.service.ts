import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { skipWhile, switchMap, take } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthenticationType } from '../../common-layout/helper/authentication-type.enum';
import { ProjectAuthentication } from '../../common-layout/model/authentication';
import { Store } from '@ngrx/store';
import { ProjectSelectors } from '../../common-layout/store/selector/project.selector';

@Injectable({
	providedIn: 'root',
})
export class ProjectAuthenticationService {
	constructor(private http: HttpClient, private store: Store) {}

	getAuthentications() {
		return this.store.select(ProjectSelectors.selectProject).pipe(
			skipWhile(project => project === undefined),
			take(1),
			switchMap(project => {
				return this.http.get<ProjectAuthentication[]>(environment.apiUrl + `/projects/${project!.id}/authentications`);
			})
		);
	}

	updateFirebaseProjectId(projectId: string, environmentId: UUID) {
		return this.http.post<ProjectAuthentication>(
			environment.apiUrl + `/environments/${environmentId}/authentications`,
			{ type: AuthenticationType.FIREBASE, firebaseProjectId: projectId }
		);
	}
	generateSigningKey(environmentId: UUID) {
		return this.http.post<ProjectAuthentication>(
			environment.apiUrl + `/environments/${environmentId}/authentications`,
			{ type: AuthenticationType.SIGNING_KEY }
		);
	}
}
