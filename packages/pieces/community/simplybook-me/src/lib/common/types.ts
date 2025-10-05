// SimplyBook.me API Types

export interface Booking {
  id: number;
  client_id: number;
  service_id: number;
  provider_id: number;
  start_datetime: string;
  end_datetime: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  client_id: number;
  booking_id?: number;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Offer {
  id: number;
  client_id: number;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  valid_until: string;
  created_at: string;
  updated_at?: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  active: boolean;
}

export interface Provider {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  active: boolean;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  category?: string;
  is_important: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Report {
  id: string;
  type: 'bookings' | 'revenue' | 'clients' | 'providers' | 'services';
  start_date: string;
  end_date: string;
  data: any;
  generated_at: string;
}

// API Request/Response Types
export interface ApiResponse<T = any> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number;
}

export interface CreateBookingParams {
  client_id: number;
  service_id: number;
  provider_id: number;
  start_datetime: string;
  end_datetime: string;
  status?: string;
  notes?: string;
}

export interface CreateClientParams {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  notes?: string;
}

export interface SearchBookingsParams {
  client_id?: number;
  provider_id?: number;
  service_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  limit?: number;
}

export interface SearchClientsParams {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  limit?: number;
}

export interface SearchInvoicesParams {
  client_id?: number;
  booking_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}
