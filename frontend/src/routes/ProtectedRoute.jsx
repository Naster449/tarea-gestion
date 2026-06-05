import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, token } = useAuth();
  const loc = useLocation();
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return children;
}
