import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  SimplificationResult, 
  ActivePage, 
  TargetLanguage, 
  ReadingLevel 
} from './types';
import { getCurrentUser, logoutUser } from './services/auth';
import { getCurrentReport, saveReport } from './services/storage';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { HomePage } from './pages/HomePage';
import { ResultsPage } from './pages/ResultsPage';
import { ComprehensionPage } from './pages/ComprehensionPage';
import { DietChartPage } from './pages/DietChartPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { DoctorConnectPage } from './pages/DoctorConnectPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { MedClarityChatbot } from './components/MedClarityChatbot';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => getCurrentUser());
  const [authView, setAuthView] = useState<'login' | 'signup' | 'authenticated'>(() => 
    getCurrentUser() ? 'authenticated' : 'login'
  );

  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [currentReport, setCurrentReportState] = useState<SimplificationResult | null>(() => getCurrentReport());

  const [defaultLanguage, setDefaultLanguage] = useState<TargetLanguage>('Simple English');
  const [defaultLevel, setDefaultLevel] = useState<ReadingLevel>('simple');

  useEffect(() => {
    // Keep user state synchronized
    const user = getCurrentUser();
    if (user) {
      setCurrentUserState(user);
      setAuthView('authenticated');
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUserState(user);
    setAuthView('authenticated');
    setActivePage('home');
  };

  const handleSignUpSuccess = (user: UserProfile) => {
    setCurrentUserState(user);
    setAuthView('authenticated');
    setActivePage('home');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUserState(null);
    setAuthView('login');
  };

  const handleProcessComplete = (result: SimplificationResult) => {
    saveReport(result);
    setCurrentReportState(result);
    setActivePage('results');
  };

  const handlePreferencesChange = (lang: TargetLanguage, level: ReadingLevel) => {
    setDefaultLanguage(lang);
    setDefaultLevel(level);
  };

  // If not authenticated, render Login or SignUp view
  if (authView === 'login') {
    return (
      <LoginPage
        onSuccess={handleLoginSuccess}
        onGoToSignUp={() => setAuthView('signup')}
      />
    );
  }

  if (authView === 'signup') {
    return (
      <SignUpPage
        onSuccess={handleSignUpSuccess}
        onGoToLogin={() => setAuthView('login')}
      />
    );
  }

  return (
    <div id="medclarity-app-root" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* 15. Sidebar Navigation (Home, Results, Comprehension, Diet Chart, Follow-ups, Patient Profile, Doctor Connect, Dashboard, Settings, Logout) */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentReport={currentReport}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <main className="flex-1 pb-16">
          {activePage === 'home' && (
            <HomePage
              onProcessComplete={handleProcessComplete}
              initialLanguage={defaultLanguage}
              initialLevel={defaultLevel}
            />
          )}

          {activePage === 'results' && currentReport && (
            <ResultsPage
              result={currentReport}
              onNavigate={(page) => setActivePage(page)}
              onNewAnalysis={() => setActivePage('home')}
            />
          )}

          {activePage === 'results' && !currentReport && (
            <HomePage
              onProcessComplete={handleProcessComplete}
              initialLanguage={defaultLanguage}
              initialLevel={defaultLevel}
            />
          )}

          {activePage === 'comprehension' && (
            <ComprehensionPage
              result={currentReport}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {activePage === 'diet' && (
            <DietChartPage
              result={currentReport}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {activePage === 'followups' && (
            <FollowUpsPage
              result={currentReport}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {activePage === 'profile' && currentUser && (
            <PatientProfilePage
              currentUser={currentUser}
              onProfileUpdated={(updated) => setCurrentUserState(updated)}
            />
          )}

          {activePage === 'doctor' && currentUser && (
            <DoctorConnectPage
              currentUser={currentUser}
              currentReport={currentReport}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigate={(page) => setActivePage(page)}
              onSelectReport={(report) => setCurrentReportState(report)}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              currentLanguage={defaultLanguage}
              currentLevel={defaultLevel}
              onPreferencesChange={handlePreferencesChange}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 font-serif">MedClarity</span>
              <span>— Patient Education & Medical-Text Simplification Platform</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Educational Support Only</span>
              <span>•</span>
              <span>Non-Diagnostic</span>
              <span>•</span>
              <span>Preserving Dosage & Timings</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating MedClarity Assistant Chatbot */}
      <MedClarityChatbot 
        currentReport={currentReport} 
        targetLanguage={currentReport?.target_language || defaultLanguage} 
      />
    </div>
  );
}
