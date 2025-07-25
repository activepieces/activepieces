export interface ListProjectsResponse {
  status: string;
  message: string;
  data: {
    projects: Array<{ id: number; name: string }>;
  };
}

export interface CreateScreenshotResponse {
  status: string;
  message: string;
  data: {
    url: string;
    requestId: number;
  };
}

export interface GetScreenshotResponse {
  status: string;
  message: string;
  data: {
    url: string;
    id: number;
    status:string
  };
}

