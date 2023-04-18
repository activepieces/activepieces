import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, startWith, Subject, tap } from 'rxjs';
import { FlowsTableDataSource } from './flows-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import { Flow, FlowInstanceStatus, FlowTableDto } from '@activepieces/shared';

import {
  ApPaginatorComponent,
  FlowInstanceService,
} from '@activepieces/ui/common';
import {
  ProjectService,
  FlowService,
  DEFAULT_PAGE_SIZE,
} from '@activepieces/ui/common';
import { ARE_THERE_FLOWS_FLAG } from '../../resolvers/are-there-flows.resolver';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';

@Component({
  templateUrl: './flows-table.component.html',
})
export class FlowsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  creatingFlow = false;
  archiveFlowDialogClosed$: Observable<void>;
  createFlow$: Observable<Flow>;
  dataSource!: FlowsTableDataSource;
  displayedColumns = ['name', 'created', 'status', 'action'];
  flowDeleted$: Subject<boolean> = new Subject();
  areThereFlows$: Observable<boolean>;
  flowsUpdateStatusRequest$: Record<string, Observable<void> | null> = {};
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialogService: MatDialog,
    private projectService: ProjectService,
    private flowService: FlowService,
    private instanceService: FlowInstanceService
  ) {}

  ngOnInit(): void {
    this.dataSource = new FlowsTableDataSource(
      this.activatedRoute.queryParams.pipe(
        map((res) => res['limit'] || DEFAULT_PAGE_SIZE)
      ),
      this.activatedRoute.queryParams.pipe(map((res) => res['cursor'])),
      this.paginator,
      this.projectService,
      this.flowService,
      this.flowDeleted$.asObservable().pipe(startWith(true))
    );
    this.areThereFlows$ = this.activatedRoute.data.pipe(
      map((res) => {
        return res[ARE_THERE_FLOWS_FLAG];
      })
    );
  }

  openBuilder(flow: Flow) {
    const link = '/flows/' + flow.id;
    this.router.navigate([link]);
  }

  deleteFlow(flow: Flow) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.flowService.delete(flow.id),
      entityName: flow.version.displayName,
    };
    const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.archiveFlowDialogClosed$ = dialogRef.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.flowDeleted$.next(true);
        }
      }),
      map(() => {
        return void 0;
      })
    );
  }

  createFlow() {
    if (!this.creatingFlow) {
      this.creatingFlow = true;
      this.createFlow$ = this.flowService
        .create({
          displayName: 'Untitled',
        })
        .pipe(
          tap((flow) => {
            this.router.navigate(['/flows/', flow.id], {
              queryParams: { newCollection: true },
            });
          })
        );
    }
  }
  toggleFlowStatus(flowDto: FlowTableDto, control: FormControl<boolean>) {
    if (control.enabled) {
      control.disable();
      debugger;
      this.flowsUpdateStatusRequest$[flowDto.id] = this.instanceService
        .updateStatus(flowDto.id, {
          status:
            flowDto.status === FlowInstanceStatus.ENABLED
              ? FlowInstanceStatus.DISABLED
              : FlowInstanceStatus.ENABLED,
        })
        .pipe(
          tap((res) => {
            control.enable();
            control.setValue(res.status === FlowInstanceStatus.ENABLED);
            this.flowsUpdateStatusRequest$[flowDto.id] = null;
            flowDto.status = res.status;
          }),
          map(() => void 0)
        );
    }
  }
}
