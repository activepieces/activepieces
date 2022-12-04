import { UUID } from 'angular2-uuid';
import { AuthenticationType } from '../helper/authentication-type.enum';

export class ProjectAuthentication {
	environmentId: UUID;
	epochCreationTime: number;
	epochUpdateTime?: number;
	firebaseProjectId?: string;
	privateKey?: string;
	publicKey?: string;
	type: AuthenticationType;
	dateGeneratedText?: string;
	constructor(public environmentName?: string) {}
}
