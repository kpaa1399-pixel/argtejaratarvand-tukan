
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CommissionManager from './pages/CommissionManager';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard/Commissions" element={<CommissionManager />} />
      </Routes>
    </Router>
  );
}

export default App;
