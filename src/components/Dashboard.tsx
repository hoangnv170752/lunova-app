import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  LogOut, 
  User, 
  Settings, 
  Package, 
  Heart, 
  ShoppingBag, 
  Bell,
  Search,
  Filter,
  ChevronDown,
  Users,
  BarChart3,
  FileText,
  Ticket,
  MessageSquare,
  Gem,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, count: null },
    { id: 'users', label: 'Users', icon: Users, count: 1250, active: true },
    { id: 'orders', label: 'Orders', icon: Package, count: 89 },
    { id: 'products', label: 'Products', icon: Gem, count: 156 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, count: null },
    { id: 'blogs', label: 'Blogs', icon: FileText, count: 23 },
    { id: 'tickets', label: 'Tickets', icon: Ticket, count: 12 },
  ];

  const stats = [
    {
      title: 'Active users',
      value: '1250',
      change: '-10%',
      changeType: 'negative',
      subtitle: 'compared to last month',
      icon: '👥'
    },
    {
      title: 'New Users',
      value: '24',
      change: '+5%',
      changeType: 'positive',
      subtitle: 'compared to last month',
      icon: '📈'
    },
    {
      title: 'Total Users',
      value: '1301',
      change: '+40%',
      changeType: 'positive',
      subtitle: 'compared to last month',
      icon: '📊'
    }
  ];

  const users = [
    { name: 'Floyd Miles', email: 'tanya.hill@example.com', city: 'Omsk', date: '7/11/19' },
    { name: 'Kristin Watson', email: 'curtis.weaver@example.com', city: 'Neftchik', date: '4/4/18' },
    { name: 'Annette Black', email: 'deanna.curtis@example.com', city: 'Khabarovsk', date: '3/4/16' },
    { name: 'Wade Warren', email: 'felicia.reid@example.com', city: 'Mannheim', date: '4/21/12' },
    { name: 'Esther Howard', email: 'dolores.chambers@example.com', city: 'Cincinnati (OH)', date: '12/4/17' },
    { name: 'Cameron Williamson', email: 'michael.mitc@example.com', city: 'Sterlitamak', date: '8/30/14' },
    { name: 'Albert Flores', email: 'sara.cruz@example.com', city: 'Lomas de Zamora', date: '8/15/17' },
    { name: 'Robert Fox', email: 'kenzi.lawson@example.com', city: 'Greensboro (NC)', date: '5/30/14' },
    { name: 'Jenny Wilson', email: 'jackson.graham@example.com', city: 'Lübeck', date: '5/27/15' },
    { name: 'Ralph Edwards', email: 'willie.jennings@example.com', city: 'Vladikavkaz (Ossetia ASSR)', date: '1/31/14' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Gem className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 lunova-brand">LunoBiz.</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    item.id === activeTab
                      ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.count && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.id === activeTab ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=40"
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium flex items-center ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.changeType === 'positive' ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500">{stat.subtitle}</span>
                    </div>
                  </div>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* User List */}
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Table Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">User list</h2>
                  <span className="text-sm text-gray-500">1340 user</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search user"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-700">Sorting By</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Created date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button className="w-8 h-8 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-100 rounded">
                    1
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-sm bg-teal-600 text-white rounded">
                    2
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-100 rounded">
                    3
                  </button>
                </div>
                <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;