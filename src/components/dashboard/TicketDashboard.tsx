import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import UserSettingsModal from '../modals/UserSettingsModal';
import WeatherDisplay from '../WeatherDisplay';
import DashboardSidebar from './DashboardSidebar';
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Bell,
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreHorizontal
} from 'lucide-react';

// Define types for API responses
interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to?: string;
  related_order_id?: string;
  related_product_id?: string;
  attachments: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Response type for ticket responses (comments)
interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  is_staff: boolean;
  message: string;
  attachments: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

// Smaller components for better maintainability
const TicketStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const mapStatusToUI = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusClass(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1">{mapStatusToUI(status)}</span>
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const mapPriorityToUI = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(priority)}`}>
      {mapPriorityToUI(priority)}
    </span>
  );
};

// This component is now directly inlined in the main component to use the handleTicketSelect, updateTicket, and deleteTicket functions

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useLanguage();
  
  return (
    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
      <button 
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <span className="sr-only">{t('dashboard.previous') || 'Previous'}</span>
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const pageNum = i + 1;
        return (
          <button 
            key={pageNum}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-700 ${pageNum === currentPage ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'} text-sm font-medium`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        );
      })}
      
      <button 
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        <span className="sr-only">{t('dashboard.next') || 'Next'}</span>
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
};

const TicketFilters: React.FC<{
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  onStatusFilterChange: (status: string) => void;
  onPriorityFilterChange: (priority: string) => void;
  onCategoryFilterChange: (category: string) => void;
}> = ({ 
  statusFilter, 
  priorityFilter, 
  categoryFilter, 
  onStatusFilterChange, 
  onPriorityFilterChange, 
  onCategoryFilterChange 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex space-x-4 mb-4">
      <div className="relative">
        <select
          className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-2 pr-8 text-sm appearance-none"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="">{t('dashboard.tickets.all_statuses') || 'All Statuses'}</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
      </div>
      
      <div className="relative">
        <select
          className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-2 pr-8 text-sm appearance-none"
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
        >
          <option value="">{t('dashboard.tickets.all_priorities') || 'All Priorities'}</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
      </div>
      
      <div className="relative">
        <select
          className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-2 pr-8 text-sm appearance-none"
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
        >
          <option value="">{t('dashboard.tickets.all_categories') || 'All Categories'}</option>
          <option value="Account">Account</option>
          <option value="Order">Order</option>
          <option value="Payment">Payment</option>
          <option value="Product">Product</option>
          <option value="Shipping">Shipping</option>
          <option value="Website">Website</option>
        </select>
        <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

const TicketDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('tickets');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([]);
  
  // API integration state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 10;
  
  // Backend URL from environment variables
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('skip', ((currentPage - 1) * itemsPerPage).toString());
      params.append('limit', itemsPerPage.toString());
      
      if (user?.id) {
        params.append('user_id', user.id);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (priorityFilter) {
        params.append('priority', priorityFilter);
      }
      
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      // Make API request
      const response = await fetch(`${backendUrl}/tickets?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setTickets(data.items || []);
      
      // Calculate total pages
      const total = data.total || 0;
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Failed to load tickets. Please try again.');
      // Use empty array when error occurs
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, currentPage, itemsPerPage, user?.id, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder, searchQuery]);
  
  // Create a new ticket
  const createTicket = async (ticketData: {
    user_id?: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    try {
      const response = await fetch(`${backendUrl}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Refresh tickets after creation
      fetchTickets();
      return true;
    } catch (err) {
      console.error('Failed to create ticket:', err);
      return false;
    }
  };
  
  // Update an existing ticket
  const updateTicket = async (ticketId: string, ticketData: {
    subject?: string;
    description?: string;
    status?: string;
    priority?: string;
    category?: string;
  }) => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Refresh tickets after update
      fetchTickets();
      return true;
    } catch (err) {
      console.error('Failed to update ticket:', err);
      setError('Failed to update ticket. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // We're directly using updateTicket in the UI for status changes
  
  // Delete a ticket
  const deleteTicket = async (ticketId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/tickets/${ticketId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Refresh tickets after deletion
      fetchTickets();
      return true;
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      setError('Failed to delete ticket. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle ticket selection for viewing details
  const handleTicketSelect = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
    
    // Fetch ticket responses
    try {
      const response = await fetch(`${backendUrl}/tickets/${ticket.id}/responses`);
      if (response.ok) {
        const data = await response.json();
        setTicketResponses(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch ticket responses:', err);
      setTicketResponses([]);
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Fetch tickets for new page
    setTimeout(() => fetchTickets(), 0);
  };
  
  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    fetchTickets();
  };
  
  // Load tickets on component mount and when filters change
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {isSettingsModalOpen && (
        <UserSettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      )}
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />

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
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500"
                      placeholder={t('dashboard.tickets.searchTickets') || 'Search tickets...'}
                    />
                  </form>
                  <div className="flex gap-3">
                    <div className="relative">
                      <select 
                        className="appearance-none px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500 pr-8"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="created_at">{t('dashboard.tickets.sortByDate') || 'Date'}</option>
                        <option value="priority">{t('dashboard.tickets.sortByPriority') || 'Priority'}</option>
                        <option value="status">{t('dashboard.tickets.sortByStatus') || 'Status'}</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select 
                        className="appearance-none px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500 pr-8"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                      >
                        <option value="desc">{t('dashboard.tickets.descending') || 'Descending'}</option>
                        <option value="asc">{t('dashboard.tickets.ascending') || 'Ascending'}</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button 
                      className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm text-black flex items-center gap-2"
                      onClick={() => {
                        // Create ticket functionality
                        const newTicket = {
                          user_id: user?.id,
                          subject: 'New Ticket',
                          description: 'This is a new ticket',
                          category: 'General',
                          priority: 'medium'
                        };
                        createTicket(newTicket);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('dashboard.tickets.createTicket') || 'Create Ticket'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 pb-4">
              <TicketFilters 
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                categoryFilter={categoryFilter}
                onStatusFilterChange={setStatusFilter}
                onPriorityFilterChange={setPriorityFilter}
                onCategoryFilterChange={setCategoryFilter}
              />
            </div>

            {/* Loading state */}
            {loading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400 mb-2"></div>
                <p className="text-gray-400">{t('dashboard.tickets.loading') || 'Loading tickets...'}</p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="p-8 text-center">
                <div className="inline-block rounded-full h-8 w-8 bg-red-500 flex items-center justify-center mb-2">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-red-400">{error}</p>
                <button 
                  className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white"
                  onClick={() => fetchTickets()}
                >
                  {t('dashboard.tickets.tryAgain') || 'Try Again'}
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && tickets.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-400">{t('dashboard.tickets.noTickets') || 'No tickets found'}</p>
              </div>
            )}

          {/* Tickets table */}
          {!loading && !error && tickets.length > 0 && (
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
                      {t('dashboard.tickets.date') || 'Date'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.tickets.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{ticket.id.substring(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{ticket.subject}</div>
                        <div className="text-xs text-gray-400">{ticket.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">User {ticket.user_id.substring(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{new Date(ticket.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{t('dashboard.tickets.updated') || 'Updated'}: {new Date(ticket.updated_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="p-1 rounded-md hover:bg-gray-700"
                            onClick={() => handleTicketSelect(ticket)}
                            title={t('dashboard.tickets.view') || 'View'}
                          >
                            <MessageCircle className="h-4 w-4 text-gray-400" />
                          </button>
                          <button 
                            className="p-1 rounded-md hover:bg-gray-700"
                            onClick={() => updateTicket(ticket.id, { status: ticket.status === 'open' ? 'closed' : 'open' })}
                            title={ticket.status === 'open' ? (t('dashboard.tickets.close') || 'Close') : (t('dashboard.tickets.reopen') || 'Reopen')}
                          >
                            {ticket.status === 'open' ? <CheckCircle className="h-4 w-4 text-gray-400" /> : <Clock className="h-4 w-4 text-gray-400" />}
                          </button>
                          <button 
                            className="p-1 rounded-md hover:bg-gray-700"
                            onClick={() => deleteTicket(ticket.id)}
                            title={t('dashboard.tickets.delete') || 'Delete'}
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

            {/* Pagination */}
            {!loading && !error && tickets.length > 0 && (
              <div className="px-6 py-4 bg-gray-900 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    <p>
                      {t('dashboard.tickets.showing') || 'Showing'}{' '}
                      <span className="font-medium text-white">{((currentPage - 1) * itemsPerPage) + 1}</span>{' '}
                      {t('dashboard.tickets.to') || 'to'}{' '}
                      <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, tickets.length)}</span>{' '}
                      {t('dashboard.tickets.of') || 'of'}{' '}
                      <span className="font-medium text-white">{tickets.length}</span>{' '}
                      {t('dashboard.tickets.tickets') || 'tickets'}
                    </p>
                  </div>
                  <div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Ticket details modal */}
      {showTicketDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
              <button 
                onClick={() => {
                  setShowTicketDetails(false);
                  setSelectedTicket(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex space-x-4 mb-2">
                <TicketStatusBadge status={selectedTicket.status} />
                <PriorityBadge priority={selectedTicket.priority} />
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                  {selectedTicket.category}
                </span>
              </div>
              
              <p className="text-gray-300 mb-4">{selectedTicket.description}</p>
              
              <div className="text-sm text-gray-400">
                {t('dashboard.tickets.created') || 'Created'}: {new Date(selectedTicket.created_at).toLocaleString()}
              </div>
            </div>
            
            <h3 className="font-semibold mb-2">{t('dashboard.tickets.responses') || 'Responses'}</h3>
            
            {ticketResponses.length > 0 ? (
              <div className="space-y-4">
                {ticketResponses.map((response) => (
                  <div key={response.id} className="bg-gray-800 p-3 rounded">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">
                        {response.is_staff ? 'Staff' : 'User'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(response.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{response.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">{t('dashboard.tickets.noResponses') || 'No responses yet'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDashboard;
