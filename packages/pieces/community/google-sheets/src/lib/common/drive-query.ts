function escapeLiteral(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export const driveQuery = { escapeLiteral };
