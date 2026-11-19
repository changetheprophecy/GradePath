import React, { useState } from 'react';
import { ArrowRight, BookOpen, FolderKanban, Menu, Target, X } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { Logo } from '../components/Logo';
import {
  FeatureDashboardIllustration,
  FeatureImprovementIllustration,
  FeatureMarksIllustration,
  FeaturePredictorIllustration,
  HeroAcademicIllustration,
  StepIllustration,
} from '../components/Illustrations';

export function LandingPage() {
  const { openAuth, enterDashboard, isAuthenticated } = useAcademic();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FCE2DE] text-[#29232D]">
      {/* Horizontal Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#F8D0CC] border-b-2 border-[#29232D]">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 h-20 flex items-center justify-between gap-6">
          {/* Left: GradePath Logo & Wordmark */}
          <a href="#top" className="shrink-0 focus-visible:outline-none">
            <Logo />
          </a>

          {/* Center: Single-line Nav Links */}
          <nav
            className="hidden md:flex items-center gap-8 text-[15px] font-bold text-[#29232D]"
            aria-label="Landing navigation"
          >
            <a
              href="#features"
              className="hover:text-[#7955A1] transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#7955A1] transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#academic-tools"
              className="hover:text-[#7955A1] transition-colors whitespace-nowrap shrink-0"
            >
              Academic Tools
            </a>
            <a
              href="#about"
              className="hover:text-[#7955A1] transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
          </nav>

          {/* Right: Sign In & Get Started */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => (isAuthenticated ? enterDashboard('dashboard') : openAuth('login'))}
              className="rounded-xl px-4 py-2 text-sm font-bold text-[#29232D] hover:bg-[#FCE2DE] transition-colors whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? 'Student Dashboard' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#29232D] transition-all whitespace-nowrap shrink-0"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="md:hidden rounded-xl border-2 border-[#29232D] bg-white p-2 text-[#29232D]"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t-2 border-[#29232D] bg-[#FCE2DE] px-5 py-4 space-y-3">
            <div className="flex flex-col gap-2 text-sm font-bold">
              <a href="#features" onClick={() => setMobileNavOpen(false)} className="py-1.5">
                Features
              </a>
              <a href="#how-it-works" onClick={() => setMobileNavOpen(false)} className="py-1.5">
                How It Works
              </a>
              <a href="#academic-tools" onClick={() => setMobileNavOpen(false)} className="py-1.5">
                Academic Tools
              </a>
              <a href="#about" onClick={() => setMobileNavOpen(false)} className="py-1.5">
                About
              </a>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  if (isAuthenticated) {
                    enterDashboard('dashboard');
                  } else {
                    openAuth('login');
                  }
                }}
                className="flex-1 rounded-xl border-2 border-[#29232D] bg-white px-4 py-2.5 text-sm font-bold text-[#29232D]"
              >
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  openAuth('signup');
                }}
                className="flex-1 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-sm font-bold text-white"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="top" className="bg-[#F8D0CC] py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
          <div className="rounded-[24px] border-2 border-[#29232D] bg-[#FCE2DE] p-7 sm:p-10 lg:p-14 shadow-[6px_6px_0_#29232D]">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-8">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-6">
                <p className="font-display text-sm font-bold tracking-wide text-[#7955A1]">
                  University Academic Performance &amp; Planning
                </p>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.1] tracking-tight text-[#29232D] [text-wrap:balance]">
                  Your Academic Journey, One Step Ahead.
                </h1>

                <p className="text-base sm:text-lg text-[#29232D]/85 leading-relaxed max-w-xl font-medium">
                  Track your progress, predict your grades, and take control of your academic future with GradePath.
                </p>

                <div className="flex flex-wrap items-center gap-5 pt-2">
                  <button
                    type="button"
                    onClick={() => enterDashboard('dashboard')}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#29232D] bg-[#7955A1] px-7 py-3.5 font-display text-base font-bold text-white shadow-[4px_4px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#29232D] transition-all whitespace-nowrap"
                  >
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  <a
                    href="#features"
                    className="inline-flex items-center gap-1.5 font-display text-base font-bold text-[#29232D] underline decoration-2 underline-offset-4 hover:text-[#7955A1] transition-colors whitespace-nowrap"
                  >
                    Explore Features
                  </a>
                </div>
              </div>

              {/* Right Column: Custom Hand-Drawn Editorial Illustration */}
              <div className="lg:col-span-6 flex justify-center">
                <HeroAcademicIllustration className="w-full max-w-[520px] h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics / Platform Capabilities Strip */}
      <section className="bg-white border-y-2 border-[#29232D] py-10">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x-2 lg:divide-[#29232D]/15">
            <div className="lg:pr-8">
              <p className="font-display text-2xl font-extrabold text-[#7955A1]">
                Academic Progress
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#29232D]/80">
                Real-time weighted semester GPA and cumulative CGPA tracking across every term.
              </p>
            </div>

            <div className="lg:px-8">
              <p className="font-display text-2xl font-extrabold text-[#29232D]">
                GPA Prediction
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#29232D]/80">
                Model midterm, attendance, and final marks to forecast letter grades before exams.
              </p>
            </div>

            <div className="lg:px-8">
              <p className="font-display text-2xl font-extrabold text-[#7955A1]">
                Smart Improvement Planning
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#29232D]/80">
                Identify eligible retakes and simulate replacement policy impact on your CGPA.
              </p>
            </div>

            <div className="lg:pl-8">
              <p className="font-display text-2xl font-extrabold text-[#29232D]">
                Study Resources
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#29232D]/80">
                Keep lecture notes, past papers, PDFs, and course links organized by subject.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-[#FCE2DE] py-16 lg:py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 space-y-10">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-bold text-[#7955A1]">
              Built for University Clarity
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#29232D]">
              Everything you need to stay ahead of every semester.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1: Peach */}
            <div className="rounded-[20px] border-2 border-[#29232D] bg-[#F8D0CC] p-7 sm:p-8 shadow-[4px_4px_0_#29232D] flex flex-col justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="space-y-2.5 max-w-sm">
                  <h3 className="font-display text-2xl font-extrabold text-[#29232D]">
                    Academic Dashboard
                  </h3>
                  <p className="text-base font-medium text-[#29232D]/85 leading-relaxed">
                    Monitor your academic performance from one place.
                  </p>
                </div>
                <FeatureDashboardIllustration className="h-20 w-28 shrink-0" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => enterDashboard('dashboard')}
                  className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#29232D] hover:text-[#7955A1]"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Feature 2: White */}
            <div className="rounded-[20px] border-2 border-[#29232D] bg-white p-7 sm:p-8 shadow-[4px_4px_0_#29232D] flex flex-col justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="space-y-2.5 max-w-sm">
                  <h3 className="font-display text-2xl font-extrabold text-[#29232D]">
                    Grade Predictor
                  </h3>
                  <p className="text-base font-medium text-[#29232D]/85 leading-relaxed">
                    Estimate your grades and explore different academic outcomes.
                  </p>
                </div>
                <FeaturePredictorIllustration className="h-20 w-28 shrink-0" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => enterDashboard('predictor')}
                  className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#7955A1] hover:text-[#29232D]"
                >
                  Try Grade Predictor
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Feature 3: Soft Purple */}
            <div className="rounded-[20px] border-2 border-[#29232D] bg-[#E5D8F3] p-7 sm:p-8 shadow-[4px_4px_0_#29232D] flex flex-col justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="space-y-2.5 max-w-sm">
                  <h3 className="font-display text-2xl font-extrabold text-[#29232D]">
                    Improvement Planner
                  </h3>
                  <p className="text-base font-medium text-[#29232D]/85 leading-relaxed">
                    Discover opportunities to improve your CGPA.
                  </p>
                </div>
                <FeatureImprovementIllustration className="h-20 w-28 shrink-0" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => enterDashboard('improvement')}
                  className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#29232D] hover:text-[#7955A1]"
                >
                  Simulate Improvement
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Feature 4: Soft Neutral / Warm Yellow Accent */}
            <div className="rounded-[20px] border-2 border-[#29232D] bg-[#FFF4D6] p-7 sm:p-8 shadow-[4px_4px_0_#29232D] flex flex-col justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="space-y-2.5 max-w-sm">
                  <h3 className="font-display text-2xl font-extrabold text-[#29232D]">
                    Marks Tracker
                  </h3>
                  <p className="text-base font-medium text-[#29232D]/85 leading-relaxed">
                    Keep track of examinations, attendance, and course performance.
                  </p>
                </div>
                <FeatureMarksIllustration className="h-20 w-28 shrink-0" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => enterDashboard('marks')}
                  className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#29232D] hover:text-[#7955A1]"
                >
                  Track Course Marks
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Tools Band (Deep Muted Purple Contrast) */}
      <section id="academic-tools" className="bg-[#7955A1] border-y-2 border-[#29232D] py-16 lg:py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="font-display text-sm font-bold text-[#F6D36B]">
                Complete Academic Toolkit
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-white">
                Designed around real university grading regulations.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => enterDashboard('dashboard')}
              className="rounded-2xl border-2 border-[#29232D] bg-[#F6D36B] px-6 py-3 font-display text-sm font-bold text-[#29232D] shadow-[4px_4px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#29232D] transition-all self-start lg:self-auto whitespace-nowrap"
            >
              Launch Workspace
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-[20px] border-2 border-[#29232D] bg-white p-6 shadow-[4px_4px_0_#29232D] space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#FCE2DE]">
                <FolderKanban className="h-5 w-5 text-[#29232D]" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#29232D]">
                My Semesters
              </h3>
              <p className="text-sm text-[#29232D]/80 leading-relaxed">
                Organize courses semester by semester, inspect detailed breakdowns, and automatically recalculate weighted GPA as marks change.
              </p>
            </div>

            <div className="rounded-[20px] border-2 border-[#29232D] bg-white p-6 shadow-[4px_4px_0_#29232D] space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#A7D9AE]">
                <Target className="h-5 w-5 text-[#29232D]" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#29232D]">
                Target GPA &amp; Rule Engine
              </h3>
              <p className="text-sm text-[#29232D]/80 leading-relaxed">
                Set semester goals with live marks-based progress bars and configure university retake windows, internal minimums, and replacement rules.
              </p>
            </div>

            <div className="rounded-[20px] border-2 border-[#29232D] bg-white p-6 shadow-[4px_4px_0_#29232D] space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#75B9DF]">
                <BookOpen className="h-5 w-5 text-[#29232D]" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#29232D]">
                Study Library
              </h3>
              <p className="text-sm text-[#29232D]/80 leading-relaxed">
                Store lecture notes, past exam questions, PDFs, and reference links by course with instant search and bookmarking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white border-b-2 border-[#29232D] py-16 lg:py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 space-y-12">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-bold text-[#7955A1]">How It Works</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-[#29232D]">
              Three steps from raw marks to clear academic decisions.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-[20px] border-2 border-[#29232D] bg-[#F5F3F2] p-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl font-extrabold text-[#7955A1] tabular-nums">
                  01
                </span>
                <StepIllustration step={1} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#29232D]">
                  Set Up Your Academic Profile.
                </h3>
                <p className="mt-2 text-sm font-medium text-[#29232D]/80 leading-relaxed">
                  Add your university, department, grading scale, and improvement regulations in seconds.
                </p>
              </div>
            </div>

            <div className="rounded-[20px] border-2 border-[#29232D] bg-[#F5F3F2] p-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl font-extrabold text-[#7955A1] tabular-nums">
                  02
                </span>
                <StepIllustration step={2} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#29232D]">
                  Track Your Courses and Marks.
                </h3>
                <p className="mt-2 text-sm font-medium text-[#29232D]/80 leading-relaxed">
                  Log midterms, attendance, and final exam marks across semesters while keeping study materials linked.
                </p>
              </div>
            </div>

            <div className="rounded-[20px] border-2 border-[#29232D] bg-[#F5F3F2] p-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl font-extrabold text-[#7955A1] tabular-nums">
                  03
                </span>
                <StepIllustration step={3} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#29232D]">
                  Plan, Predict, and Improve.
                </h3>
                <p className="mt-2 text-sm font-medium text-[#29232D]/80 leading-relaxed">
                  Test final exam scenarios, monitor your Target GPA progress bar, and simulate retake gains on CGPA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Final CTA Section */}
      <section id="about" className="bg-[#F8D0CC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-[24px] border-2 border-[#29232D] bg-white p-8 sm:p-12 shadow-[6px_6px_0_#29232D]">
            <div className="lg:col-span-8 space-y-4">
              <p className="font-display text-sm font-bold text-[#7955A1]">
                About GradePath
              </p>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-tight text-[#29232D] [text-wrap:balance]">
                Your Next Academic Milestone Starts Here.
              </h2>
              <p className="text-base text-[#29232D]/80 max-w-2xl leading-relaxed">
                GradePath replaces guesswork and messy spreadsheets with transparent credit-weighted calculations, real university retake rules, and clear planning tools built specifically for university students.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-center gap-3">
              <button
                type="button"
                onClick={() => enterDashboard('dashboard')}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#29232D] bg-[#F6D36B] px-7 py-4 font-display text-base font-bold text-[#29232D] shadow-[4px_4px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#29232D] transition-all whitespace-nowrap"
              >
                Start Your Journey
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="font-display text-sm font-bold text-[#7955A1] hover:text-[#29232D] px-1"
              >
                Or create a new student profile →
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-4 border-t-2 border-[#29232D]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-semibold text-[#29232D]/80">
            <Logo />
            <div className="flex flex-wrap items-center gap-6">
              <a href="#features" className="hover:text-[#7955A1]">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-[#7955A1]">
                How It Works
              </a>
              <a href="#academic-tools" className="hover:text-[#7955A1]">
                Academic Tools
              </a>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="hover:text-[#7955A1]"
              >
                Sign In
              </button>
            </div>
            <p className="text-xs text-[#29232D]/70">
              GradePath Academic Planning Platform
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
}
