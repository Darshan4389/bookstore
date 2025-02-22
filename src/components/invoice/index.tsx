import React from 'react';
import { Bill } from '@/types/bill';
import { format } from 'date-fns';
import './print.css';
interface InvoiceProps {
  bill: Bill;
  storeSettings: any;
}

export default function Invoice({ bill, storeSettings }: InvoiceProps) {
  const totalQty = bill.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="print-container p-2 mx-auto bg-white text-black print:p-0">
      <div className="text-center mb-2">
        <h2 className="text-sm font-semibold">{storeSettings?.name || 'Book Store'}</h2>
        <p className="text-xs">{storeSettings?.address || ''}</p>
        <p className="text-xs">Ph. {storeSettings?.phone || ''}</p>
        {storeSettings?.gstin && <p className="text-xs">GSTIN: {storeSettings.gstin}</p>}
      </div>
  
      <div className="border-t border-b py-1 mb-2 text-xs">
        <div className="flex justify-between">
          <span>Bill No: {bill.invoiceNumber}</span>
          <span>Date: {format(new Date(bill.createdAt), 'dd-MMM-yyyy')}</span>
        </div>
      </div>
  
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item) => (
            <tr key={item.id}>
              <td>{item.book.title}</td>
              <td>{item.quantity}</td>
              <td>₹{item.price.toFixed(2)}</td>
              <td>₹{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
  
      <div className="border-t pt-2 text-xs">
        <div className="flex justify-between">
          <span>Total Qty</span>
          <span>{totalQty}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{bill.subtotal.toFixed(2)}</span>
        </div>
        {bill.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>₹{bill.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold mt-1">
          <span>Total Amount</span>
          <span>₹{bill.total.toFixed(2)}</span>
        </div>
      </div>
  
      <div className="text-center text-xs">
        <p>Thank you! Visit Again.</p>
      </div>
    </div>
  );
  
}
