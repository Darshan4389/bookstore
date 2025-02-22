/** @jsxImportSource react */
'use client';

import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/lib/firebase';
import { format, subDays } from 'date-fns';
import { AlertTriangle, DollarSign, Package, ShoppingBag, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalSales: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  
  const [salesTrend, setSalesTrend] = useState<{ date: string; sales: number }[]>([]);

  const [topBooks, setTopBooks] = useState<{ name: string; value: number }[]>([]);
const [revenueGrowth, setRevenueGrowth] = useState<{ name: string; revenue: number }[]>([]);
const [recentOrders, setRecentOrders] = useState<{ id: string; invoiceNumber: string; customerName: string; createdAt: string; total: number; status: string }[]>([]);
const [lowStockProducts, setLowStockProducts] = useState<{ id: string; title: string; stock: number }[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch metrics
      await Promise.all([
        fetchSalesMetrics(),
        fetchTotalOrders(),
        fetchTotalCustomers(),
        fetchTotalProducts(),
        fetchSalesTrend(),
        fetchTopBooks(),
        fetchRevenueGrowth(),
        fetchRecentOrders(),
        fetchLowStockProducts(),
        fetchTotalSales(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalSales = async () => {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    const totalSales = snapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);
    console.log(totalSales);
    setMetrics(prev => ({ ...prev, totalSales }));
  };
  
  const fetchSalesMetrics = async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const ordersRef = collection(db, 'orders');

    // Today's sales
    const todayQuery = query(
      ordersRef,
      where('createdAt', '>=', todayStart.toISOString()),
      where('createdAt', '<=', todayEnd.toISOString())
    );
    const todaySnapshot = await getDocs(todayQuery);
    const todaySales = todaySnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);

    // Week's sales
    const weekQuery = query(
      ordersRef,
      where('createdAt', '>=', weekStart.toISOString()),
      where('createdAt', '<=', weekEnd.toISOString())
    );
    const weekSnapshot = await getDocs(weekQuery);
    const weekSales = weekSnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);

    // Month's sales
    const monthQuery = query(
      ordersRef,
      where('createdAt', '>=', monthStart.toISOString()),
      where('createdAt', '<=', monthEnd.toISOString())
    );
    const monthSnapshot = await getDocs(monthQuery);
    const monthSales = monthSnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);

    setMetrics(prev => ({
      ...prev,
      todaySales,
      weekSales,
      monthSales,
    }));
  };

  const fetchTotalOrders = async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
  
    const ordersRef = collection(db, 'orders');
  
    // Today's Orders
    const todayQuery = query(
      ordersRef,
      where('createdAt', '>=', todayStart.toISOString()),
      where('createdAt', '<=', todayEnd.toISOString())
    );
    const todaySnapshot = await getDocs(todayQuery);
    const todayOrders = todaySnapshot.size;
  
    // This Week's Orders
    const weekQuery = query(
      ordersRef,
      where('createdAt', '>=', weekStart.toISOString()),
      where('createdAt', '<=', weekEnd.toISOString())
    );
    const weekSnapshot = await getDocs(weekQuery);
    const weekOrders = weekSnapshot.size;
  
    // This Month's Orders
    const monthQuery = query(
      ordersRef,
      where('createdAt', '>=', monthStart.toISOString()),
      where('createdAt', '<=', monthEnd.toISOString())
    );
    const monthSnapshot = await getDocs(monthQuery);
    const monthOrders = monthSnapshot.size;
  
    // Total Orders
    const totalSnapshot = await getDocs(ordersRef);
    const totalOrders = totalSnapshot.size;
  
    setMetrics(prev => ({
      ...prev,
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
    }));
  };
  

  const fetchTotalCustomers = async () => {
    const snapshot = await getDocs(collection(db, 'customers'));
    setMetrics(prev => ({ ...prev, totalCustomers: snapshot.size }));
  };

  const fetchTotalProducts = async () => {
    const snapshot = await getDocs(collection(db, 'books'));
    setMetrics(prev => ({ ...prev, totalProducts: snapshot.size }));
  };

  const fetchSalesTrend = async () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'MMM dd'),
        sales: 0,
      };
    }).reverse();

    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const orderDate = format(new Date(data.createdAt), 'MMM dd');
      const dayData = last7Days.find(day => day.date === orderDate);
      if (dayData) {
        dayData.sales += data.total;
      }
    });

    setSalesTrend(last7Days);
  };

  const fetchTopBooks = async () => {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    const bookSales:any = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      data.items.forEach((item:any) => {
        const bookId = item.book.id;
        if (!bookSales[bookId]) {
          bookSales[bookId] = {
            name: item.book.title,
            value: 0,
          };
        }
        bookSales[bookId].value += item.quantity;
      });
    });
const data:any  =Object.values(bookSales).sort((a:any, b:any) => b.value - a.value).slice(0, 5)
    setTopBooks(data);
  };

  const fetchRevenueGrowth = async () => {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
  
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      name: format(subDays(new Date(), i * 30), 'MMM'),
      revenue: 0,
    })).reverse();
  
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const orderMonth = format(new Date(data.createdAt), 'MMM');
      const monthData = monthlyRevenue.find(month => month.name === orderMonth);
      if (monthData) {
        monthData.revenue += data.total;
      }
    });
  
    setRevenueGrowth(monthlyRevenue);
  };
  

  const fetchRecentOrders = async () => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    
    const orders:any = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setRecentOrders(orders);
  };

  const fetchLowStockProducts = async () => {
    const booksRef = collection(db, 'books');
    const q = query(booksRef, where('stock', '<', 5));
    const snapshot = await getDocs(q);
    
    const books:any = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setLowStockProducts(books);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Sales ₹{metrics.totalSales.toFixed(2)}</h3>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold"></p>
              <p className="text-sm text-gray-500">Today : ₹{metrics.todaySales.toFixed(2)}</p>
              <p className="text-lg font-semibold"></p>
              <p className="text-sm text-gray-500">This Week :₹{metrics.weekSales.toFixed(2)}</p>
              <p className="text-lg font-semibold"></p>
              <p className="text-sm text-gray-500">This Month :₹{metrics.monthSales.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-gray-500 text-sm font-medium">Total Orders : {metrics.totalOrders}</h3>
    <ShoppingBag className="w-5 h-5 text-green-500" />
  </div>
  <div className="space-y-2">
    <p className="text-sm text-gray-500">Today: {metrics.todayOrders}</p>
    <p className="text-sm text-gray-500">This Week: {metrics.weekOrders}</p>
    <p className="text-sm text-gray-500">This Month: {metrics.monthOrders}</p>
    {/* <p className="text-lg font-bold">Total: {metrics.totalOrders}</p> */}
  </div>
</div>


          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Customers</h3>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Products in Stock</h3>
              <Package className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{metrics.totalProducts}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-gray-700 font-semibold mb-4">Sales Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#3B82F6" name="Daily Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Books */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-gray-700 font-semibold mb-4">Top Selling Books</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topBooks}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topBooks.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Growth */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-gray-700 font-semibold mb-4">Revenue Growth</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Warning */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-gray-700 font-semibold">Low Stock Warning</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Book
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lowStockProducts.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {book.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                        {book.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-700 font-semibold mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ₹{order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
