import { useContext, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, FileText, UserRound, Plus, LogOut, Menu, X, AudioLines } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const links = [
  ['/dashboard', 'Dashboard', LayoutDashboard], ['/interviews', 'Interviews', ClipboardCheck],
  ['/profile#resume', 'Resume & JD', FileText], ['/interview/setup', 'Start Interview', Plus], ['/profile#account', 'Profile', UserRound],
];
export default function AppShell() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const drawer = useRef(null);
  const menuButton = useRef(null);
  const close = () => drawer.current?.close();
  const title = location.pathname.includes('/results') ? 'Interview results' : location.pathname === '/interview/setup' ? 'Interview setup' : location.pathname.startsWith('/interview/') ? 'Interview workspace' : ({'/dashboard':'Overview','/interviews':'Interview history','/profile':'Candidate profile'}[location.pathname] || 'Workspace');
  const navigation = <><Link to="/dashboard" className="brand" onClick={close}><span className="brand-icon"><AudioLines size={23} aria-hidden="true" /></span>Interview<span className="brand-iq">IQ</span></Link><div className="nav-label">YOUR WORKSPACE</div><nav aria-label="Main navigation">{links.map(([path,label,Icon]) => {
    const active = path.includes('#') ? location.pathname === '/profile' && (path.endsWith('#account') ? location.hash === '#account' : location.hash !== '#account') : location.pathname === path;
    return <Link key={path} to={path} onClick={close} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}><Icon size={19} aria-hidden="true" />{label}</Link>;
  })}</nav><div className="sidebar-note"><span className="status-dot" /><span>Practice with purpose.<br /><small>Build confidence, one answer at a time.</small></span></div><div className="sidebar-user"><div className="avatar">{user?.name?.slice(0,1).toUpperCase()}</div><div className="user-details"><strong>{user?.name}</strong><span>Personal workspace</span></div><button className="icon-button" onClick={logout} aria-label="Log out"><LogOut size={18} /></button></div></>;
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a><aside className="sidebar">{navigation}</aside><dialog aria-label="Workspace navigation" ref={drawer} className="mobile-drawer" onClose={() => menuButton.current?.focus()} onClick={e => { if (e.target === drawer.current) close(); }}><button className="icon-button drawer-close" aria-label="Close navigation" onClick={close}><X size={20} /></button>{navigation}</dialog><div className="app-main"><header className="topbar"><div className="topbar-context"><button ref={menuButton} className="icon-button menu-toggle" aria-label="Open navigation" aria-haspopup="dialog" onClick={() => drawer.current.showModal()}><Menu size={21} /></button><span className="muted">Workspace</span><span className="breadcrumb-divider">/</span><strong>{title}</strong></div><Link to="/profile#account" className="header-user" aria-label="View your profile"><span>{user?.name?.split(' ')[0]}</span><span className="avatar">{user?.name?.slice(0,1).toUpperCase()}</span></Link></header><main id="main-content" className="page-content" tabIndex={-1}><Outlet /></main><footer className="app-footer">InterviewIQ <span>Thoughtful preparation. Measurable progress.</span></footer></div></div>;
}

