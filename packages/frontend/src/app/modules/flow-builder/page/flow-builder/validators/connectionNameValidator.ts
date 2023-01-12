import { AbstractControl } from '@angular/forms';

import { map, Observable } from 'rxjs';
import { AppConnection } from 'shared';

export class ConnectionValidator {
	static createValidator(allConnections$: Observable<AppConnection[]>, connectionToUpdateName: string | undefined) {
		return (control: AbstractControl) => {
			const currentKey = control.value;
			return allConnections$.pipe(
				map(configs => {
					const configKeyUsed = !!configs.find(c => c.name === currentKey && connectionToUpdateName !== c.name);
					if (configKeyUsed) {
						return { nameUsed: true };
					}
					return null;
				})
			);
		};
	}
}
