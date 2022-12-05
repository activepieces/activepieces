import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { PopoverDirective } from 'ngx-bootstrap/popover';
import { forkJoin, map, Observable, take, tap } from 'rxjs';
import { Flow } from 'src/app/layout/common-layout/model/flow.class';
import { Collection } from 'src/app/layout/common-layout/model/piece.interface';
import { ProjectService } from 'src/app/layout/common-layout/service/project.service';
import { PieceAction } from 'src/app/layout/flow-builder/store/action/piece.action';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';

@Component({
	selector: 'app-embed-modal',
	templateUrl: './embed-modal.component.html',
	styleUrls: ['./embed-modal.component.scss'],
})
export class EmbedModalComponent implements OnInit {
	@ViewChild(PopoverDirective) embeddedPopover: PopoverDirective;
	published$: Observable<{
		environmentIds: UUID[];
		collection: Collection;
	}>;
	htmlEditorOptions = {
		lineWrapping: false,
		lineNumbers: true,
		theme: 'lucario',
		readOnly: 'nocursor',
		mode: 'htmlmixed',
		autoRefresh: true,
	};

	codeEditorOptions = {
		lineWrapping: true,
		lineNumbers: true,
		theme: 'lucario',
		readOnly: 'nocursor',
		mode: 'javascript',
		autoRefresh: true,
	};

	embedMarketplaceCode = `activepieces.insertMarketplaceWidget({
    containerId: "CONTAINER_ID"
});
`;

	openIntegrationModalCode = `activepieces.configureIntegration({
     collectionId: "COLLECTION_ID",
});
`;

	disableIntegrationModalCode = `activepieces.disableIntegration({
  collectionId: "COLLECTION_ID",
});`;

	installationSnippet = `<script type="text/javascript">
loadActualActivepiecesSdk();var loadSdkPromise;function loadActualActivepiecesSdk(){loadSdkPromise=new Promise((resolve,reject)=>{const scriptTag=document.createElement("script");scriptTag.src="https://cdn.activepieces.com/embedded/v1/activepieces-sdk.js";scriptTag.onload=()=>{setActivepiecesInWindow();resolve()};scriptTag.onerror=(err)=>{reject(err)};scriptTag.async=true;document.head.append(scriptTag)})}function setActivepiecesInWindow(){const apSdk=document.createElement("activepieces-sdk");document.body.append(apSdk);window.activepieces=apSdk}activepieces={};const methodNames=["init","configureIntegration","listIntegrations","disableIntegration","getProject","isIntegrationEnabled","insertCollectionWidget","insertMarketplaceWidget","sendEvent","runFlow","on",];for(const method of methodNames){activepieces[method]=(...args)=>{return new Promise((resolve,reject)=>{loadSdkPromise.then(()=>{window.activepieces[method](...args).then((val)=>resolve(val),(err)=>reject(err))},(err)=>reject(err))})}}

activepieces.init({
  projectId: "PROJECT_ID",
  environment: "ENVIRONMENT_NAME",
  token: "AUTH_TOKEN",
});
</script>
`;
	flows$: Observable<Flow[]>;
	modalRef?: BsModalRef;
	mainIds$: Observable<{ projectId: UUID; collectionId: UUID }>;
	constructor(
		private actions$: Actions,
		private modalService: BsModalService,
		private projectService: ProjectService,
		private store: Store,
		private snackbar: MatSnackBar
	) {}
	ngOnInit(): void {
		this.published$ = this.actions$.pipe(
			ofType(PieceAction.publishCollectionSuccess),
			tap(({ collection }) => {
				if (collection.versionsList.length == 1) {
					this.embeddedPopover.show();
				}
			})
		);
		this.mainIds$ = forkJoin({
			project: this.projectService.selectedProjectAndTakeOne(),
			collectionId: this.store.select(BuilderSelectors.selectCurrentCollectionId).pipe(take(1)),
		}).pipe(
			tap(res => {
				this.installationSnippet = this.installationSnippet.replace('PROJECT_ID', res.project.id);
				this.openIntegrationModalCode = this.openIntegrationModalCode.replace(
					'COLLECTION_ID',
					res.collectionId.toString()
				);
				this.disableIntegrationModalCode = this.openIntegrationModalCode.replace(
					'COLLECTION_ID',
					res.collectionId.toString()
				);
			}),
			map(res => {
				return { projectId: res.project.id, collectionId: res.collectionId };
			})
		);
		this.flows$ = this.store.select(BuilderSelectors.selectFlows);
	}
	openModal(modalRef: TemplateRef<any>) {
		this.modalRef = this.modalService.show(modalRef, { class: 'modal-dialog-centered' });
	}
	hideEmbedPopover() {
		this.embeddedPopover.hide();
	}
	close() {
		this.modalRef?.hide();
	}
	copyId(id: UUID) {
		navigator.clipboard.writeText(id.toString());
		this.snackbar.open('ID copied to clipboard');
	}
	copyCode(code: string) {
		navigator.clipboard.writeText(code);
		this.snackbar.open('Code copied to clipboard');
	}
}
