const API_BASE = 'https://mintprints-api.ronny.works';

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  return response.json();
}

export interface Quote {
  id: number;
  quote_number: string;
  customer_id: number | null;
  customer_name: string | null;
  status: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  discount: string;
  total: string;
  internal_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  line_items?: QuoteLineItem[];
}

export interface QuoteLineItem {
  id: number;
  quote_id: number;
  description: string;
  style_number: string | null;
  color: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface CreateQuoteData {
  customer_id?: number;
  internal_notes?: string;
  customer_notes?: string;
  valid_days?: number;
}

export interface CreateLineItemData {
  description: string;
  quantity: number;
  unit_price: number;
  style_number?: string;
  color?: string;
}

// Fetch all quotes
export async function fetchQuotes(): Promise<Quote[]> {
  const res = await fetch(`${API_BASE}/api/v2/quotes`);
  const data = await handleResponse<{ quotes: Quote[] }>(res);
  return data.quotes || [];
}

// Fetch single quote with line items
export async function fetchQuote(id: number): Promise<Quote> {
  const res = await fetch(`${API_BASE}/api/v2/quotes/${id}`);
  const data = await handleResponse<{ quote: Quote }>(res);
  return data.quote;
}

// Create new quote
export async function createQuote(data: CreateQuoteData): Promise<Quote> {
  const res = await fetch(`${API_BASE}/api/v2/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ quote: Quote }>(res);
  return result.quote;
}

// Update quote
export async function updateQuote(id: number, data: Partial<CreateQuoteData>): Promise<Quote> {
  const res = await fetch(`${API_BASE}/api/v2/quotes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ quote: Quote }>(res);
  return result.quote;
}

// Add line item
export async function addLineItem(quoteId: number, data: CreateLineItemData): Promise<QuoteLineItem> {
  const res = await fetch(`${API_BASE}/api/v2/quotes/${quoteId}/line-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ lineItem: QuoteLineItem }>(res);
  return result.lineItem;
}

// Convert to order
export async function convertToOrder(quoteId: number): Promise<{ order_id: number; visual_id: string }> {
  const res = await fetch(`${API_BASE}/api/v2/quotes/${quoteId}/convert`, {
    method: 'POST',
  });
  return handleResponse<{ order_id: number; visual_id: string }>(res);
}
