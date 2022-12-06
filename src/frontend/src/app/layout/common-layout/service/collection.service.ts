import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Collection, CollectionVersion } from '../model/piece.interface';
import { forkJoin, Observable, switchMap, tap } from 'rxjs';
import { SeekPage } from './seek-page';
import { UUID } from 'angular2-uuid';

import {
	addArtifactsToFormData,
	ArtifactAndItsNameInFormData,
	zipAllArtifacts,
} from '../model/helper/artifacts-zipping-helper';
import { CodeService } from '../../flow-builder/service/code.service';
import { ConfigType, DropdownType } from '../model/enum/config.enum';
import { DynamicDropdownSettings } from '../model/fields/variable/config-settings';

@Injectable({
	providedIn: 'root',
})
export class CollectionService {
	constructor(private http: HttpClient, private codeService: CodeService) {}

	create(
		projectId: UUID,
		collection: {
			display_name: string;
		}
	): Observable<Collection> {
		return this.http.post<Collection>(environment.apiUrl + '/projects/' + projectId + '/collections', collection);
	}

	update(collectionId: UUID, collection: CollectionVersion, logo?: File): Observable<Collection> {
		const formData = new FormData();
		if (logo != undefined) {
			formData.append('logo', logo);
		}
		formData.append('collection', new Blob([JSON.stringify(collection)], { type: 'application/json' }));
		const artifactsAndTheirNames: ArtifactAndItsNameInFormData[] = [
			...this.getDynamicDropdownConfigsArtifacts(collection),
		];

		const updatePiece$ = this.http.put<Collection>(environment.apiUrl + '/collections/' + collectionId, formData);
		const artifacts$ = zipAllArtifacts(artifactsAndTheirNames);
		if (artifacts$.length == 0) return updatePiece$;
		return forkJoin(artifacts$).pipe(
			tap(zippedFilesAndTheirNames => {
				addArtifactsToFormData(zippedFilesAndTheirNames, formData);
			}),
			switchMap(() => {
				return updatePiece$;
			}),
			tap(() => {
				this.codeService.unmarkDirtyArtifactsInCollectionConfigsCache(collectionId);
			})
		);
	}

	getVersion(versionId: UUID): Observable<CollectionVersion> {
		return this.http.get<CollectionVersion>(environment.apiUrl + '/collection-versions/' + versionId);
	}

	listVersions(pieceId: UUID): Observable<CollectionVersion[]> {
		return this.http.get<CollectionVersion[]>(environment.apiUrl + '/collections/' + pieceId + '/versions/', {});
	}

	lock(pieceId: UUID): Observable<Collection> {
		return this.http.post<Collection>(environment.apiUrl + '/collections/' + pieceId + '/commit', {});
	}

	get(pieceId: UUID): Observable<Collection> {
		return this.http.get<Collection>(environment.apiUrl + '/collections/' + pieceId);
	}

	list(projectId: string, limit: number): Observable<SeekPage<Collection>> {
		return this.http.get<SeekPage<Collection>>(
			environment.apiUrl + '/projects/' + projectId + '/collections?limit=' + limit
		);
	}

	archive(pieceId: UUID): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/collections/' + pieceId);
	}

	getDynamicDropdownConfigsArtifacts(collection: CollectionVersion) {
		const artifacts: ArtifactAndItsNameInFormData[] = [];
		collection.configs.forEach(config => {
			const settings = config.settings as DynamicDropdownSettings;
			if (config.type === ConfigType.DROPDOWN && settings.dropdownType == DropdownType.DYNAMIC) {
				if (settings.artifactContent) artifacts.push({ artifact: settings.artifactContent, name: config.key });
			}
		});
		return artifacts;
	}
}
