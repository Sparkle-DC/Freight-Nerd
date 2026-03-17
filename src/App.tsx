import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { FuelDashboard } from './pages/FuelDashboard';
import { ScheduleDetail } from './pages/ScheduleDetail';
import { ClientPortal } from './pages/ClientPortal';
import { LtlHome } from './pages/LtlHome';
import { LtlDashboard } from './pages/LtlDashboard';
import { CarrierHome } from './pages/CarrierHome';
import { CarrierDashboard } from './pages/CarrierDashboard';
import { LandedCostHome } from './pages/LandedCostHome';
import { LandedCostDashboard } from './pages/LandedCostDashboard';
import { DnDHome } from './pages/DnDHome';
import { DnDDashboard } from './pages/DnDDashboard';
import { MatchmakerHome } from './pages/MatchmakerHome';
import { MatchmakerDashboard } from './pages/MatchmakerDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="fuel-dashboard" element={<FuelDashboard />} />
            <Route path="schedule/:id" element={<ScheduleDetail />} />
            <Route path="ltl" element={<LtlHome />} />
            <Route path="ltl-dashboard" element={<LtlDashboard />} />
            <Route path="carrier" element={<CarrierHome />} />
            <Route path="carrier-dashboard" element={<CarrierDashboard />} />
            <Route path="landed-cost" element={<LandedCostHome />} />
            <Route path="landed-cost-dashboard" element={<LandedCostDashboard />} />
            <Route path="dnd" element={<DnDHome />} />
            <Route path="dnd-dashboard" element={<DnDDashboard />} />
            <Route path="matchmaker" element={<MatchmakerHome />} />
            <Route path="matchmaker-dashboard" element={<MatchmakerDashboard />} />
          </Route>
          <Route path="/client/:snapshotId" element={<ClientPortal />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
