import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeekPage } from '../../../common-layout/service/seek-page';
import { Instance } from '../../../common-layout/model/instance.interface';
import { TimeHelperService } from '../../../common-layout/service/time-helper.service';
import { ThemeService } from '../../../common-layout/service/theme.service';
import { NavigationService } from '../../service/navigation.service';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDeleteModalComponent } from '../../../common-layout/components/confirm-delete-modal/confirm-delete-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { InstanceService } from '../../../common-layout/service/instance.service';
import { InstanceStatus } from '../../../common-layout/model/enum/instance-status';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
	selector: 'app-instances',
	templateUrl: './instances.component.html',
	styleUrls: ['./instances.component.scss'],
})
export class InstancesComponent implements OnInit {
	instancesPage: SeekPage<Instance>;
	accountId: string;
	hoverIndex: number = -1;
	faTrash = faTrash;
	bsModalRef: BsModalRef;

	constructor(
		private actRoute: ActivatedRoute,
		private instanceService: InstanceService,
		private navigationService: NavigationService,
		private modalService: BsModalService,
		public themeService: ThemeService,
		private router: Router,
		public timeHelperService: TimeHelperService,
		private snackbar: MatSnackBar
	) {}

	ngOnInit(): void {
		this.navigationService.setTitle('Instances');
		this.actRoute.data.subscribe(value => {
			this.instancesPage = value['instances'];
		});
	}

	viewRuns(instance: Instance, i: number) {
		this.actRoute.queryParams.subscribe(queryParams => {
			const newQ = JSON.parse(JSON.stringify(queryParams));
			newQ.instanceId = instance.id;
			this.router.navigate(['/runs'], { queryParams: newQ });
		});
	}

	delete(instance: Instance, i: number) {
		this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent);
		this.bsModalRef.content.entityName = instance.pieceDisplayName;
		const row = this.instancesPage.data[i];
		this.bsModalRef.content.confirmState.subscribe(value => {
			if (value) {
				this.instancesPage.data.splice(
					this.instancesPage.data.findIndex(f => f.id === row.id),
					1
				);
				this.instanceService.delete(instance.id).subscribe({
					next: () => {},
					error: (error: HttpErrorResponse) => {
						console.error(error);
						this.snackbar.open('Error occured during deleting instance, please check your console.', '', {
							duration: undefined,
							panelClass: 'error',
						});
					},
				});
			}
		});
	}

	get instanceStatus() {
		return InstanceStatus;
	}
}
