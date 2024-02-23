import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject, map } from 'rxjs';
import { startWith } from 'rxjs';
import {
  ApPaginatorComponent,
  featureDisabledTooltip,
} from '@activepieces/ui/common';
import { PlatformSettingsBaseComponent } from '../platform-settings-base.component';
import { AuditEventDataSource } from './audit-event-table.datasource';
import { AuditEventService } from '../../service/audit-event-service';
import {
  ApplicationEvent,
  ApplicationEventName,
  Platform,
  summarizeApplicationEvent,
} from '@activepieces/ee-shared';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-audit-event-table',
  templateUrl: './audit-event-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditEventTableComponent
  extends PlatformSettingsBaseComponent
  implements OnInit
{
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
  platform$?: BehaviorSubject<Platform>;
  isEnabled$!: Observable<boolean>;
  dataSource!: AuditEventDataSource;
  refresh$: Subject<boolean> = new Subject();
  dialogClosed$?: Observable<unknown>;
  featureDisabledTooltip = featureDisabledTooltip;

  constructor(
    private auditEventService: AuditEventService,
    private activatedRoute: ActivatedRoute
  ) {
    super();
  }
  ngOnInit(): void {
    if (this.platform) {
      this.platform$ = new BehaviorSubject(this.platform);
      console.log(this.platform);
      this.isEnabled$ = this.platform$.pipe(
        map((platform) => platform?.auditLogEnabled && !this.isDemo)
      );
    }
    this.dataSource = new AuditEventDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.auditEventService,
      this.paginator,
      this.isEnabled$,
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
    }
  }

  convertToDetails(event: ApplicationEvent) {
    return summarizeApplicationEvent(event);
  }
}
