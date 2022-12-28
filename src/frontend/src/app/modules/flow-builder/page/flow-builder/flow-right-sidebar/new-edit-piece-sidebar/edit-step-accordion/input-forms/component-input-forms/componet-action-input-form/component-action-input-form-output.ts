type CustomRequestOutput = {
	body: { [key: string]: any };
	parameters: { [key: string]: any };
	headers: { [key: string]: any };
	endpoint: string;
	security: string;
};

type ActionRequestOutput = {
	optionalConfigs: { [key: string]: any };
	requiredConfigs: { [key: string]: any };
	security: string;
};

export type ComponentFormOutput = CustomRequestOutput | ActionRequestOutput;
