"use client";

import { useState, useEffect } from 'react';
import { Category } from '@/types/category';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit2, Trash2, Search, ChevronDown } from 'lucide-react';

export default function CategorySettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Category>({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentCategory?.id) {
        await updateDoc(doc(db, 'categories', currentCategory.id), {
          name: formData.name,
          description: formData.description,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'categories'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setCurrentCategory(null);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setCurrentCategory(category);
    setFormData(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-medium text-gray-900">Category Management</h2>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          <button
            onClick={() => {
              setCurrentCategory(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors min-w-[140px] justify-center whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-lg border border-gray-200">
        <div className="min-w-full">
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{category.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => category.id && handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile and Tablet Card View */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => category.id && handleDelete(category.id)}
                  className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {currentCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {currentCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
