import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  BellRing,
  BookOpen,
  Calculator,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  ClipboardEdit,
  ClipboardList,
  FolderKanban,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  SlidersHorizontal,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { AppPage, NotificationItem } from '../types/academic';
import { useAcademic } from '../context/AcademicContext';
import { Logo } from './Logo';
import { Avatar } from './Avatar';

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'semesters', label: 'My Semesters', icon: FolderKanban },
  { id: 'predictor', label: 'Grade Predictor', icon: Calculator },
  { id: 'improvement', label: 'Improvement Planner', icon: TrendingUp },
  { id: 'marks', label: 'Marks Tracker', icon: ClipboardList },
  { id: 'library', label: 'Study Library', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  semesters: 'My Semesters',
  'semester-detail': 'Semester Details',
  predictor: 'Grade Predictor',
  improvement: 'Improvement Planner',
  marks: 'Marks Tracker',
  library: 'Study Library',
  settings: 'Settings',
};

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    activePage,
    selectedSemesterId,
    navigateTo,
    openLanding,
    profile,
    semesters,
    courses,
    resources,
    notifications,
    notificationPrefs,
    dismissedNotificationCount,
    toastAlert,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    restoreDismissedNotifications,
    dismissToast,
    logout,
  } = useAcademic();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'exam' | 'missing'>('all');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSemester = useMemo(
    () => semesters.find((s) => s.id === selectedSemesterId) ?? null,
    [semesters, selectedSemesterId]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const notifCounts = useMemo(() => {
    const exam = notifications.filter((n) => n.category === 'exam').length;
    const missing = notifications.filter(
      (n) => n.category === 'missing_marks' || n.category === 'low_internal'
    ).length;
    return { all: notifications.length, exam, missing };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'exam') {
      return notifications.filter((n) => n.category === 'exam');
    }
    if (notifFilter === 'missing') {
      return notifications.filter(
        (n) => n.category === 'missing_marks' || n.category === 'low_internal'
      );
    }
    return notifications;
  }, [notifications, notifFilter]);

  const handleOpenNotification = (n: NotificationItem) => {
    markNotificationRead(n.id);
    if (n.targetPage) {
      navigateTo(n.targetPage, n.targetSemesterId);
    }
    setNotifOpen(false);
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { courses: [], semesters: [], resources: [] };
    return {
      courses: courses
        .filter(
          (c) =>
            c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
        )
        .slice(0, 5),
      semesters: semesters
        .filter((s) => s.name.toLowerCase().includes(q))
        .slice(0, 3),
      resources: resources
        .filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.courseCode.toLowerCase().includes(q)
        )
        .slice(0, 3),
    };
  }, [searchQuery, courses, semesters, resources]);

  const hasSearchResults =
    searchResults.courses.length > 0 ||
    searchResults.semesters.length > 0 ||
    searchResults.resources.length > 0;

  const currentPageTitle =
    activePage === 'semester-detail' && selectedSemester
      ? selectedSemester.name
      : PAGE_TITLES[activePage];

  const handleNavClick = (id: AppPage) => {
    navigateTo(id);
    setMobileMenuOpen(false);
  };

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#7955A1] text-white border-r-2 border-[#29232D]">
      <div>
        <div className="flex h-20 items-center justify-between px-5 border-b-2 border-[#29232D]/30">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6D36B] rounded-xl"
          >
            <Logo variant="dark" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden rounded-xl border-2 border-[#29232D] bg-white p-1.5 text-[#29232D]"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3.5 py-5 space-y-1.5" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePage === item.id ||
              (item.id === 'semesters' && activePage === 'semester-detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F6D36B] text-[#29232D] border-2 border-[#29232D] shadow-[3px_3px_0_#29232D]'
                    : 'text-white/90 hover:bg-white/15 border-2 border-transparent'
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive ? 'text-[#29232D]' : 'text-[#FCE2DE]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 space-y-3 border-t-2 border-[#29232D]/30">
        <button
          type="button"
          onClick={openLanding}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] px-3 py-2 text-xs font-bold text-[#29232D] hover:bg-white transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>View Public Website</span>
        </button>

        <div className="rounded-2xl border-2 border-[#29232D] bg-white p-3 text-[#29232D]">
          <div className="flex items-center gap-3">
            <Avatar name={profile.fullName} src={profile.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-[#29232D]">
                {profile.fullName}
              </p>
              <p className="truncate text-xs font-semibold text-[#7955A1]">
                {profile.department}
              </p>
              <p className="truncate text-[11px] text-[#29232D]/70">
                {profile.university}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className="mt-3 w-full flex items-center justify-between rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] px-3 py-1.5 text-xs font-bold text-[#29232D] hover:bg-[#F8D0CC] transition-colors"
          >
            <span>Profile Settings</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FCE2DE] text-[#29232D]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[272px] shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#29232D]/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[280px] max-w-[85vw] h-full">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-20 bg-white border-b-2 border-[#29232D] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] p-2 text-[#29232D]"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              {activePage === 'semester-detail' && selectedSemester ? (
                <div className="flex items-center gap-1.5 text-sm">
                  <button
                    type="button"
                    onClick={() => navigateTo('semesters')}
                    className="text-[#7955A1] hover:text-[#29232D] font-bold whitespace-nowrap"
                  >
                    My Semesters
                  </button>
                  <ChevronRight className="h-4 w-4 text-[#29232D]/50 shrink-0" />
                  <span className="font-display font-bold text-[#29232D] truncate">
                    {selectedSemester.name}
                  </span>
                </div>
              ) : (
                <h1 className="font-display text-lg sm:text-xl font-extrabold text-[#29232D] truncate">
                  {currentPageTitle}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Search */}
            <div ref={searchRef} className="relative hidden md:block w-64 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#29232D]/60" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Search courses, semesters..."
                className="w-full rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] pl-9 pr-3 py-2 text-sm font-medium text-[#29232D] placeholder:text-[#29232D]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30 transition-colors"
              />

              {searchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border-2 border-[#29232D] bg-white p-2 shadow-[4px_4px_0_#29232D] z-40">
                  {!hasSearchResults ? (
                    <p className="px-3 py-4 text-center text-xs font-semibold text-[#29232D]/60">
                      No matching courses, semesters, or materials.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {searchResults.semesters.length > 0 && (
                        <div>
                          <p className="px-2.5 py-1 text-[11px] font-bold text-[#7955A1]">
                            Semesters
                          </p>
                          {searchResults.semesters.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                navigateTo('semester-detail', s.id);
                                setSearchFocused(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-bold hover:bg-[#FCE2DE]"
                            >
                              <span>{s.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.courses.length > 0 && (
                        <div>
                          <p className="px-2.5 py-1 text-[11px] font-bold text-[#7955A1]">
                            Courses
                          </p>
                          {searchResults.courses.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                navigateTo('semester-detail', c.semesterId);
                                setSearchFocused(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs hover:bg-[#FCE2DE]"
                            >
                              <span className="truncate font-bold text-[#29232D]">
                                {c.name}
                              </span>
                              <span className="font-mono font-bold text-[#7955A1] shrink-0">
                                {c.code}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.resources.length > 0 && (
                        <div>
                          <p className="px-2.5 py-1 text-[11px] font-bold text-[#7955A1]">
                            Study Library
                          </p>
                          {searchResults.resources.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                navigateTo('library');
                                setSearchFocused(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs hover:bg-[#FCE2DE]"
                            >
                              <span className="truncate font-bold text-[#29232D]">
                                {r.title}
                              </span>
                              <span className="font-mono font-bold text-[#7955A1] shrink-0">
                                {r.courseCode}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] p-2.5 text-[#29232D] hover:bg-[#F8D0CC] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[#29232D] bg-[#F6D36B] px-1 text-[10px] font-extrabold text-[#29232D] tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[336px] sm:w-[410px] rounded-2xl border-2 border-[#29232D] bg-white shadow-[4px_4px_0_#29232D] z-40 overflow-hidden">
                  <div className="flex items-center justify-between border-b-2 border-[#29232D] bg-[#F8D0CC] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-extrabold text-[#29232D]">
                        Local Alerts
                      </span>
                      {unreadCount > 0 && (
                        <span className="rounded-lg border border-[#29232D] bg-[#F6D36B] px-1.5 py-0.5 text-[10px] font-extrabold text-[#29232D] tabular-nums">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#7955A1] hover:text-[#29232D]"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          navigateTo('settings');
                        }}
                        className="rounded-lg border border-[#29232D] bg-white p-1 text-[#29232D] hover:bg-[#FCE2DE]"
                        aria-label="Notification preferences"
                        title="Notification preferences"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  {notificationPrefs.enabled && (
                    <div className="flex items-center gap-1.5 border-b-2 border-[#29232D]/15 bg-[#F5F3F2] px-3 py-2">
                      {(
                        [
                          { id: 'all', label: 'All', count: notifCounts.all },
                          { id: 'exam', label: 'Exams', count: notifCounts.exam },
                          { id: 'missing', label: 'Missing Marks', count: notifCounts.missing },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setNotifFilter(tab.id)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                            notifFilter === tab.id
                              ? 'border-[#29232D] bg-[#7955A1] text-white'
                              : 'border-transparent bg-white text-[#29232D]/80 hover:border-[#29232D]/30'
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="divide-y divide-[#29232D]/15 max-h-80 overflow-y-auto">
                    {!notificationPrefs.enabled ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs font-bold text-[#29232D]">
                          Local alerts are paused.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            navigateTo('settings');
                          }}
                          className="mt-2 text-xs font-extrabold text-[#7955A1] hover:underline"
                        >
                          Re-enable in Settings →
                        </button>
                      </div>
                    ) : filteredNotifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs font-semibold text-[#29232D]/60">
                        No {notifFilter === 'exam' ? 'upcoming exam ' : notifFilter === 'missing' ? 'missing-mark ' : ''}alerts right now. You are all caught up!
                      </p>
                    ) : (
                      filteredNotifications.map((n) => {
                        const IconComp =
                          n.category === 'exam'
                            ? CalendarClock
                            : n.category === 'low_internal'
                              ? AlertTriangle
                              : ClipboardEdit;
                        const badgeBg =
                          n.severity === 'warning'
                            ? 'bg-[#F6D36B]'
                            : n.category === 'exam'
                              ? 'bg-[#FCE2DE]'
                              : 'bg-[#E5D8F3]';

                        return (
                          <div
                            key={n.id}
                            className={`group flex items-start gap-2.5 px-3.5 py-3 hover:bg-[#FCE2DE]/45 transition-colors ${
                              !n.read ? 'bg-[#FCE2DE]/35' : ''
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#29232D] ${badgeBg} text-[#29232D]`}
                            >
                              <IconComp className="h-3.5 w-3.5" />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenNotification(n)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-[#29232D] truncate">
                                  {n.title}
                                </span>
                                <span
                                  className={`rounded-md border border-[#29232D]/30 px-1.5 py-0.5 text-[10px] font-extrabold shrink-0 ${
                                    n.severity === 'warning'
                                      ? 'bg-[#FFF4D6] text-[#92400E]'
                                      : 'bg-[#E5D8F3] text-[#29232D]'
                                  }`}
                                >
                                  {n.time}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#29232D]/75 leading-relaxed">
                                {n.description}
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(n.id);
                              }}
                              className="mt-0.5 rounded-lg p-1 text-[#29232D]/45 hover:bg-[#F8D0CC] hover:text-[#29232D] transition-colors shrink-0"
                              aria-label={`Dismiss ${n.title}`}
                              title="Dismiss alert"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-[#29232D]/15 bg-[#F5F3F2] px-3.5 py-2 text-[11px]">
                    {dismissedNotificationCount > 0 ? (
                      <button
                        type="button"
                        onClick={restoreDismissedNotifications}
                        className="font-bold text-[#7955A1] hover:underline"
                      >
                        Restore {dismissedNotificationCount} dismissed
                      </button>
                    ) : (
                      <span className="font-semibold text-[#29232D]/60">
                        Live local reminders
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigateTo('settings');
                      }}
                      className="font-bold text-[#29232D] hover:text-[#7955A1]"
                    >
                      Preferences →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-white p-1 pr-3 hover:bg-[#FCE2DE] transition-colors"
                aria-label="User profile menu"
              >
                <Avatar name={profile.fullName} src={profile.avatarUrl} size="sm" />
                <span className="hidden sm:inline text-xs font-bold text-[#29232D] max-w-[120px] truncate">
                  {profile.fullName}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border-2 border-[#29232D] bg-white py-1.5 shadow-[4px_4px_0_#29232D] z-40">
                  <div className="px-3.5 py-2.5 border-b-2 border-[#29232D]/15">
                    <p className="font-display text-sm font-bold text-[#29232D] truncate">
                      {profile.fullName}
                    </p>
                    <p className="text-xs text-[#29232D]/70 truncate">{profile.email}</p>
                    <p className="mt-0.5 text-[11px] font-mono font-bold text-[#7955A1]">
                      ID: {profile.studentId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo('settings');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE]"
                  >
                    <User className="h-3.5 w-3.5 text-[#7955A1]" />
                    Profile &amp; Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openLanding();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE]"
                  >
                    <Globe className="h-3.5 w-3.5 text-[#7955A1]" />
                    Public Landing Page
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-[#B91C1C] hover:bg-[#F8D0CC]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-7 max-w-[1380px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating In-App Local Alert Toast */}
      {toastAlert && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 w-[340px] max-w-[calc(100vw-2.5rem)] rounded-2xl border-2 border-[#29232D] bg-white p-4 shadow-[4px_4px_0_#29232D]"
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#29232D] ${
                toastAlert.severity === 'warning' ? 'bg-[#F6D36B]' : 'bg-[#FCE2DE]'
              } text-[#29232D]`}
            >
              <BellRing className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xs font-extrabold text-[#29232D]">
                {toastAlert.title}
              </p>
              <p className="mt-1 text-xs font-medium text-[#29232D]/75 leading-relaxed">
                {toastAlert.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {toastAlert.targetPage && (
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo(toastAlert.targetPage!, toastAlert.targetSemesterId);
                      dismissToast();
                    }}
                    className="rounded-lg border-2 border-[#29232D] bg-[#7955A1] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#65448B]"
                  >
                    Review Course
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(true);
                    dismissToast();
                  }}
                  className="rounded-lg border-2 border-[#29232D] bg-[#FCE2DE] px-2.5 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#F8D0CC]"
                >
                  Open Alerts
                </button>
                <button
                  type="button"
                  onClick={dismissToast}
                  className="ml-auto text-[11px] font-bold text-[#29232D]/60 hover:text-[#29232D]"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              className="rounded-lg p-1 text-[#29232D]/50 hover:bg-[#F5F3F2] hover:text-[#29232D]"
              aria-label="Close alert toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
