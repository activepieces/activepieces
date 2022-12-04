import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ProjectAuthentication } from '../../common-layout/model/authentication';
import { ProjectAuthenticationService } from '../service/project-authentications.service';

@Injectable({
	providedIn: 'root',
})
export class AuthenticationResolver implements Resolve<ProjectAuthentication[]> {
	constructor(private authenticationsService: ProjectAuthenticationService) {}
	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ProjectAuthentication[]> {
		return this.authenticationsService.getAuthentications();
	}
}
