'use client';

import React, { useState, useEffect } from 'react';
import { Customer, Order } from '@/types/customer';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Search, Edit2, Eye, X } from 'lucide-react';

export default function CRM() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const customersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setCustomerOrders(ordersData);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedCustomer?.id) {
        await updateDoc(doc(db, 'customers', selectedCustomer.id), {
          ...customerData,
          createdAt: selectedCustomer.createdAt
        });
      } else {
        await addDoc(collection(db, 'customers'), customerData);
      }

      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleView = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerOrders(customer.id!);
    setShowViewModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(customer);
    setShowAddModal(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <div className="h-screen-93 bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">Customer Management</h1>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setFormData({ name: '', email: '', phone: '', address: '' });
                setShowAddModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Customers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleView(customer)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedCustomer ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Customer Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-medium text-gray-700">Name</h3>
                <p>{selectedCustomer.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Phone</h3>
                <p>{selectedCustomer.phone}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Email</h3>
                <p>{selectedCustomer.email}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Address</h3>
                <p>{selectedCustomer.address}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-4">Order History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Items</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-left">Payment</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="px-4 py-2">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          {order.items.length} items
                        </td>
                        <td className="px-4 py-2 text-right">
                          ₹{order.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 capitalize">
                          {order.paymentMethod}
                        </td>
                        <td className="px-4 py-2 capitalize">
                          {order.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
