'use client';
import { useState, useEffect } from 'react';
import BaseReport from './base-report';
import { fetchCustomerReport } from '@/lib/firebase/reports';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CustomerData {
  customerName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

const columns = [
  { key: 'customerName', label: 'Customer Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'totalOrders', label: 'Total Orders' },
  { key: 'totalSpent', label: 'Total Spent' },
  { key: 'lastOrderDate', label: 'Last Order Date' },
];

async function checkOrders() {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    console.log('Total orders in database:', snapshot.size);
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('Order:', {
        id: doc.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        createdAt: data.createdAt?.toDate()?.toISOString(),
        totalAmount: data.totalAmount
      });
    });
  } catch (error) {
    console.error('Error checking orders:', error);
  }
}

export default function CustomerReport() {
  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key));
  const [data, setData] = useState<CustomerData[]>([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkOrders();
  }, []);

  const handleDateChange = async (startDate: Date | undefined, endDate: Date | undefined) => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching customer data for dates:', { startDate, endDate });
      const customerData = await fetchCustomerReport(startDate, endDate);
      console.log('Received customer data:', customerData);
      setData(customerData);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('Failed to fetch customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'excel' | 'csv') => {
    try {
      if (data.length === 0) {
        toast.error('No data available to export');
        return;
      }

      const exportData = data.map(row => {
        const filteredRow: any = {};
        visibleColumns.forEach(col => {
          filteredRow[columns.find(c => c.key === col)?.label || col] = row[col as keyof CustomerData];
        });
        return filteredRow;
      });

      if (type === 'excel') {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customer Report');
        XLSX.writeFile(wb, `customer_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        const csvContent = [
          visibleColumns.map(col => columns.find(c => c.key === col)?.label || col).join(','),
          ...exportData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `customer_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      }

      toast.success(`Report exported as ${type.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(current =>
      current.includes(columnKey)
        ? current.filter(key => key !== columnKey)
        : [...current, columnKey]
    );
  };

  return (
    <BaseReport onDateChange={handleDateChange} onExport={handleExport}>
      <div className="rounded-md border">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold">Customer Report</h2>
          <div className="relative">
            <button
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              Columns
            </button>
            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  {columns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center px-4 py-2 hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column.key)}
                        onChange={() => toggleColumn(column.key)}
                        className="mr-2"
                      />
                      {column.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {columns.map((column) => (
                  visibleColumns.includes(column.key) && (
                    <th key={column.key} className="px-4 py-2 text-left font-semibold text-gray-600">
                      {column.label}
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="text-center py-4">
                    No data available. Select a date range and click Generate Report.
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    {columns.map((column) => (
                      visibleColumns.includes(column.key) && (
                        <td key={column.key} className="px-4 py-2">
                          {column.key === 'totalSpent' 
                            ? `$${row[column.key].toFixed(2)}`
                            : row[column.key as keyof CustomerData]}
                        </td>
                      )
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BaseReport>
  );
}
