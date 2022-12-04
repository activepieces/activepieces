import { ProjectEnvironment } from '../../model/project-environment.interface';

export interface EnvironmentsState {
	loaded: boolean;
	environments: ProjectEnvironment[];
}
