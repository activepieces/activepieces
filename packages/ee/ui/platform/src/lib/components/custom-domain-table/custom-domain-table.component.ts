import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CustomDomainDataSource } from './custom-domain-table.datasource';
import { Observable, Subject, switchMap, tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { startWith } from 'rxjs';
import { CustomDomain } from '@activepieces/ee-shared';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';
import {
  CustomDomainService,
  HostnameDetailsResponse,
} from '../../service/custom-domain.service';
import { CreateCustomDomainDialogComponent } from '../dialogs/create-custom-domain-dialog/create-custom-domain-dialog.component';
import { DomainTxtValidationDialogComponent } from '../dialogs/domain-txt-validation-dialog/domain-txt-validation-dialog.component';

@Component({
  selector: 'app-custom-domain-table',
  templateUrl: './custom-domain-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomDomainTableComponent implements OnInit {
  displayedColumns = ['domain', 'status', 'created', 'action'];
  dataSource!: CustomDomainDataSource;
  refresh$: Subject<boolean> = new Subject();
  dialogClosed$?: Observable<unknown>;
  validationData$?: Observable<HostnameDetailsResponse>;
  upgradeNoteTitle = $localize`Unlock Custom Domain`;
  upgradeNote = $localize`Customize your domain to match your brand and provide a seamless experience for your users.`;
  constructor(
    private matDialog: MatDialog,
    private customDomainService: CustomDomainService
  ) {}
  ngOnInit(): void {
    this.dataSource = new CustomDomainDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.customDomainService
    );
  }
  createKey() {
    const dialog = this.matDialog.open(CreateCustomDomainDialogComponent, {
      disableClose: true,
    });
    this.dialogClosed$ = dialog.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }

  verifyDomain(key: CustomDomain) {
    this.validationData$ = this.customDomainService.validationData(key.id).pipe(
      switchMap(({ txtName, txtValue, hostname }) => {
        return this.matDialog
          .open(DomainTxtValidationDialogComponent, {
            disableClose: true,
            data: {
              domainId: key.id,
              cloudflareHostnameData: {
                txtName,
                txtValue,
                hostname,
              },
            },
          })
          .afterClosed()
          .pipe(
            tap((refresh) => {
              if (refresh) {
                this.refresh$.next(true);
              }
            })
          );
      })
    );
  }

  deleteCustomDomain(key: CustomDomain) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.customDomainService.delete(key.id).pipe(
        tap(() => {
          this.refresh$.next(true);
        })
      ),
      entityName: key.domain,
      note: $localize`This will delete the custom domain; make sure you understand the consequences.`,
    };
    const dialog = this.matDialog.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.dialogClosed$ = dialog.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }
}
