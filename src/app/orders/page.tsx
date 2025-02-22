/** @jsxImportSource react */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bill } from '@/types/bill';
import { StoreSettings } from '@/types/store';
import { format, startOfDay, endOfDay, parse } from 'date-fns';
import { Search, Printer, Eye, X } from 'lucide-react';
import Invoice from '@/components/invoice';
import toast, { Toaster } from 'react-hot-toast';

export default function Orders() {
  const [orders, setOrders] = useState<Bill[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
    fetchStoreSettings();
  }, [startDate, endDate]);

  const fetchStoreSettings = async () => {
    try {
      const storeDoc = await getDoc(doc(db, 'settings', 'store'));
      if (storeDoc.exists()) {
        setStoreSettings(storeDoc.data() as StoreSettings);
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
      toast.error('Failed to fetch store settings');
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const start = startOfDay(parse(startDate, 'yyyy-MM-dd', new Date()));
      const end = endOfDay(parse(endDate, 'yyyy-MM-dd', new Date()));

      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', start.toISOString()),
        where('createdAt', '<=', end.toISOString()),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bill[];
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = (bill: Bill) => {
    setSelectedBill(bill);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setShowBillModal(true);
  };

  const filteredOrders = orders.filter(order => 
    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerPhone?.includes(searchQuery) ||
    order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.invoiceNumber?.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen print:p-0 print:bg-white">
      <Toaster />
      
      {/* Print Section - Hidden until printing */}
      <div className="hidden print:block">
        {selectedBill && <Invoice bill={selectedBill} storeSettings={storeSettings} />}
      </div>

      {/* Bill View Modal */}
      {showBillModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">View Bill</h2>
              <button
                onClick={() => setShowBillModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <Invoice bill={selectedBill} storeSettings={storeSettings} />
            </div>
            <div className="p-4 border-t flex justify-end gap-4">
              <button
                onClick={() => handlePrint(selectedBill)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => setShowBillModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Hidden during printing */}
      <div className="print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">Orders</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by invoice no, customer name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{order.customerName}</div>
                          {order.customerPhone && (
                            <div className="text-xs text-gray-400">{order.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.items.length} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₹{order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewBill(order)}
                              className="text-gray-600 hover:text-gray-900"
                              title="View Bill"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handlePrint(order)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Print Bill"
                            >
                              <Printer className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
