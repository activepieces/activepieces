import { Component, OnInit } from '@angular/core';
import { SeekPage } from '../../../common/model/seek-page';
import { Collection } from '../../../common/model/collection.interface';
import { TimeHelperService } from '../../../common/service/time-helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { faArchive } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDeleteModalComponent } from '../../../common/components/confirm-delete-modal/confirm-delete-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CollectionService } from '../../../common/service/collection.service';
import { NavigationService } from '../../service/navigation.service';
import { AuthenticationService } from '../../../common/service/authentication.service';
import { ProjectService } from 'src/app/modules/common/service/project.service';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { FlowService } from 'src/app/modules/common/service/flow.service';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Flow } from 'src/app/modules/common/model/flow.class';
import { PosthogService } from 'src/app/modules/common/service/posthog.service';

@Component({
	selector: 'app-flows-group',
	templateUrl: './collection-components.component.html',
	styleUrls: ['./collection-components.component.scss'],
})
export class CollectionComponent implements OnInit {
	faArchive = faArchive;

	collectionsPage: SeekPage<Collection>;
	hoverIndex: number = -1;
	bsModalRef: BsModalRef;
	creatingCollection = false;
	getCollections$: Observable<SeekPage<Collection>>;
	archiveCollection$: Observable<void>;
	createCollection$: Observable<Flow>;

	constructor(
		public timeHelperService: TimeHelperService,
		private actRoute: ActivatedRoute,
		private titleService: NavigationService,
		private router: Router,
		private authenticationService: AuthenticationService,
		private collectionService: CollectionService,
		private modalService: BsModalService,
		private projectService: ProjectService,
		private flowService: FlowService,
		private snackBar: MatSnackBar,
		private posthogService: PosthogService
	) {}

	ngOnInit(): void {
		this.titleService.setTitle('Collections');
		this.getCollections$ = this.actRoute.data.pipe(
			map(data => {
				return data['collections'];
			}),
			tap(col => {
				this.collectionsPage = col;
			})
		);
	}

	openBuilder(integration: Collection) {
		const link = '/flows/' + integration.id;
		this.router.navigate([link]);
	}

	deleteCollection(collection: Collection, i: number) {
		this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent, {
			initialState: {
				archive: true,
				entityName: collection.last_version.display_name,
			},
		});

		this.archiveCollection$ = this.bsModalRef.content.confirmState.pipe(
			tap(confirmed => {
				if (confirmed) {
					this.collectionsPage.data.splice(i, 1);
					this.bsModalRef.hide();
				}
			}),
			switchMap(confirmed => {
				if (confirmed) {
					return this.collectionService.archive(collection.id);
				}
				return of(null);
			}),
			catchError(err => {
				this.snackBar.open('An error occured while archiving, please check your console', '', {
					duration: undefined,
					panelClass: 'error',
				});
				console.error(err);
				return of(err);
			}),
			tap(result => {
				if (!result) {
					this.snackBar.open(`${collection.last_version.display_name} was archived successfully`);
				}
			})
		);
	}

	get currentUser() {
		return this.authenticationService.currentUser;
	}

	createCollection() {
		if (!this.creatingCollection) {
			this.creatingCollection = true;
			const collectionDiplayName = 'Untitled';
			this.createCollection$ = this.projectService.selectedProjectAndTakeOne().pipe(
				switchMap(project => {
					return this.collectionService.create(project.id, {
						display_name: collectionDiplayName,
					});
				}),
				switchMap(collection => {
					if (this.authenticationService.currentUserSubject.value?.track_events) {
						this.posthogService.captureEvent('collection.created [Builder]', collection);
					}
					return this.flowService.create(collection.id, 'Flow 1');
				}),
				tap(flow => {
					if (this.authenticationService.currentUserSubject.value?.track_events) {
						this.posthogService.captureEvent('flow.created [Builder]', flow);
					}
					this.router.navigate(['/flows/', flow.collection_id], { queryParams: { newCollection: true } });
				})
			);
		}
	}
}
