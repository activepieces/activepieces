export interface promptResponse {
  choices: {
    text: string;
  }[];
  model: string;
  id: string;
}

export interface openRouterModels {
  data: {
    id: string;
  }[];
}
