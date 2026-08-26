export type TallyForm = {
	id: string;
	name: string;
	status: string;
};

export type TallyFormsResponse = {
	items: TallyForm[];
	hasMore: boolean;
	page: number;
};

export type TallyWebhookResponse = { id: string };

export type TallyQuestionOption = { id: string; text: string };

export type TallyQuestionField = { uuid: string; title: string; questionType: string };

export type TallyQuestion = {
	id: string;
	type: string;
	title: string;
	fields?: TallyQuestionField[];
};

export type TallySubmissionResponse = {
	id: string;
	formId: string;
	respondentId: string;
	isCompleted: boolean;
	submittedAt: string;
	responses: {
		questionId: string;
		answer: unknown;
	}[];
};

export type TallySubmissionsApiResponse = {
	questions: TallyQuestion[];
	submissions: TallySubmissionResponse[];
};

export type TallyField = {
	key: string;
	label: string;
	type: string;
	value: unknown;
	options?: TallyQuestionOption[];
	rows?: TallyQuestionOption[];
	columns?: TallyQuestionOption[];
};

export type TallyWebhookPayload = {
	eventId: string;
	eventType: string;
	createdAt: string;
	data: {
		responseId: string;
		submissionId: string;
		respondentId: string;
		formId: string;
		formName: string;
		createdAt: string;
		fields: TallyField[];
	};
};

export type TallyPaginated<T> = {
	items?: T[];
	page: number;
	limit?: number;
	total?: number;
	hasMore: boolean;
};

export type TallyUser = {
	id: string;
	email: string;
	name?: string;
	role?: string;
	workspaces?: { id: string; name: string; role?: string }[];
};

export type TallyWorkspace = {
	id: string;
	name: string;
	slug?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type TallyFolder = {
	id: string;
	workspaceId: string;
	name: string;
	parentId?: string | null;
	createdAt?: string;
	updatedAt?: string;
};

export type TallyWebhook = {
	id: string;
	formId: string;
	url: string;
	eventTypes: string[];
	isEnabled?: boolean;
	createdAt?: string;
	updatedAt?: string;
};

export type TallyWebhookEvent = {
	id: string;
	webhookId: string;
	eventType: string;
	status: string;
	statusCode?: number;
	attemptCount?: number;
	createdAt: string;
};
