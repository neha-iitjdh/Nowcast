import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  linkText: string;
  linkTo: string;
  linkLabel: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  linkText,
  linkTo,
  linkLabel,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">Nowcast</h1>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg rounded-xl sm:px-10">
          {children}
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {linkText}{' '}
          <Link to={linkTo} className="text-primary-600 hover:text-primary-500 font-medium">
            {linkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
