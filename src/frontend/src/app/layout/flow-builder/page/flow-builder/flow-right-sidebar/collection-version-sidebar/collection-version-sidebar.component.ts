import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../../../common-layout/service/theme.service';
import { TimeHelperService } from '../../../../../common-layout/service/time-helper.service';
import { VersionEditState } from '../../../../../common-layout/model/enum/version-edit-state.enum';
import { CollectionService } from '../../../../../common-layout/service/collection.service';
import { CollectionVersion } from '../../../../../common-layout/model/piece.interface';
import { ProjectEnvironment } from '../../../../../common-layout/model/project-environment.interface';
import { RightSideBarType } from '../../../../../common-layout/model/enum/right-side-bar-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { FlowsActions } from '../../../../store/action/flows.action';
import { forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import { EnvironmentSelectors } from '../../../../../common-layout/store/selector/environment.selector';

@Component({
	selector: 'app-piece-version-sidebar',
	templateUrl: './collection-version-sidebar.component.html',
	styleUrls: ['./collection-version-sidebar.component.scss'],
})
export class CollectionVersionSidebarComponent implements OnInit {
	collectionVersionsList$: Observable<CollectionVersion[]>;
	publishedEnvironments$: Observable<Map<string, ProjectEnvironment[]>> = of(new Map<string, ProjectEnvironment[]>());

	constructor(
		public themeService: ThemeService,
		public timeHelperService: TimeHelperService,
		private store: Store,
		private pieceService: CollectionService
	) {}

	ngOnInit(): void {
		const selectedCollection$ = this.store.select(BuilderSelectors.selectCurrentCollection).pipe(take(1));
		const projectEnvironmentsList$ = this.store.select(EnvironmentSelectors.selectEnvironments).pipe(take(1));

		this.collectionVersionsList$ = selectedCollection$.pipe(
			switchMap(collection => {
				return this.pieceService.listVersions(collection.id).pipe(
					map(versions => {
						return versions.reverse();
					})
				);
			})
		);

		this.publishedEnvironments$ = forkJoin({
			selectedCollection: selectedCollection$,
			projectEnvironmentsList: projectEnvironmentsList$,
			collectionVersionsList: this.collectionVersionsList$,
		}).pipe(
			map(response => {
				const versions = response.collectionVersionsList;
				const publishedEnvironments = new Map<string, ProjectEnvironment[]>();
				versions.forEach(collectionVersion => {
					publishedEnvironments[collectionVersion.id.toString()] = [];
					response.projectEnvironmentsList.forEach(env => {
						let exists = false;
						env.deployedCollections.forEach(deployedCollection => {
							if (deployedCollection.collectionId === response.selectedCollection.id) {
								if (deployedCollection.collectionVersionsId.indexOf(collectionVersion.id) !== -1) {
									exists = true;
								}
							}
						});
						if (exists) {
							publishedEnvironments[collectionVersion.id.toString()].push(env);
						}
					});
				});
				return publishedEnvironments;
			})
		);
	}

	closeVersionSidebar() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.NONE,
				props: {},
			})
		);
	}

	get versionEditState() {
		return VersionEditState;
	}
}
