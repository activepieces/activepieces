import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'ap-templates-dialog',
  templateUrl: './templates-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesDialogComponent {
  searchFormControl = new FormControl<string>('');
  filters = ['ChatGPT', 'Content', 'RSS', 'Sales Funnel', 'Notifications'];
}
