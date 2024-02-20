import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ap-dialog-title-template',
  templateUrl: './dialog-title-template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false,
})
export class DialogTitleTemplateComponent {}
