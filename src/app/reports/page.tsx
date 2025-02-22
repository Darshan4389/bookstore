'use client';
import { useState } from 'react';
import SalesSummaryReport from '@/components/reports/sales-summary';
import CustomerReport from '@/components/reports/customer';
import InvoiceReport from '@/components/reports/invoice';
import InventoryReport from '@/components/reports/inventory';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      
      <div className="mb-4">
        <div className="flex space-x-2 border-b">
          <button
            className={`px-4 py-2 ${activeTab === 'sales' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Sales Summary
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'customer' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            Customer
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'invoice' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            Invoice
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'inventory' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'sales' && <SalesSummaryReport />}
        {activeTab === 'customer' && <CustomerReport />}
        {activeTab === 'invoice' && <InvoiceReport />}
        {activeTab === 'inventory' && <InventoryReport />}
      </div>
    </div>
  );
}
