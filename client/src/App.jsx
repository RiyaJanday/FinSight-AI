import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Login        from "./pages/Login.jsx";
import Signup       from "./pages/Signup.jsx";
import Dashboard    from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Budget       from "./pages/Budget.jsx";
import Goals        from "./pages/Goals.jsx";
import Accounts     from "./pages/Accounts.jsx";
import AIInsights   from "./pages/AIInsights.jsx";
import Reports      from "./pages/Reports.jsx";
import Settings     from "./pages/Settings.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/"             element={<Navigate to="/login" replace />} />
      <Route path="/login"        element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup"       element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/budget"       element={<ProtectedRoute><Budget /></ProtectedRoute>} />
      <Route path="/goals"        element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      <Route path="/accounts"     element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
      <Route path="/ai-insights"  element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
      <Route path="/reports"      element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*"             element={<Navigate to="/login" replace />} />
    </Routes>
  );
}