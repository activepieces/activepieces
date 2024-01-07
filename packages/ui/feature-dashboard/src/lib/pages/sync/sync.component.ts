import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-sync',
  templateUrl: './sync.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncComponent {}
