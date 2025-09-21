export interface Party {
  id: number;
  type: 'person' | 'organisation';
  firstName?: string;
  lastName?: string;
  name?: string; 
  // ... other fields can be added here as needed
}

export interface CreatePartyParams {
  type: 'person' | 'organisation';
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePartyParams {
  firstName?: string;
  lastName?: string;
  name?: string; 
  title?: string;
  about?: string;
  email?: string;
  phone?: string;
}