import { UserStatus } from './enum/user-status.enum';

export interface User {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	status: UserStatus;
	epochExpirationTime: number;
	epochCreationTime: number;
}
