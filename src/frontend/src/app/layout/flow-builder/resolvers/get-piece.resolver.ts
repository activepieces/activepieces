import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { Collection } from '../../common-layout/model/collection.interface';
import { CollectionService } from '../../common-layout/service/collection.service';
import { UUID } from 'angular2-uuid';

@Injectable({
	providedIn: 'root',
})
export class GetPieceResolver implements Resolve<Observable<Collection>> {
	constructor(private pieceService: CollectionService) {}

	resolve(snapshot: ActivatedRouteSnapshot): Observable<Collection> {
		const pieceId = snapshot.paramMap.get('id') as UUID;
		return this.pieceService.get(pieceId);
	}
}
