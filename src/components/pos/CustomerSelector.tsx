import React, { useState, useEffect } from 'react';
import { Customer } from '@/types/customer';
import { collection, getDocs, query, where, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface CustomerSelectorProps {
  onSelect: (customer: Customer | null) => void;
  onClose: () => void;
}

export default function CustomerSelector({ onSelect, onClose }: CustomerSelectorProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: 'guest',
    phone: '',
    email: '',
    gstin: ''
  });
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [isSaving, setIsSaving] = useState(false); // Add saving state

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (phoneNumber.length >= 3) {
      const filtered = customers.filter(customer =>
        customer.phone.includes(phoneNumber)
      );
      setFilteredCustomers(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [phoneNumber, customers]);

  const fetchCustomers = async () => {
    setIsLoading(true); // Set loading state to true
    try {
      const q = query(
        collection(db, 'customers'),
        orderBy('phone'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);
      const customersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false); // Set loading state to false
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    setNewCustomer(prev => ({
      ...prev,
      phone: value
    }));
  };

  const handleCustomerSelect = (customer: Customer) => {
    setPhoneNumber(customer.phone);
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      gstin: customer.gstin
    });
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    setIsSaving(true); // Set saving state to true
    try {
      // If it's a new customer, add to database
      if (!customers.find(c => c.phone === phoneNumber)) {
        const customerData = {
          ...newCustomer,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'customers'), customerData);
        const newCustomerWithId = { id: docRef.id, ...customerData } as Customer;
        onSelect(newCustomerWithId);
      } else {
        // Existing customer
        const customer = customers.find(c => c.phone === phoneNumber);
        onSelect(customer || null);
      }
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setIsSaving(false); // Set saving state to false
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Toaster />
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Add Customer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Phone Number with Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone No.</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="9000000"
            />
            {showDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    {customer.phone} - {customer.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN No.</label>
            <input
              type="text"
              value={newCustomer.gstin || ''}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, gstin: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newCustomer.name || ''}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={newCustomer.email || ''}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end rounded-b-lg">
          <button
            onClick={handleSubmit}
            disabled={isSaving} // Disable button while saving
            className={`px-4 py-2 ${
              isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-md transition-colors flex items-center gap-2`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Ok'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
