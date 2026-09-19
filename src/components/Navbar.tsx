import React, { useState } from 'react';
import { 
  FileText, 
  HelpCircle, 
  Utensils, 
  CalendarClock, 
  User, 
  Stethoscope, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { ActivePage, UserProfile, SimplificationResult } from '../types';

interface Props {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  currentReport: SimplificationResult | null;
}

export const Navbar: React.FC<Props> = ({
  activePage,
  setActivePage,
  currentUser,
  onLogout,
  currentReport,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActivePage; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: Activity },
    { 
      id: 'results', 
      label: 'Results', 
      icon: FileText,
      badge: currentReport ? 'Ready' : undefined
    },
    { 
      id: 'comprehension', 
      label: 'Comprehension', 
      icon: HelpCircle,
      badge: currentReport?.questions?.length ? `${currentReport.questions.length} Qs` : undefined
    },
    { 
      id: 'diet', 
      label: 'Diet Chart', 
      icon: Utensils,
      badge: currentReport?.diet?.diet_guidance_relevant ? 'Diet' : undefined
    },
    { 
      id: 'followups', 
      label: 'Follow-ups', 
      icon: CalendarClock,
      badge: currentReport?.follow_up?.reminder_available ? '1 Task' : undefined
    },
    { id: 'profile', label: 'Patient Profile', icon: User },
    { id: 'doctor', label: 'Doctor Connect', icon: Stethoscope },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            id="brand-logo" 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">
                  Med<span className="text-emerald-600">Clarity</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60">
                  Health AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">
                Patient Education & Verification
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav" className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right User Badge & Logout */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser && (
              <button
                id="user-profile-badge"
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 bg-slate-50/70 hover:bg-emerald-50/40 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : 'P'}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>{currentUser.fullName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser.age ? `${currentUser.age} yrs` : 'Patient'} • {currentUser.gender || 'Profile'}
                  </div>
                </div>
              </button>
            )}

            <button
              id="header-logout-btn"
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex xl:hidden items-center gap-2">
            {currentUser && (
              <button
                onClick={() => handleNavClick('profile')}
                className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase"
              >
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'P'}
              </button>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" className="xl:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 shadow-lg space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2">
            <span className="text-xs text-slate-500 truncate">{currentUser?.email}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
