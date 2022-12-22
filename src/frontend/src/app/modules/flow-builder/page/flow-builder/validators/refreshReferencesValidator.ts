import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { Config } from 'src/app/modules/common/model/fields/variable/config';
import { DynamicDropdownSettings } from 'src/app/modules/common/model/fields/variable/config-settings';

export class RefreshReferencesValidator {
	static createValidator(
		allConfigs$: Observable<Config[]>,
		currentConfig: Partial<Config> | undefined
	): AsyncValidatorFn {
		return (control: AbstractControl) => {
			return allConfigs$.pipe(
				map(allConfigs => {
					return JSON.parse(JSON.stringify(allConfigs));
				}),
				map((allConfigs: Partial<Config>[]) => {
					const controlValue: string[] = control.value;
					const refreshReferences = controlValue.map(o => {
						return allConfigs.find(c => c.key === o)!;
					});
					allConfigs = RefreshReferencesValidator.replaceCurrentConfigInAllConfigsListToSetNewRefreshReferences(
						currentConfig,
						allConfigs,
						controlValue
					);
					const configKeyWhichCreatesCycle = RefreshReferencesValidator.validateReferences(
						refreshReferences,
						allConfigs
					);

					if (configKeyWhichCreatesCycle) {
						console.warn('cycle detected');
						return {
							cycle: `This dropdown can't depend on ${configKeyWhichCreatesCycle} as ${configKeyWhichCreatesCycle} depends on this dropdown too.`,
						};
					}
					return null;
				})
			);
		};
	}

	private static replaceCurrentConfigInAllConfigsListToSetNewRefreshReferences(
		currentConfig: Partial<Config> | undefined,
		allConfigs: Partial<Config>[],
		controlValue: string[]
	) {
		if (!currentConfig) {
			const currentConfigReplacement = {
				key: '!@#$',
				label: '!@#$',
				settings: { refreshReferences: controlValue } as DynamicDropdownSettings,
			};
			allConfigs.push(currentConfigReplacement);
		} else {
			const currentConfigReplacement = { ...currentConfig };
			currentConfigReplacement.settings = { refreshReferences: controlValue } as DynamicDropdownSettings;
			allConfigs = allConfigs.filter(c => c.key !== currentConfig.key);
			allConfigs.push(currentConfigReplacement);
		}
		return allConfigs;
	}
	private static validateReferences(refreshReferences: Partial<Config>[], allConfigs: Partial<Config>[]) {
		let configKeyWhichCreatesCycle: string | null = null;
		refreshReferences.forEach(c => {
			if (!configKeyWhichCreatesCycle) {
				const visitedNodesMap = new Map<string, boolean>();
				configKeyWhichCreatesCycle = RefreshReferencesValidator.detectCycle(c, visitedNodesMap, allConfigs);
			}
		});
		return configKeyWhichCreatesCycle;
	}
	private static detectCycle(
		config: Partial<Config>,
		visitedConfigsMap: Map<string, boolean>,
		allConfigs: Partial<Config>[]
	) {
		if (visitedConfigsMap.get(config.key!)) {
			return config.key!;
		}
		visitedConfigsMap.set(config.key!, true);
		const configSettings = config.settings as DynamicDropdownSettings;
		let configKeyWhichCreatesCycle: null | string = null;
		if (configSettings.refreshReferences) {
			configSettings.refreshReferences
				.map(r => allConfigs.find(c => c.key === r)!)
				.forEach(c => {
					if (!configKeyWhichCreatesCycle) {
						configKeyWhichCreatesCycle = this.detectCycle(c, visitedConfigsMap, allConfigs);
					}
				});
		}
		visitedConfigsMap.set(config.key!, false);
		return configKeyWhichCreatesCycle;
	}
}
