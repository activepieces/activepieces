import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { catchError, Observable, of } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { InstanceService } from '../../common/service/instance.service';
import { Instance } from '../../common/model/instance.interface';

@Injectable({
	providedIn: 'root',
})
export class InstacneResolver implements Resolve<Observable<Instance | undefined>> {
	constructor(private instanceService: InstanceService) {}

	resolve(snapshot: ActivatedRouteSnapshot): Observable<Instance | undefined> {
		const collectionId = snapshot.paramMap.get('id') as UUID;
		return this.instanceService.get(collectionId).pipe(
			catchError(err => {
				return of(undefined);
			})
		);
	}
}
