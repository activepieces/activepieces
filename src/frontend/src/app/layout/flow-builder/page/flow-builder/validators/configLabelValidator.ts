import { AbstractControl } from '@angular/forms';

import { map, Observable } from 'rxjs';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';

export class ConfigLabelValidator {
	static createValidator(allConfigs$: Observable<Config[]>, configToUpdateLabel: string | undefined) {
		return (control: AbstractControl) => {
			const currentLabel = control.value;
			return allConfigs$.pipe(
				map(configs => {
					const configLabelUsed = !!configs.find(
						c =>
							c.label.toLowerCase() === currentLabel.toLowerCase() &&
							configToUpdateLabel?.toLowerCase() !== c?.label.toLowerCase()
					);
					if (configLabelUsed) {
						return { labelUsed: true };
					}
					return null;
				})
			);
		};
	}
}
