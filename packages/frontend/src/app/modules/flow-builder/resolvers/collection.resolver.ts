import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { Collection } from '@activepieces/shared';
import { CollectionService } from '../../common/service/collection.service';

@Injectable({
	providedIn: 'root',
})
export class CollectionResolver implements Resolve<Observable<Collection>> {
	constructor(private collectionService: CollectionService) {}

	resolve(snapshot: ActivatedRouteSnapshot): Observable<Collection> {
		const collectionId = snapshot.paramMap.get('id') as string;
		return this.collectionService.get(collectionId);
	}
}
