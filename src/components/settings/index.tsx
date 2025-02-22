"use client";

import { useState } from 'react';
import CategorySettings from './category';
import StoreSettings from './store';
import { Settings, Tag } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');

  return (
    <div className="p-6 bg-gray-50 h-screen-93">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('store')}
                className={`
                  py-4 px-1 inline-flex items-center gap-2 border-b-2 
                  ${activeTab === 'store'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Settings className="w-5 h-5" />
                Store Settings
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`
                  py-4 px-1 inline-flex items-center gap-2 border-b-2 
                  ${activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Tag className="w-5 h-5" />
                Categories
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'store' && <StoreSettings />}
            {activeTab === 'categories' && <CategorySettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
