import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'ap-generic-snackbar-template',
  templateUrl: './generic-snackbar-template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericSnackbarTemplateComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: string) {}
}
