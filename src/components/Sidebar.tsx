import React, { useState } from 'react';
import { 
  Home, 
  FileText, 
  HelpCircle, 
  Utensils, 
  CalendarClock, 
  User, 
  Stethoscope, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Sparkles, 
  Menu, 
  X,
  ShieldCheck
} from 'lucide-react';
import { ActivePage, UserProfile, SimplificationResult } from '../types';

interface Props {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  currentReport: SimplificationResult | null;
}

export const Sidebar: React.FC<Props> = ({
  activePage,
  setActivePage,
  currentUser,
  onLogout,
  currentReport,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActivePage; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'results', label: 'Results', icon: FileText, badge: currentReport ? 'Ready' : undefined },
    { id: 'diet', label: 'Diet Chart', icon: Utensils },
    { id: 'comprehension', label: 'Comprehension', icon: HelpCircle },
    { id: 'followups', label: 'Follow-ups', icon: CalendarClock },
    { id: 'profile', label: 'Patient Profile', icon: User },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'doctor', label: 'Doctor Connect', icon: Stethoscope },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setMobileMenuOpen(false);
    onLogout();
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 font-serif">Med<span className="text-emerald-600">Clarity</span></span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container (Desktop: fixed w-64, Mobile: drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900 font-serif leading-none">
                Med<span className="text-emerald-600">Clarity</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">
                Patient Education Platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Logout Button in Navigation */}
          <div className="pt-2">
            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* User Profile Mini-Card in Footer */}
        {currentUser && (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
            <div 
              onClick={() => handleNavClick('profile')}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'P'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser.email}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 px-2">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">Safe & Educational Only</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
