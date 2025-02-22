import { Book } from './book';

export interface BillItem {
  id: string;
  book: Book;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Bill {
  id?: string;
  invoiceNumber: number;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod: 'cash' | 'card' | 'upi';
  status: 'completed' | 'cancelled';
  createdBy: {
    id: string;
    name: string;
  };
}
