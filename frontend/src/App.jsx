import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRoute from "./routes/RoleRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Empleados from "./pages/Empleados.jsx";
import EmpleadoDetalle from "./pages/EmpleadoDetalle.jsx";
import Asistencia from "./pages/Asistencia.jsx";
import Marcacion from "./pages/Marcacion.jsx";
import SedesConfig from "./pages/SedesConfig.jsx";
import Planillas from "./pages/Planillas.jsx";
import Reportes from "./pages/Reportes.jsx";
import Notificaciones from "./pages/Notificaciones.jsx";
import UsuariosPlanilla from "./pages/UsuariosPlanilla.jsx";
import MarcacionPublica from "./pages/MarcacionPublica.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/marcar" element={<MarcacionPublica />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="empleados" element={<Empleados />} />
        <Route path="empleados/:id" element={<EmpleadoDetalle />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="marcacion" element={<Marcacion />} />
        <Route
          path="asistencia/sedes"
          element={
            <RoleRoute allow={["ADMIN", "RRHH"]}>
              <SedesConfig />
            </RoleRoute>
          }
        />
        <Route path="planillas" element={<Planillas />} />
        <Route
          path="reportes"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <Reportes />
            </RoleRoute>
          }
        />
        <Route path="notificaciones" element={<Notificaciones />} />
        <Route
          path="admin/usuarios"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <UsuariosPlanilla />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
