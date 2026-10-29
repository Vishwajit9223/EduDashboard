/**
 * Users List Page
 * Admin panel for viewing all registered users with pagination and search
 */

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import '../styles/UsersList.css';

const UsersList = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  });

  const ITEMS_PER_PAGE = 10;

  // Check if user is admin
  useEffect(() => {
    if (!user || !user.is_admin) {
      setError('Unauthorized: Admin access required');
      setLoading(false);
    }
  }, [user]);

  // Fetch users from API
  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page,
        per_page: ITEMS_PER_PAGE
      });

      if (search.trim()) {
        params.append('q', search.trim());
      }

      console.log('[USERS LIST] Fetching users with params:', params.toString());

      const response = await apiService.api.get(`/users?${params.toString()}`);
      
      console.log('[USERS LIST] Response:', response.data);

      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
        setCurrentPage(page);
      } else {
        setError(response.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('[USERS LIST] Error fetching users:', err);
      
      if (err.response?.status === 403) {
        setError('Unauthorized: Admin access required');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and search
  useEffect(() => {
    if (user && user.is_admin) {
      fetchUsers(1, searchQuery);
    }
  }, [user]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);
    // Debounce the search
    const timer = setTimeout(() => {
      fetchUsers(1, value);
    }, 300);
    return () => clearTimeout(timer);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchUsers(newPage, searchQuery);
    }
  };

  // Render error state
  if (error) {
    return (
      <div className="users-list-container">
        <div className="page-header">
          <h1>Users Management</h1>
          <p>View and manage all registered users</p>
        </div>
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading && users.length === 0) {
    return (
      <div className="users-list-container">
        <div className="page-header">
          <h1>Users Management</h1>
          <p>View and manage all registered users</p>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>Users Management</h1>
        <p>View and manage all registered users</p>
      </div>

      {/* Stats */}
      <div className="users-stats">
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{pagination.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Current Page</span>
          <span className="stat-value">
            {pagination.total === 0 ? 0 : currentPage} / {pagination.pages}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      {/* Error message (for non-permission errors) */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        {users.length === 0 ? (
          <div className="no-data">
            <p>No users found. {searchQuery && 'Try different search terms.'}</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="cell-id">{u.id}</td>
                  <td className="cell-name">{u.name}</td>
                  <td className="cell-email">{u.email}</td>
                  <td className="cell-phone">{u.phone}</td>
                  <td className="cell-course">{u.course}</td>
                  <td className="cell-date">
                    {new Date(u.registrationDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 0 && (
        <div className="pagination-section">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="pagination-info">
            Page <span className="page-number">{currentPage}</span> of{' '}
            <span className="total-pages">{pagination.pages}</span>
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages || loading}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersList;
