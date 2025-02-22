export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gstin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id?: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  createdAt: string;
  status: 'completed' | 'cancelled';
}

export interface OrderItem {
  bookId: string;
  title: string;
  author: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}
