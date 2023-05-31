import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-templates-container',
  templateUrl: './templates-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesContainerComponent {}
