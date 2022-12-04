import { ConfigType, DropdownType } from 'src/app/layout/common-layout/model/enum/config.enum';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import {
	DropdownSettings,
	DynamicDropdownSettings,
} from 'src/app/layout/common-layout/model/fields/variable/config-settings';

export function findRefreshedConfig(allConfigs: Config[], configToDelete: Config) {
	const refreshRefencesForEachConfig = allConfigs.map(c => {
		if (c.type === ConfigType.DROPDOWN && (c.settings as DropdownSettings).dropdownType === DropdownType.DYNAMIC) {
			return {
				refreshReferences: (c.settings as DynamicDropdownSettings).refreshReferences,
				key: c.key,
			};
		}
		return { refreshReferences: [], key: c.key };
	});
	const allRefreshReferences = refreshRefencesForEachConfig.map(r => r.refreshReferences).flat(1);
	const isConfigToDeleteInRefreshReferencesList = !!allRefreshReferences.find(r => r === configToDelete.key);
	if (isConfigToDeleteInRefreshReferencesList) {
		const refreshedConfig = refreshRefencesForEachConfig.find(
			r => !!r.refreshReferences.find(rf => rf === configToDelete.key)
		)!;
		return refreshedConfig;
	}
	return undefined;
}
