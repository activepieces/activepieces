export type TeamworkAuth = {
  site_name: string;
  api_key: string;
  region: 'us' | 'eu';
};

export interface Company {
  id: string;
  name: string;
}

export interface Project {
    id: string;
    name: string;
}