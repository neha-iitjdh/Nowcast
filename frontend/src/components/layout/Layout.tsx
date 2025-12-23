import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiCompass, FiUser, FiLogOut, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/explore', icon: FiCompass, label: 'Explore' },
    { path: '/search', icon: FiSearch, label: 'Search' },
    ...(isAuthenticated && user
      ? [{ path: `/profile/${user.username}`, icon: FiUser, label: 'Profile' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden md:block">
          <div className="p-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-600">Nowcast</span>
            </Link>
          </div>

          <nav className="mt-6 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {isAuthenticated && user && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <Link to={`/profile/${user.username}`} className="flex items-center space-x-3">
                  <Avatar src={user.avatar} alt={user.username} size="md" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">@{user.username}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Logout"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen border-r border-gray-200 dark:border-gray-700">
          {children}
        </main>

        {/* Right sidebar - Trending/Who to follow */}
        <aside className="w-80 h-screen sticky top-0 hidden lg:block p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
              What's happening
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Trending topics will appear here
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`p-3 rounded-lg ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
