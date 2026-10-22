import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, RotateCcw, Compass, Search, Bell, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDemo } from '../../demo';
import { ViewType } from '../../types';

const VIEW_TITLES: Partial<Record<ViewType, [string, string]>> = {
  dashboard: ['Workspace', 'Dashboard'],
  uploads: ['Workspace', 'Uploads'],
  'upload-review': ['Uploads', 'Review upload'],
  'column-mapping': ['Uploads', 'Match columns'],
  reports: ['Reports', 'Stock mismatches'],
  'reports-stock': ['Reports', 'Stock mismatches'],
  'reports-price-discrepancies': ['Reports', 'Price discrepancies'],
  'reports-price-mismatches': ['Reports', 'Price mismatches'],
  catalogue: ['Catalogue', 'All products'],
  'product-detail': ['Catalogue', 'Product'],
  'new-product': ['Catalogue', 'New products'],
  'new-products': ['Catalogue', 'New products'],
  categories: ['Catalogue', 'Categories'],
  'category-detail': ['Catalogue', 'Category'],
  markups: ['Catalogue', 'Marketplace price'],
  'category-mapping': ['Catalogue', 'Category mapping'],
  templates: ['Outputs', 'Templates'],
  'outputs-generate': ['Outputs', 'Generated files'],
  settings: ['Workspace', 'Settings'],
};

export const Header: React.FC = () => {
  const { showToast, navigate, currentView } = useApp();
  const { state, attention, resetDemo, startNewCustomer } = useDemo();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setDemoMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const [section, page] = VIEW_TITLES[currentView] || ['Workspace', state.tenant.name];

  return (
    <header className="bg-white/90 backdrop-blur border-b border-gray-200 px-8 h-[68px] flex items-center justify-between gap-6 sticky top-0 z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 min-w-0">
        <span className="truncate">{section}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
        <span className="font-semibold text-gray-900 truncate">{page}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden lg:flex items-center gap-2.5 w-[340px] h-10 px-3 rounded-[10px] border border-gray-200 bg-gray-50 text-[13px] text-gray-400">
          <Search className="w-4 h-4" />
          <span className="flex-1 truncate">Search products, barcodes, files…</span>
          <kbd className="text-[11px] font-sans px-1.5 rounded-md border border-gray-200 bg-white text-gray-500">⌘K</kbd>
        </div>

        {/* Sync status */}
        <div className="hidden xl:flex items-center gap-2 h-10 px-3 rounded-[10px] border border-gray-200 bg-white text-[13px] font-semibold text-gray-900">
          <span className="w-2 h-2 rounded-full bg-[#00D9A9] ring-[3px] ring-[#00D9A9]/20" />
          {state.tenant.erpName} connected
        </div>

        {/* Demo menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setDemoMenuOpen(!demoMenuOpen)}
            className="inline-flex items-center gap-1.5 h-10 px-3 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Demo
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {demoMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-30">
              <button
                onClick={() => {
                  startNewCustomer();
                  setDemoMenuOpen(false);
                  navigate('onboarding');
                  showToast('Started new customer onboarding', 'info');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-gray-700 hover:bg-gray-50 border-b border-gray-100"
              >
                <Compass className="w-3.5 h-3.5 text-gray-500" />
                Start as new customer
              </button>
              <button
                onClick={() => {
                  resetDemo();
                  setDemoMenuOpen(false);
                  navigate('dashboard');
                  showToast('Reset to day-30 demo data', 'info');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                Reset to day-30 demo
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate('dashboard')}
          title={`${attention.length} items need attention`}
          className="relative w-10 h-10 rounded-[10px] border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <Bell className="w-[18px] h-[18px]" />
          {attention.length > 0 && (
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#00D9A9] ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
};
