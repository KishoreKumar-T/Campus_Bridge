import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { api } from './api.js';

const LINKS = {
  student: [
    ['/student', 'Home'],
    ['/student/profile', 'My Profile'],
    ['/student/drives', 'Opportunities'],
    ['/student/applications', 'My Applications'],
    ['/alumni-network', 'Alumni'],
    ['/connections', 'Connections'],
    ['/posts', 'Posts']
  ],
  alumni: [
    ['/alumni/profile', 'My Profile'],
    ['/connections', 'Requests'],
    ['/posts', 'Posts']
  ],
  admin: [
    ['/admin', 'Dashboard'],
    ['/admin/students', 'Students'],
    ['/admin/companies', 'Companies'],
    ['/admin/drives', 'Drives'],
    ['/admin/announcements', 'Announcements'],
    ['/alumni-network', 'Alumni'],
    ['/posts', 'Posts']
  ]
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api('notifications')
      .then((n) => setUnread(n.filter((x) => !+x.is_read).length))
      .catch(() => {});
  }, [loc.pathname]);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark navbar-rec sticky-top">
        <div className="container">
          <NavLink to="/" className="navbar-brand d-flex align-items-center me-4 text-decoration-none">
            <img src="/logo_r.png" alt="REC Logo" className="rec-brand-logo me-2" style={{ height: '42px', padding: '2px' }} />
            <div>
              <div className="fw-bold fs-5 text-white leading-tight">RAJALAKSHMI</div>
              <div className="rec-header-tagline">CareerBridge Placement Portal</div>
            </div>
          </NavLink>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="nav">
            <ul className="navbar-nav me-auto">
              {LINKS[user.role].map(([to, label]) => (
                <li className="nav-item" key={to}>
                  <NavLink end className="nav-link text-white" to={to}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-2">
              <NavLink to="/notifications" className="btn btn-sm btn-outline-warning text-white position-relative border-0 bg-white bg-opacity-10 px-3">
                🔔 Notifications {unread > 0 && <span className="badge bg-warning text-dark ms-1 fw-bold">{unread}</span>}
              </NavLink>

              <div className="text-white small ms-2 me-1">
                <span className="fw-semibold">{user.name}</span>{' '}
                <span className="badge badge-rec-gold text-capitalize ms-1">{user.role}</span>
              </div>

              <button className="btn btn-sm btn-outline-light ms-2" onClick={async () => { await logout(); nav('/login'); }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-4 rec-main-container">{children}</main>
    </>
  );
}
