"use client";

import { useState, useEffect } from 'react';
import { StoreSettings } from '@/types/store';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Store, Mail, Phone, Hash, Globe, FileText } from 'lucide-react';

export default function StoreSettingsComponent() {
  const [settings, setSettings] = useState<StoreSettings>({
    name: '',
    address: '',
    gstin: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    // invoicePrefix: '',
    // lastInvoiceNumber: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'settings'));
      const storeDoc = querySnapshot.docs.find(doc => doc.id === 'store');
      if (storeDoc) {
        setSettings(storeDoc.data() as StoreSettings);
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'store'), settings);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving store settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Store className="w-5 h-5" />
          Store Settings
        </h2>
      </div>
      <div className="p-6">
        {!isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Store Name</label>
                <p className="mt-1 text-sm text-gray-900">{settings.name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                <p className="mt-1 text-sm text-gray-900">{settings.gstin || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{settings.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{settings.email || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{settings.address || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <p className="mt-1 text-sm text-gray-900">{settings.website || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{settings.description || 'Not set'}</p>
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Prefix</label>
                <p className="mt-1 text-sm text-gray-900">{settings.invoicePrefix || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Invoice Number</label>
                <p className="mt-1 text-sm text-gray-900">{settings.lastInvoiceNumber || 'Not set'}</p>
              </div> */}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Settings
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Store Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={settings.name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gstin" className="block text-sm font-medium text-gray-700">
                  GSTIN
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="gstin"
                    id="gstin"
                    value={settings.gstin}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={settings.phone}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={settings.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1">
                  <textarea
                    name="address"
                    id="address"
                    rows={3}
                    value={settings.address}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={settings.website}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="description"
                    id="description"
                    value={settings.description}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Invoice Prefix and Last Invoice Number */}
              {/* <div>
                <label htmlFor="invoicePrefix" className="block text-sm font-medium text-gray-700">
                  Invoice Prefix
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="invoicePrefix"
                    id="invoicePrefix"
                    value={settings.invoicePrefix}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastInvoiceNumber" className="block text-sm font-medium text-gray-700">
                  Last Invoice Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="lastInvoiceNumber"
                    id="lastInvoiceNumber"
                    value={settings.lastInvoiceNumber}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div> */}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
