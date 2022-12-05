import { UserStatus } from './enum/user-status.enum';

export interface User {
	id: string;
	firstName: string;
	company: string;
	lastName: string;
	email: string;
	status: UserStatus;
	epochExpirationTime: number;
	epochCreationTime: number;
}
