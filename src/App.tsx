/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SemestersPage } from './pages/SemestersPage';
import { SemesterDetailPage } from './pages/SemesterDetailPage';
import { GradePredictorPage } from './pages/GradePredictorPage';
import { ImprovementPlannerPage } from './pages/ImprovementPlannerPage';
import { MarksTrackerPage } from './pages/MarksTrackerPage';
import { StudyLibraryPage } from './pages/StudyLibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

function GradePathShell() {
  const { surfaceMode, isAuthenticated, activePage } = useAcademic();

  if (surfaceMode === 'landing') {
    return <LandingPage />;
  }

  if (surfaceMode === 'auth' || !isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Layout>
      {activePage === 'dashboard' && <DashboardPage />}
      {activePage === 'semesters' && <SemestersPage />}
      {activePage === 'semester-detail' && <SemesterDetailPage />}
      {activePage === 'predictor' && <GradePredictorPage />}
      {activePage === 'improvement' && <ImprovementPlannerPage />}
      {activePage === 'marks' && <MarksTrackerPage />}
      {activePage === 'library' && <StudyLibraryPage />}
      {activePage === 'settings' && <SettingsPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AcademicProvider>
      <GradePathShell />
    </AcademicProvider>
  );
}
