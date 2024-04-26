import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { startWith } from 'rxjs';
import { ApPaginatorComponent } from '@activepieces/ui/common';
import { AuditEventDataSource } from './audit-event-table.datasource';
import { AuditEventService } from '../../service/audit-event-service';
import {
  ApplicationEvent,
  ApplicationEventName,
  summarizeApplicationEvent,
} from '@activepieces/ee-shared';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-audit-event-table',
  templateUrl: './audit-event-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditEventTableComponent implements OnInit {
  @Input({ required: true }) featureLocked!: boolean;
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  displayedColumns = [
    'resource',
    'details',
    'userEmail',
    'action',
    'projectDisplayName',
    'created',
  ];
  dataSource!: AuditEventDataSource;
  refresh$: Subject<boolean> = new Subject();
  dialogClosed$?: Observable<unknown>;
  upgradeNoteTitle = $localize`Unlock Audit Logs`;
  upgradeNote = $localize`Comply with internal and external security policies by tracking activities done within your account`;
  constructor(
    private auditEventService: AuditEventService,
    private activatedRoute: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.dataSource = new AuditEventDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.auditEventService,
      this.paginator,
      this.activatedRoute.queryParams
    );
  }

  convertToReadableString(input: string): string {
    return input
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  convertToIcon(event: ApplicationEvent) {
    switch (event.action) {
      case ApplicationEventName.CREATED_FLOW:
      case ApplicationEventName.DELETED_FLOW:
      case ApplicationEventName.CREATED_FOLDER:
      case ApplicationEventName.UPDATED_FLOW:
        return {
          icon: 'assets/img/custom/dashboard/flows.svg',
          tooltip: 'Flow',
        };
      case ApplicationEventName.UPDATED_FOLDER:
      case ApplicationEventName.DELETED_FOLDER:
        return {
          icon: 'assets/img/custom/folder.svg',
          tooltip: 'Folder',
        };
      case ApplicationEventName.UPSERTED_CONNECTION:
      case ApplicationEventName.DELETED_CONNECTION:
        return {
          icon: 'assets/img/custom/dashboard/connections.svg',
          tooltip: 'Connection',
        };
      case ApplicationEventName.SIGNED_UP_USING_EMAIL:
      case ApplicationEventName.SIGNED_UP_USING_MANAGED_AUTH:
      case ApplicationEventName.SIGNED_UP_USING_SSO:
      case ApplicationEventName.SIGNED_IN:
      case ApplicationEventName.RESET_PASSWORD:
      case ApplicationEventName.VERIFIED_EMAIL:
        return {
          icon: 'assets/img/custom/dashboard/users.svg',
          tooltip: 'User',
        };
      case ApplicationEventName.CREATED_SIGNING_KEY:
        return {
          icon: 'assets/img/custom/signing-key.svg',
          tooltip: 'Signing Key',
        };
    }
  }

  convertToDetails(event: ApplicationEvent) {
    return summarizeApplicationEvent(event);
  }
}
