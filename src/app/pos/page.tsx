/** @jsxImportSource react */
'use client';

import React, { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { Category } from '@/types/category';
import { BillItem, Bill } from '@/types/bill';
import { StoreSettings } from '@/types/store';
import { Customer } from '@/types/customer';
import { collection, getDocs, addDoc, doc, getDoc, writeBatch, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Search, ShoppingCart, Plus, Minus, Trash2, Tag, CreditCard, Smartphone, UserPlus, X } from 'lucide-react';
import CustomerSelector from '@/components/pos/CustomerSelector';
import Invoice from '@/components/invoice';
import toast, { Toaster } from 'react-hot-toast';

export default function POS() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<BillItem[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchStoreSettings();
  }, []);

  const fetchBooks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'books'));
      const booksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      setBooks(booksData);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

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

  const fetchStoreSettings = async () => {
    try {
      const storeDoc = await getDoc(doc(db, 'settings', 'store'));
      if (storeDoc.exists()) {
        setStoreSettings(storeDoc.data() as StoreSettings);
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (book: Book) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.book.id === book.id);
      if (existingItem) {
        // Check if adding one more would exceed stock
        if (existingItem.quantity >= book.stock) {
          return prevCart;
        }
        return prevCart.map(item =>
          item.book.id === book.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * (item.price - item.discount)
              }
            : item
        );
      }
      return [...prevCart, {
        id: Math.random().toString(36).substr(2, 9),
        book,
        quantity: 1,
        price: book.price,
        discount: 0,
        total: book.price
      }];
    });
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + change;
          // Check if the new quantity would be valid
          if (newQuantity <= 0 || newQuantity > item.book.stock) {
            return item;
          }
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * (item.price - item.discount)
          };
        }
        return item;
      })
    );
  };

  const updateDiscount = (itemId: string, discount: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? {
              ...item,
              discount,
              total: item.quantity * (item.price - discount)
            }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemDiscounts = cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
    const totalDiscount = itemDiscounts + (subtotal * (globalDiscount / 100));
    const total = subtotal - totalDiscount;
    return { subtotal, totalDiscount, total };
  };

  const updateBookStock = async (bookId: string, quantity: number) => {
    const bookRef = doc(db, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    if (bookDoc.exists()) {
      const currentStock = bookDoc.data().stock;
      await updateDoc(bookRef, {
        stock: currentStock - quantity
      });
    }
  };

  const saveBill = async () => {
    if (!user) {
      toast.error('Please login to create an order');
      return;
    }
    setIsProcessing(true);
    try {
      const { subtotal, totalDiscount, total } = calculateTotals();

      // Get the latest invoice number
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('invoiceNumber', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      let nextInvoiceNumber = 1;
      if (!snapshot.empty) {
        const lastInvoiceNumber = parseInt(snapshot.docs[0].data().invoiceNumber || '0');
        nextInvoiceNumber = lastInvoiceNumber + 1;
      }

      // Format invoice number with leading zeros
      const invoiceNumber: any = nextInvoiceNumber.toString().padStart(2, '0');
      const bill: Bill = {
        items: cart,
        subtotal,
        discount: totalDiscount,
        total,
        createdAt: new Date().toISOString(),
        customerId: selectedCustomer?.id || 'guest',
        customerName: selectedCustomer?.name || 'Guest',
        customerPhone: selectedCustomer?.phone || '',
        customerEmail: selectedCustomer?.email || '',
        paymentMethod,
        status: 'completed',
        createdBy: {
          id: user.uid,
          name: user.displayName || 'Unknown Staff'
        },
        invoiceNumber
      };

      // Start a batch write
      const batch = writeBatch(db);

      // Add the bill
      const newOrderRef = doc(ordersRef);
      batch.set(newOrderRef, { ...bill, id: newOrderRef.id });

      // Update stock for each book
      for (const item of cart) {
        if (!item.book.id) continue;
        const bookRef = doc(db, 'books', item.book.id);
        const bookDoc = await getDoc(bookRef);
        if (bookDoc.exists()) {
          const currentStock = bookDoc.data().stock;
          if (currentStock < item.quantity) {
            throw new Error(`Not enough stock for ${item.book.title}`);
          }
          batch.update(bookRef, {
            stock: currentStock - item.quantity
          });
        }
      }

      // Commit the batch
      await batch.commit();

      // Set current bill for printing
      setCurrentBill({ ...bill, id: newOrderRef.id });

      // Reset cart and customer info after successful save
      setCart([]);
      setSelectedCustomer(null);
      setGlobalDiscount(0);
      setPaymentMethod('cash');

      // Refresh books data to update stock
      await fetchBooks();

      toast.success('Order placed successfully');

      // Trigger print after a short delay
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen-93 flex overflow-hidden">
      <Toaster />
      
      {/* Print Section - Hidden until printing */}
      <div className="hidden print:block">
        {currentBill && <Invoice bill={currentBill} storeSettings={storeSettings} />}
      </div>

      {/* Main Content - Hidden during printing */}
      <div className="flex-1 flex print:hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {/* Fixed Header */}
          <div className="bg-white border-b">
            {/* Categories */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Categories</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  } transition-colors`}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-4 py-2 rounded-full ${
                      selectedCategory === category.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    } transition-colors`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Scrollable Books Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
              {filteredBooks.map(book => (
                <div key={book.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{book.author}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-medium text-gray-900">₹{book.price}</span>
                    <span className="text-sm text-gray-500">{book.stock} in stock</span>
                  </div>
                  <button
                    onClick={() => addToCart(book)}
                    disabled={book.stock === 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-[27rem] bg-white border-l border-gray-200 flex flex-col h-full">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Cart</h2>
              </div>
              <button
                onClick={() => setShowCustomerSelector(true)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {selectedCustomer ? 'Change Customer' : 'Add Customer'}
              </button>
            </div>
            {selectedCustomer && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedCustomer.name}</div>
                    <div className="text-sm text-gray-500">
                      {selectedCustomer.phone} • {selectedCustomer.email}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto text-sm">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Cart is empty
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between gap-4">
                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-800 line-clamp-1">{item.book.title}</h4>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Discount Input */}
                    {/* <div className="flex items-center gap-1">
                      <span className="text-sm">Disc(%):</span>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateDiscount(item.id, Number(e.target.value))}
                        className="w-14 text-sm border border-gray-300 rounded px-2 py-1"
                        placeholder="0"
                      />
                    </div> */}

                    {/* Price */}
                    <div className="text-sm font-medium min-w-[50px] text-right">₹{item.price}</div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Global Discount (%)</label>
                  <input
                    type="number"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                    className="mt-1  border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${
                        paymentMethod === 'cash'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${
                        paymentMethod === 'card'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${
                        paymentMethod === 'upi'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      UPI
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex justify-between gap-1.5 text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>₹{calculateTotals().subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-1.5  text-sm font-semibold">
                  <span>Discount</span>
                  <span>₹{calculateTotals().totalDiscount.toFixed(2)}</span>
                </div>
                <div className=" flex justify-between gap-1.5 font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{calculateTotals().total.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t">
                <button
                  onClick={saveBill}
                  disabled={cart.length === 0 || isProcessing}
                  className={`w-full py-3 rounded-lg ${
                    cart.length === 0 || isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-medium flex items-center justify-center gap-2 text-lg`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Selector Modal */}
        {showCustomerSelector && (
          <CustomerSelector
            onSelect={(customer) => {
              setSelectedCustomer(customer);
              setShowCustomerSelector(false);
            }}
            onClose={() => setShowCustomerSelector(false)}
          />
        )}
      </div>
    </div>
  );
}
