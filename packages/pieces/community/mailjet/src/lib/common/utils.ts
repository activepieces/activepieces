function pagingQuery({ limit, offset, sort }: PagingValues): {
	Limit?: number;
	Offset?: number;
	Sort?: string;
} {
	return { Limit: limit, Offset: offset, Sort: sort };
}

export const mailjetUtils = { pagingQuery };

type PagingValues = { limit?: number; offset?: number; sort?: string };
