import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-dialog-title-template',
	templateUrl: './dialog-title-template.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogTitleTemplateComponent {}
