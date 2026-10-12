import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Notifications from './pages/Notifications.jsx';
import Posts from './pages/Posts.jsx';
import AlumniDirectory from './pages/AlumniDirectory.jsx';
import Connections from './pages/Connections.jsx';
import StudentHome from './pages/StudentHome.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import Drives from './pages/Drives.jsx';
import MyApplications from './pages/MyApplications.jsx';
import AlumniProfile from './pages/AlumniProfile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminStudents from './pages/AdminStudents.jsx';
import AdminCompanies from './pages/AdminCompanies.jsx';
import AdminDrives from './pages/AdminDrives.jsx';
import AdminAnnouncements from './pages/AdminAnnouncements.jsx';

const HOME = { student: '/student', alumni: '/alumni/profile', admin: '/admin' };

// Role-based route guard: wrong role -> sent to their own home page
function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME[user.role]} replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={HOME[user.role]} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={HOME[user.role]} /> : <Register />} />
      <Route path="/" element={<Navigate to={user ? HOME[user.role] : '/login'} />} />

      <Route path="/student" element={<Guard roles={['student']}><StudentHome /></Guard>} />
      <Route path="/student/profile" element={<Guard roles={['student']}><StudentProfile /></Guard>} />
      <Route path="/student/drives" element={<Guard roles={['student']}><Drives /></Guard>} />
      <Route path="/student/applications" element={<Guard roles={['student']}><MyApplications /></Guard>} />

      <Route path="/alumni/profile" element={<Guard roles={['alumni']}><AlumniProfile /></Guard>} />

      <Route path="/admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
      <Route path="/admin/students" element={<Guard roles={['admin']}><AdminStudents /></Guard>} />
      <Route path="/admin/companies" element={<Guard roles={['admin']}><AdminCompanies /></Guard>} />
      <Route path="/admin/drives" element={<Guard roles={['admin']}><AdminDrives /></Guard>} />
      <Route path="/admin/announcements" element={<Guard roles={['admin']}><AdminAnnouncements /></Guard>} />

      {/* shared pages */}
      <Route path="/alumni-network" element={<Guard roles={['student', 'admin']}><AlumniDirectory /></Guard>} />
      <Route path="/connections" element={<Guard roles={['student', 'alumni']}><Connections /></Guard>} />
      <Route path="/posts" element={<Guard><Posts /></Guard>} />
      <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
