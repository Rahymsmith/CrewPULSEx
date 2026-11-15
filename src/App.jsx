import React from 'react';
import { Navigate, Route, Routes } from './router.jsx';
import Shell from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Problem from './pages/Problem.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Profile, Vitals, Behavioral, Sleep } from './pages/CrewPages.jsx';
import { Prediction, Breakdown, Evidence, AlertsCenter, Actions } from './pages/IntelPages.jsx';
import { Simulator, CrewShield, EarthLink } from './pages/MissionSyncPages.jsx';
import { MissionControl, Timeline, Reports, Settings } from './pages/OpsPages.jsx';
import { NervousSystem, RocketJourney } from './pages/MissionVisuals.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/problem" element={<Problem />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="vitals" element={<Vitals />} />
        <Route path="behavioral" element={<Behavioral />} />
        <Route path="nervous-system" element={<NervousSystem />} />
        <Route path="journey" element={<RocketJourney />} />
        <Route path="sleep" element={<Sleep />} />
        <Route path="prediction" element={<Prediction />} />
        <Route path="breakdown" element={<Breakdown />} />
        <Route path="evidence" element={<Evidence />} />
        <Route path="alerts" element={<AlertsCenter />} />
        <Route path="actions" element={<Actions />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="shield" element={<CrewShield />} />
        <Route path="earthlink" element={<EarthLink />} />
        <Route path="mission-control" element={<MissionControl />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
