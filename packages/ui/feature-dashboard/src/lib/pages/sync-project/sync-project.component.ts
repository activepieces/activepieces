import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SyncProjectDataSource } from './sync-project.datasource';
import { SyncProjectService } from '../../services/sync-project.service';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-sync-project',
  templateUrl: './sync-project.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncProjectComponent {
  displayedColumns = ['remoteUrl', 'branch', 'updated', 'action'];
  dataSource: SyncProjectDataSource;
  constructor(
    private syncProjectService: SyncProjectService,
    private store: Store
  ) {
    this.dataSource = new SyncProjectDataSource(
      this.syncProjectService,
      this.store
    );
  }
}
