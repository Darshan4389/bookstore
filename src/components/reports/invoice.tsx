'use client';
import { useState, useEffect } from 'react';
import BaseReport from './base-report';
import { fetchInvoiceReport } from '@/lib/firebase/reports';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  items: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
}

const columns = [
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'date', label: 'Date' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'items', label: 'Items' },
  { key: 'totalAmount', label: 'Total Amount' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'paymentMethod', label: 'Payment Method' },
];

export default function InvoiceReport() {
  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key));
  const [data, setData] = useState<InvoiceData[]>([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDateChange = async (startDate: Date | undefined, endDate: Date | undefined) => {
    try {
      setLoading(true);
      const invoiceData = await fetchInvoiceReport(startDate, endDate);
      setData(invoiceData);
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast.error('Failed to fetch invoice data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'excel' | 'csv') => {
    try {
      // Filter data based on visible columns
      const exportData = data.map(row => {
        const filteredRow: any = {};
        visibleColumns.forEach(col => {
          filteredRow[columns.find(c => c.key === col)?.label || col] = row[col as keyof InvoiceData];
        });
        return filteredRow;
      });

      if (type === 'excel') {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Invoice Report');
        XLSX.writeFile(wb, `invoice_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        // CSV Export
        const csvContent = [
          // Headers
          visibleColumns.map(col => columns.find(c => c.key === col)?.label || col).join(','),
          // Data rows
          ...exportData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_report_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Initial load with current date
  useEffect(() => {
    handleDateChange(new Date(), new Date());
  }, []);

  return (
    <BaseReport onDateChange={handleDateChange} onExport={handleExport}>
      <div className="rounded-md border">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold">Invoice Report</h2>
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
                    No data available. Select a date range to view invoice report.
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    {columns.map((column) => (
                      visibleColumns.includes(column.key) && (
                        <td key={column.key} className="px-4 py-2">
                          {column.key === 'totalAmount' 
                            ? `$${row[column.key].toFixed(2)}`
                            : row[column.key as keyof InvoiceData]}
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
