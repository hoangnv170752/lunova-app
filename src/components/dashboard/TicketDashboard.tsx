import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserSettingsModal from '../modals/UserSettingsModal';
import WeatherDisplay from '../WeatherDisplay';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  Plus,
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle,
  LogOut,
  Package,
  Gem,
  Ticket,
  Bell,
  Store
} from 'lucide-react';

const TicketDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tickets');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const sidebarItems = [
    { id: 'orders', label: t('dashboard.recentOrders'), icon: Package, count: 89, route: '/dashboard' },
    { id: 'products', label: t('nav.products') || 'Products', icon: Gem, count: 156, route: '/dashboard/product' },
    { id: 'shops', label: t('nav.shops') || 'Shops', icon: Store, count: 0, route: '/dashboard/shop' },
    { id: 'tickets', label: t('nav.tickets') || 'Tickets', icon: Ticket, count: 12, route: '/dashboard/ticket' },
  ];

  // Sample ticket data
  const tickets = [
    { 
      id: 'TKT-001', 
      subject: 'Order Delivery Issue', 
      customer: 'Emma Wilson', 
      email: 'emma.wilson@example.com',
      status: 'Open', 
      priority: 'High',
      category: 'Delivery',
      created: '2025-06-20',
      lastUpdate: '2025-06-25'
    },
    { 
      id: 'TKT-002', 
      subject: 'Product Quality Concern', 
      customer: 'James Brown', 
      email: 'james.brown@example.com',
      status: 'In Progress', 
      priority: 'Medium',
      category: 'Product',
      created: '2025-06-19',
      lastUpdate: '2025-06-24'
    },
    { 
      id: 'TKT-003', 
      subject: 'Refund Request', 
      customer: 'Sophia Chen', 
      email: 'sophia.chen@example.com',
      status: 'Pending', 
      priority: 'Medium',
      category: 'Billing',
      created: '2025-06-18',
      lastUpdate: '2025-06-23'
    },
    { 
      id: 'TKT-004', 
      subject: 'Website Navigation Issue', 
      customer: 'Michael Johnson', 
      email: 'michael.johnson@example.com',
      status: 'Open', 
      priority: 'Low',
      category: 'Website',
      created: '2025-06-17',
      lastUpdate: '2025-06-22'
    },
    { 
      id: 'TKT-005', 
      subject: 'Missing Item in Order', 
      customer: 'Olivia Martinez', 
      email: 'olivia.martinez@example.com',
      status: 'In Progress', 
      priority: 'High',
      category: 'Order',
      created: '2025-06-16',
      lastUpdate: '2025-06-21'
    },
    { 
      id: 'TKT-006', 
      subject: 'Product Customization Query', 
      customer: 'William Taylor', 
      email: 'william.taylor@example.com',
      status: 'Open', 
      priority: 'Medium',
      category: 'Product',
      created: '2025-06-15',
      lastUpdate: '2025-06-20'
    },
    { 
      id: 'TKT-007', 
      subject: 'Payment Failed', 
      customer: 'Ava Garcia', 
      email: 'ava.garcia@example.com',
      status: 'Resolved', 
      priority: 'High',
      category: 'Billing',
      created: '2025-06-14',
      lastUpdate: '2025-06-19'
    },
    { 
      id: 'TKT-008', 
      subject: 'Account Access Issue', 
      customer: 'Noah Rodriguez', 
      email: 'noah.rodriguez@example.com',
      status: 'Closed', 
      priority: 'Medium',
      category: 'Account',
      created: '2025-06-13',
      lastUpdate: '2025-06-18'
    },
    { 
      id: 'TKT-009', 
      subject: 'Product Return Process', 
      customer: 'Isabella Lopez', 
      email: 'isabella.lopez@example.com',
      status: 'Open', 
      priority: 'Low',
      category: 'Returns',
      created: '2025-06-12',
      lastUpdate: '2025-06-17'
    },
    { 
      id: 'TKT-010', 
      subject: 'Shipping Delay Inquiry', 
      customer: 'Liam Lee', 
      email: 'liam.lee@example.com',
      status: 'In Progress', 
      priority: 'Medium',
      category: 'Shipping',
      created: '2025-06-11',
      lastUpdate: '2025-06-16'
    },
    { 
      id: 'TKT-011', 
      subject: 'Gift Card Not Working', 
      customer: 'Charlotte Patel', 
      email: 'charlotte.patel@example.com',
      status: 'Pending', 
      priority: 'Medium',
      category: 'Gift Cards',
      created: '2025-06-10',
      lastUpdate: '2025-06-15'
    },
    { 
      id: 'TKT-012', 
      subject: 'Promotional Code Issue', 
      customer: 'Ethan Kim', 
      email: 'ethan.kim@example.com',
      status: 'Resolved', 
      priority: 'Low',
      category: 'Promotions',
      created: '2025-06-09',
      lastUpdate: '2025-06-14'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'Resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Closed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-blue-100 text-blue-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {isSettingsModalOpen && (
        <UserSettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      )}
      {/* Sidebar */}
      <div className="w-64 flex flex-col bg-gray-900 border-r border-gray-800">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Gem className="h-5 w-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white lunova-brand">Lunova</span>
          </div>
        </div>

        {/* No Weather Widget in sidebar */}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.route) {
                      navigate(item.route);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    item.id === activeTab
                      ? 'bg-yellow-400/10 text-yellow-400 border-r-2 border-yellow-400'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.count && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.id === activeTab ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-800 text-gray-300'
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
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">{t('dashboard.logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('dashboard.tickets.title') || 'Support Tickets'}</h1>
              <p className="text-gray-400 text-sm">{t('dashboard.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <WeatherDisplay />
              
              <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 transition-colors rounded-full p-1 pr-4"
              >
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-medium">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <span className="text-sm text-gray-300">{user?.email?.split('@')[0] || 'User'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Ticket Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('dashboard.tickets.title') || 'Support Tickets'}</h2>
                  <span className="text-sm text-gray-400">{tickets.length} {t('dashboard.tickets.items') || 'tickets'}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500"
                      placeholder={t('dashboard.tickets.searchTickets') || 'Search tickets...'}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white flex items-center gap-2">
                      <span className="text-sm text-gray-300">{t('dashboard.sortingBy') || 'Sorting By'}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white flex items-center gap-2">
                      <span className="text-sm text-gray-300">{t('dashboard.filters') || 'Filters'}</span>
                      <Filter className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm text-black flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>{t('dashboard.tickets.createTicket') || 'Create Ticket'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-y border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.tickets.ticketId') || 'Ticket ID'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.tickets.subject') || 'Subject'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.tickets.customer') || 'Customer'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.tickets.status') || 'Status'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.tickets.priority') || 'Priority'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.tickets.created') || 'Created'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{ticket.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{ticket.subject}</div>
                        <div className="text-xs text-gray-400">{ticket.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">{ticket.customer}</div>
                        <div className="text-xs text-gray-400">{ticket.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusClass(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{ticket.created}</div>
                        <div className="text-xs text-gray-400">{t('dashboard.tickets.updated') || 'Updated'}: {ticket.lastUpdate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button className="p-1 rounded-md hover:bg-gray-700">
                            <MessageCircle className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-1 rounded-md hover:bg-gray-700">
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-800">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700">
                  {t('dashboard.previous') || 'Previous'}
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700">
                  {t('dashboard.next') || 'Next'}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {t('dashboard.tickets.showing') || 'Showing'} <span className="font-medium">1</span> {t('dashboard.tickets.to') || 'to'} <span className="font-medium">12</span> {t('dashboard.tickets.of') || 'of'} <span className="font-medium">12</span> {t('dashboard.tickets.results') || 'results'}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                      <span className="sr-only">{t('dashboard.previous') || 'Previous'}</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-yellow-400 text-sm font-medium text-black">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                      <span className="sr-only">{t('dashboard.next') || 'Next'}</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDashboard;
