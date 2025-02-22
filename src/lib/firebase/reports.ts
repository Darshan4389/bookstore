import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

const getDateRangeQuery = (startDate?: Date, endDate?: Date, dateField: string = 'date') => {
  if (!startDate || !endDate) return [];
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return [
    where(dateField, '>=', Timestamp.fromDate(start)),
    where(dateField, '<=', Timestamp.fromDate(end))
  ];
};

export const fetchCustomerReport = async (startDate?: Date, endDate?: Date) => {
  try {
    const ordersRef = collection(db, 'orders');
    let q;
    
    if (startDate && endDate) {
      q = query(ordersRef, ...getDateRangeQuery(startDate, endDate, 'createdAt'));
    } else {
      q = query(ordersRef);
    }
    
    console.log('Fetching customer report with dates:', { 
      startDate: startDate?.toISOString(), 
      endDate: endDate?.toISOString() 
    });
    
    const querySnapshot = await getDocs(q);
    console.log('Found orders:', querySnapshot.size);
    
    const customerMap = new Map();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('Processing order:', doc.id, {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        createdAt: data.createdAt?.toDate()?.toISOString()
      });
      
      if (!data.customerEmail) {
        console.log('Order missing customer email:', doc.id);
        return;
      }
      
      if (!customerMap.has(data.customerEmail)) {
        customerMap.set(data.customerEmail, {
          customerName: data.customerName || 'N/A',
          email: data.customerEmail,
          phone: data.phone || 'N/A',
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: data.createdAt?.toDate() || new Date()
        });
      }
      
      const customer = customerMap.get(data.customerEmail);
      customer.totalOrders += 1;
      customer.totalSpent += data.totalAmount || 0;
      
      const orderDate = data.createdAt?.toDate();
      if (orderDate && orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
    });
    
    const result = Array.from(customerMap.values()).map(customer => ({
      ...customer,
      lastOrderDate: format(customer.lastOrderDate, 'yyyy-MM-dd'),
      totalSpent: Number(customer.totalSpent.toFixed(2))
    }));
    
    console.log('Processed customers:', result.length);
    return result;
  } catch (error) {
    console.error('Error fetching customer report:', error);
    return [];
  }
};

export const fetchSalesSummary = async (startDate?: Date, endDate?: Date) => {
  console.log('Fetching sales summary with dates:')
  try {
    const ordersRef = collection(db, 'orders');
    let q;
    
    if (startDate && endDate) {
      q = query(ordersRef, ...getDateRangeQuery(startDate, endDate, 'createdAt'));
    } else {
      q = query(ordersRef);
    }
    
    const querySnapshot = await getDocs(q);
    console.log("Query snapshot:", querySnapshot);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log("Data:", data);
      return {
        date: data.createdAt ? format(data.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
        invoiceNumber: doc.id,
        customerName: data.customerName || 'N/A',
        totalAmount: data.totalAmount || 0,
        paymentStatus: data.paymentStatus || 'N/A',
        paymentMethod: data.paymentMethod || 'N/A'
      };
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return [];
  }
};

export const fetchInvoiceReport = async (startDate?: Date, endDate?: Date) => {
  try {
    const ordersRef = collection(db, 'orders');
    let q;
    
    if (startDate && endDate) {
      q = query(ordersRef, ...getDateRangeQuery(startDate, endDate, 'createdAt'));
    } else {
      q = query(ordersRef);
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        invoiceNumber: doc.id,
        date: data.createdAt ? format(data.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
        customerName: data.customerName || 'N/A',
        items: data.items?.length || 0,
        totalAmount: data.totalAmount || 0,
        paymentStatus: data.paymentStatus || 'N/A',
        paymentMethod: data.paymentMethod || 'N/A'
      };
    });
  } catch (error) {
    console.error('Error fetching invoice report:', error);
    return [];
  }
};

export const fetchInventoryReport = async (startDate?: Date, endDate?: Date) => {
  try {
    const booksRef = collection(db, 'books');
    const querySnapshot = await getDocs(booksRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        bookId: doc.id,
        title: data.title || 'N/A',
        author: data.author || 'N/A',
        category: data.category || 'N/A',
        currentStock: data.currentStock || 0,
        reorderPoint: data.reorderPoint || 5,
        lastRestockDate: data.lastRestockDate ? format(data.lastRestockDate.toDate(), 'yyyy-MM-dd') : 'N/A',
        price: data.price || 0
      };
    });
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    return [];
  }
};
