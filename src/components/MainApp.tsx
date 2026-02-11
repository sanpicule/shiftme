import { useEffect, useRef, useState } from 'react';
import { Dashboard } from './Dashboard';
import { SettingsPage } from './SettingsPage';
import { ProfilePage } from './ProfilePage';
import { AnalyticsPage } from './AnalyticsPage';
import { Layout } from './Layout';
import { SkeletonCard, SkeletonText } from './SkeletonCard';

type Page = 'dashboard' | 'analytics' | 'settings' | 'profile';

export function MainApp() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);

  const handlePageChange = (page: Page) => {
    window.scrollTo(0, 0);
    if (page === currentPage) return;
    setIsTransitioning(true);
    setCurrentPage(page);
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const renderSkeleton = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonText className="h-8" width="w-40" />
        <SkeletonText className="h-4" width="w-56" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="h-64" />
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handlePageChange} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      <div className="animate-fadeIn">{isTransitioning ? renderSkeleton() : renderPage()}</div>
    </Layout>
  );
}
