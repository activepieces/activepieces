import { Component, OnInit } from '@angular/core';
import { SeekPage } from '../../../common-layout/service/seek-page';
import { Collection } from '../../../common-layout/model/collection.interface';
import { TimeHelperService } from '../../../common-layout/service/time-helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { faArchive } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDeleteModalComponent } from '../../../common-layout/components/confirm-delete-modal/confirm-delete-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CollectionService } from '../../../common-layout/service/collection.service';
import { NavigationService } from '../../service/navigation.service';
import { AuthenticationService } from '../../../common-layout/service/authentication.service';
import { ProjectService } from 'src/app/layout/common-layout/service/project.service';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { FlowService } from 'src/app/layout/common-layout/service/flow.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Flow } from 'src/app/layout/common-layout/model/flow.class';

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
		private snackBar: MatSnackBar
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
					return this.flowService.create(collection.id, 'Flow 1');
				}),
				tap(flow => {
					this.router.navigate(['/flows/', flow.collection_id], { queryParams: { newCollection: true } });
				})
			);
		}
	}
}
