import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { UploadModal } from './components/modals/UploadModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { UploadReviewView } from './components/views/UploadReviewView';
import { ColumnMappingView } from './components/views/ColumnMappingView';
import { CatalogueView } from './components/views/CatalogueView';
import { ProductDetailView } from './components/views/ProductDetailView';
import { NewProductsView } from './components/views/NewProductsView';
import { StockMismatchesView } from './components/views/StockMismatchesView';
import { PriceDiscrepanciesView } from './components/views/PriceDiscrepanciesView';
import { GenerateFilesView } from './components/views/GenerateFilesView';
import { OnboardingCompleteView } from './components/views/OnboardingCompleteView';
import { MarkupsView } from './components/views/MarkupsView';
import { TemplatesView } from './components/views/TemplatesView';
import { SettingsView } from './components/views/SettingsView';
import { UploadsHistoryView } from './components/views/UploadsHistoryView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useDemo } from './demo';
import { LoginView } from './components/views/LoginView';

const MainContent: React.FC = () => {
  const { currentView, toasts, dismissToast, isAuthenticated } = useApp();
  const { state } = useDemo();

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <ToastContainer toasts={toasts} dismissToast={dismissToast} />
      </>
    );
  }

  // First-run gate or explicit onboarding route: full-screen wizard
  if (!state.onboarding?.completedAt || currentView === 'onboarding') {
    return (
      <>
        <OnboardingCompleteView />
        <ToastContainer toasts={toasts} dismissToast={dismissToast} />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'uploads':
        return <UploadsHistoryView />;
      case 'upload-review':
        return <UploadReviewView />;
      case 'column-mapping':
        return <ColumnMappingView />;
      case 'catalogue':
        return <CatalogueView />;
      case 'product-detail':
        return <ProductDetailView />;
      case 'new-products':
      case 'new-product':
        return <NewProductsView />;
      case 'reports':
      case 'reports-stock':
        return <StockMismatchesView />;
      case 'reports-price-discrepancies':
        return <PriceDiscrepanciesView />;
      case 'outputs-generate':
        return <GenerateFilesView />;
      case 'markups':
        return <MarkupsView />;
      case 'templates':
        return <TemplatesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F2F7F6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">{renderView()}</main>
      </div>
      <UploadModal />
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </div>
  );
};

const ToastContainer: React.FC<{
  toasts: { id: string; message: string; type: string }[];
  dismissToast: (id: string) => void;
}> = ({ toasts, dismissToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-white border border-gray-200 rounded-xl shadow-lg text-xs font-medium text-gray-900 animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-[#027864] shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            {toast.type === 'info' && (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            {toast.type === 'warning' && (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
