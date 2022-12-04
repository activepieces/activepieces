import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DocumentationInfoControl } from '../../../../model/dynamic-controls/documentation-info-control';

@Component({
	selector: 'app-documentation-link',
	templateUrl: './documentation-link.component.html',
	styleUrls: ['./documentation-link.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentationLinkComponent {
	@Input() dynamicControl: DocumentationInfoControl;

	constructor() {}
}
