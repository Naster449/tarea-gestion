import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RoleRoute({ allow, children }) {
  const { user } = useAuth();
  if (!allow.includes(user?.rol)) {
    return <Navigate to="/marcacion" replace />;
  }
  return children;
}
