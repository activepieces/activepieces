import { Project } from "shared";

export interface ProjectsState {
	loaded: boolean;
	selectedIndex: number;
	projects: Project[];
}
