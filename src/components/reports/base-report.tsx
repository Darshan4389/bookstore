'use client';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface BaseReportProps {
  children: React.ReactNode;
  onDateChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
  onExport: (type: 'excel' | 'csv') => void;
}

export default function BaseReport({ children, onDateChange, onExport }: BaseReportProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleGenerateReport = () => {
    onDateChange(startDate ?? undefined, endDate ?? undefined);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Start Date:</label>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            className="rounded border p-2"
            placeholderText="Select start date"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">End Date:</label>
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            className="rounded border p-2"
            placeholderText="Select end date"
          />
        </div>
        <button
          onClick={handleGenerateReport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generate Report
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('excel')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Excel
          </button>
          <button
            onClick={() => onExport('csv')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Export CSV
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
