import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import {
  Rocket,
  Calendar,
  Users,
  Lightbulb,
  Bell,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  MapPin,
  Clock,
  X,
  Send,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  LayoutDashboard,
  Plus,
  Search,
  Check,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Menu,
  GraduationCap,
  Download,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Camera,
  UserPlus,
  Phone,
} from 'lucide-react';

// =====================================================================
// DATA INTERFACES
// =====================================================================

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  status?: string;
  createdAt?: string;
  lastLoginAt?: string;
  profile?: {
    fullName: string;
    department?: string;
    year?: string;
    college?: string;
    phone?: string;
    bio?: string;
    skills?: string;
  } | null;
}

interface EventItem {
  id: string;
  title: string;
  slug?: string;
  description: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  isOnline?: boolean;
  registrationOpen?: boolean;
  status?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  tags?: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPublished?: boolean;
  publishDate?: string;
  createdAt: string;
}

interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  category?: string;
  department?: string;
  year?: string;
  skills?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

interface BlogItem {
  id: string;
  title: string;
  excerpt?: string;
  summary?: string;
  content?: string;
  category?: string;
  authorName: string;
  tags?: string;
  views?: number;
  publishedAt: string;
}

interface IdeaItem {
  id: string;
  userId: string;
  title: string;
  category?: string;
  problem: string;
  proposedSolution: string;
  targetUsers?: string;
  market?: string;
  businessModel?: string;
  currentStage?: string;
  teamMembers?: string;
  expectedImpact?: string;
  documentUrl?: string | null;
  status: string;
  adminFeedback?: string | null;
  mentorAssigned?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    profile?: {
      fullName: string;
      department?: string;
      year?: string;
      phone?: string;
      college?: string;
    } | null;
  };
}

interface RegistrationItem {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  ticketCode: string;
  createdAt: string;
  event?: {
    id: string;
    title: string;
    date: string;
    venue: string;
    eventType: string;
  };
  user?: {
    id: string;
    email: string;
    profile?: {
      fullName: string;
      department?: string;
      year?: string;
      phone?: string;
    } | null;
  };
}

// API Base Configuration: Supports VITE_API_BASE_URL for production deployments while defaulting to relative '/api' for local dev proxy
const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE = rawApiBase
  ? rawApiBase.endsWith('/api')
    ? rawApiBase
    : `${rawApiBase.replace(/\/+$/, '')}/api`
  : '/api';

// =====================================================================
// COMPONENT 1: DEDICATED ADMIN LOGIN PAGE (/admin/login)
// Inspired by reference: https://strapi-50046713914.development.catalystappsail.in/admin
// =====================================================================

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated as admin, redirect directly to dashboard
  useEffect(() => {
    const token = localStorage.getItem('ecell_token');
    if (token) {
      fetch(`${API_BASE}/admin/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => {
          const role = data.data?.admin?.role || data.data?.role;
          if (['ADMIN', 'COORDINATOR'].includes(role)) {
            navigate('/admin/dashboard', { replace: true });
          }
        })
        .catch(() => {
          // Token expired or invalid, keep on login page
        });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Invalid administrator email or password.');
        setIsSubmitting(false);
        return;
      }

      const admin = data.data?.admin || data.data?.user;
      const role = admin?.role;

      // Enforce strict administrator permissions: only ADMIN and COORDINATOR allowed
      if (role !== 'ADMIN' && role !== 'COORDINATOR') {
        setErrorMessage(
          'Access Denied: Account lacks institutional administrator privileges. Only authorized staff may enter.'
        );
        setIsSubmitting(false);
        return;
      }

      // Store authenticated credentials securely
      localStorage.setItem('ecell_token', data.data.token);
      localStorage.setItem('ecell_admin', JSON.stringify(admin));
      localStorage.setItem(
        'ecell_user',
        JSON.stringify({
          id: admin.id,
          email: admin.email,
          role: admin.role,
          profile: { fullName: admin.name || admin.profile?.fullName },
        })
      );
      navigate('/admin/dashboard', { replace: true });
    } catch {
      setErrorMessage('Connection failed: Unable to reach the authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-body">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <div className="admin-login-logo" style={{ overflow: 'hidden', padding: 0, background: '#FFFFFF' }}>
            <img src="/images/ecell-logo.jpeg" alt="Sandip E-Cell SITRC Official Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="admin-login-brand-title">
            E-Cell <span>SITRC</span>
          </div>
          <h1 className="admin-login-heading">Administrative Control Center</h1>
          <p className="admin-login-subtitle">Sign in to manage E-Cell SITRC activities.</p>
        </div>

        {errorMessage && (
          <div className="admin-login-error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} id="adminLoginForm">
          <div className="admin-login-form-group">
            <label htmlFor="adminEmail">Administrator Email</label>
            <div className="admin-login-input-wrapper">
              <input
                type="email"
                id="adminEmail"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ecell.org"
                className="admin-login-input"
              />
            </div>
          </div>

          <div className="admin-login-form-group">
            <label htmlFor="adminPassword">Security Password</label>
            <div className="admin-login-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="adminPassword"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="admin-login-input"
              />
              <button
                type="button"
                className="admin-login-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="admin-login-submit-btn">
            <Lock size={16} />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Control Center'}</span>
          </button>
        </form>

        <div className="admin-login-helper">
          <div style={{ fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Protected Administrator Access</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#047857', lineHeight: 1.4 }}>
            Role-based access enforcement active. Only authorized administrators and coordinators may sign in.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" className="admin-login-back-link">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// COMPONENT 2: STRAPI-INSPIRED ADMIN DASHBOARD (/admin/dashboard)
// =====================================================================

function AdminDashboard() {
  const navigate = useNavigate();
  const [adminSection, setAdminSection] = useState<
    'dashboard' | 'events' | 'registrations' | 'startups' | 'team' | 'announcements' | 'blogs' | 'settings'
  >('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('ecell_token'));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Real data collections
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [ideaStatusFilter, setIdeaStatusFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [reviewingIdea, setReviewingIdea] = useState<IdeaItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState('UNDER_REVIEW');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('WORKSHOP');
  const [newEventDate, setNewEventDate] = useState('2026-11-15');
  const [newEventStartTime, setNewEventStartTime] = useState('10:00 AM');
  const [newEventEndTime, setNewEventEndTime] = useState('01:00 PM');
  const [newEventVenue, setNewEventVenue] = useState('SIEM Innovation Lab');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventCapacity, setNewEventCapacity] = useState(60);

  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState('General');
  const [newAnnPriority, setNewAnnPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamRole, setNewTeamRole] = useState('Coordinator');
  const [newTeamCategory, setNewTeamCategory] = useState('CORE_COORDINATOR');
  const [newTeamDept, setNewTeamDept] = useState('Computer Engineering');
  const [newTeamYear, setNewTeamYear] = useState('TE');
  const [newTeamBio, setNewTeamBio] = useState('');
  const [newTeamSkills, setNewTeamSkills] = useState('');

  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogExcerpt, setNewBlogExcerpt] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState('Startup Journey');
  const [newBlogTags, setNewBlogTags] = useState('Entrepreneurship, Incubation');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Scroll to top on section switch
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [adminSection]);

  // Route Protection: Validate administrator token on mount
  useEffect(() => {
    const token = localStorage.getItem('ecell_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    fetch(`${API_BASE}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        const adminData = data.data?.admin || data.data;
        const role = adminData?.role;
        if (!['ADMIN', 'COORDINATOR'].includes(role)) {
          localStorage.removeItem('ecell_token');
          localStorage.removeItem('ecell_admin');
          localStorage.removeItem('ecell_user');
          navigate('/admin/login', { replace: true });
          return;
        }
        setUser({
          id: adminData.id,
          email: adminData.email,
          role: adminData.role,
          profile: {
            fullName: adminData.name || adminData.profile?.fullName || adminData.email,
          },
        });
        setAuthToken(token);
        setIsLoadingAuth(false);
        fetchRealData(token);
      })
      .catch(() => {
        localStorage.removeItem('ecell_token');
        localStorage.removeItem('ecell_admin');
        localStorage.removeItem('ecell_user');
        navigate('/admin/login', { replace: true });
      });
  }, [navigate]);

  // Fetch real data from backend
  const fetchRealData = async (token: string) => {
    try {
      const healthRes = await fetch(`${API_BASE}/health`).catch(() => null);
      if (!healthRes || !healthRes.ok) {
        console.warn('Backend API connection degraded.');
      }

      const [evRes, annRes, teamRes, blogRes, ideasRes] = await Promise.all([
        fetch(`${API_BASE}/events`).catch(() => null),
        fetch(`${API_BASE}/announcements`).catch(() => null),
        fetch(`${API_BASE}/team`).catch(() => null),
        fetch(`${API_BASE}/blogs`).catch(() => null),
        fetch(`${API_BASE}/ideas`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      if (evRes && evRes.ok) {
        const evData = await evRes.json();
        const evList: EventItem[] = evData.data?.events || evData.data || [];
        setEvents(evList);
        if (evList.length > 0 && !selectedEventId) {
          setSelectedEventId(evList[0].id);
          fetchRegistrations(evList[0].id, token);
        }
      }

      if (annRes && annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData.data || []);
      }

      if (teamRes && teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData.data || []);
      }

      if (blogRes && blogRes.ok) {
        const blogData = await blogRes.json();
        setBlogs(Array.isArray(blogData.data) ? blogData.data : blogData.data?.blogs || []);
      }

      if (ideasRes && ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setIdeas(ideasData.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const fetchRegistrations = async (eventId: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE}/registrations/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('ecell_token');
      if (token) {
        await fetch(`${API_BASE}/admin/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
      }
    } finally {
      localStorage.removeItem('ecell_token');
      localStorage.removeItem('ecell_admin');
      localStorage.removeItem('ecell_user');
      setAuthToken(null);
      setUser(null);
      navigate('/admin/login', { replace: true });
    }
  };

  // --- Real Database Actions ---

  // 1. Review Startup Idea
  const handleReviewIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingIdea || !authToken) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/ideas/${reviewingIdea.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          adminFeedback: reviewFeedback,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Idea "${reviewingIdea.title}" status updated to ${reviewStatus}`);
        setReviewingIdea(null);
        fetchRealData(authToken);
      } else {
        showToast(data.message || 'Failed to review idea');
      }
    } catch {
      showToast('Error communicating with server');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // 2. Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: newEventTitle,
          eventType: newEventType,
          date: new Date(newEventDate).toISOString(),
          startTime: newEventStartTime,
          endTime: newEventEndTime,
          venue: newEventVenue,
          description: newEventDesc,
          maxParticipants: Number(newEventCapacity),
          registrationDeadline: new Date(newEventDate).toISOString(),
          organizer: 'E-Cell SITRC',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('New event created and published to public website!');
        setShowCreateEventModal(false);
        setNewEventTitle('');
        setNewEventDesc('');
        fetchRealData(authToken);
      } else {
        showToast(data.message || 'Failed to create event');
      }
    } catch {
      showToast('Error creating event');
    }
  };

  // 3. Toggle Event Registration Status
  const handleToggleEventStatus = async (event: EventItem) => {
    if (!authToken) return;
    const nextStatus = event.status === 'REGISTRATION_OPEN' ? 'REGISTRATION_CLOSED' : 'REGISTRATION_OPEN';
    try {
      const res = await fetch(`${API_BASE}/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Event status updated to ${nextStatus.replace('_', ' ')}`);
        fetchRealData(authToken);
      }
    } catch {
      showToast('Failed to toggle status');
    }
  };

  // 4. Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!authToken || !window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        showToast('Event removed from platform');
        fetchRealData(authToken);
      }
    } catch {
      showToast('Failed to delete event');
    }
  };

  // 5. Update Registration Attendance Status
  const handleUpdateRegStatus = async (regId: string, status: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/registrations/${regId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast(`Registration marked as ${status}`);
        if (selectedEventId) fetchRegistrations(selectedEventId, authToken);
      }
    } catch {
      showToast('Failed to update status');
    }
  };

  // 6. Broadcast Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: newAnnTitle,
          content: newAnnContent,
          category: newAnnCategory,
          priority: newAnnPriority,
          isPublished: true,
        }),
      });
      if (res.ok) {
        showToast('Notice broadcasted to public campus board!');
        setShowCreateAnnouncementModal(false);
        setNewAnnTitle('');
        setNewAnnContent('');
        fetchRealData(authToken);
      }
    } catch {
      showToast('Failed to broadcast notice');
    }
  };

  // 7. Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!authToken || !window.confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`${API_BASE}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        showToast('Announcement deleted');
        fetchRealData(authToken);
      }
    } catch {
      showToast('Failed to delete announcement');
    }
  };

  // 8. Add Team Member
  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newTeamName,
          role: newTeamRole,
          category: newTeamCategory,
          department: newTeamDept,
          year: newTeamYear,
          bio: newTeamBio,
          skills: newTeamSkills,
        }),
      });
      if (res.ok) {
        showToast('Member added to public leadership directory!');
        setShowCreateTeamModal(false);
        setNewTeamName('');
        setNewTeamBio('');
        setNewTeamSkills('');
        fetchRealData(authToken);
      }
    } catch {
      showToast('Failed to add team member');
    }
  };

  // 9. Delete Team Member
  const handleDeleteTeamMember = async (id: string) => {
    if (!authToken || !window.confirm('Remove this member?')) return;
    try {
      const res = await fetch(`${API_BASE}/team/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        showToast('Member removed from directory');
        fetchRealData(authToken);
      }
    } catch {
      showToast('Failed to remove member');
    }
  };

  // 10. Publish Blog
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: newBlogTitle,
          excerpt: newBlogExcerpt,
          content: newBlogContent,
          category: newBlogCategory,
          tags: newBlogTags,
          isPublished: true,
        }),
      });
      if (res.ok) {
        showToast('Story published to knowledge hub!');
        setShowCreateBlogModal(false);
        setNewBlogTitle('');
        setNewBlogExcerpt('');
        setNewBlogContent('');
        fetchRealData(authToken);
      }
    } catch {
      showToast('Failed to publish story');
    }
  };

  // 11. Delete Blog
  const handleDeleteBlog = async (id: string) => {
    if (!authToken || !window.confirm('Delete this story?')) return;
    try {
      const res = await fetch(`${API_BASE}/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        showToast('Story removed');
        fetchRealData(authToken);
      }
    } catch {
      showToast('Failed to delete story');
    }
  };

  // Filtered queries
  const filteredIdeas = ideas.filter((idea) => {
    const matchesFilter = ideaStatusFilter === 'ALL' || idea.status === ideaStatusFilter;
    const matchesSearch =
      !searchQuery ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.problem?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.user?.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredEvents = events.filter((ev) => {
    const matchesFilter = eventFilter === 'ALL' || ev.eventType === eventFilter;
    const matchesSearch =
      !searchQuery ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredRegistrations = registrations.filter((reg) => {
    return (
      !searchQuery ||
      reg.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.user?.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderStatusBadge = (status: string) => {
    const lower = status.toLowerCase().replace(/_/g, '-');
    return <span className={`status-pill status-${lower}`}>{status.replace(/_/g, ' ')}</span>;
  };

  if (isLoadingAuth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-indicator" style={{ width: '14px', height: '14px', marginBottom: '12px' }} />
          <div style={{ fontWeight: 600 }}>Verifying Institutional Privileges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-portal">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 500,
            fontSize: '0.9rem',
            border: '1px solid #334155',
          }}
        >
          <Sparkles size={16} color="#818cf8" />
          {toastMessage}
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* 1. ADMIN SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand" onClick={() => setAdminSection('dashboard')}>
            <div className="admin-logo-box" style={{ overflow: 'hidden', padding: 0, background: '#FFFFFF' }}>
              <img src="/images/ecell-logo.jpeg" alt="Sandip E-Cell SITRC Official Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="admin-brand-title">E-Cell SITRC</div>
              <div className="admin-brand-subtitle">Administrative Portal</div>
            </div>
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              style={{ padding: '4px' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="admin-sidebar-nav">
          <div className="admin-nav-category">Main Control</div>
          <button
            onClick={() => {
              setAdminSection('dashboard');
              setSidebarOpen(false);
            }}
            className={`admin-nav-item ${adminSection === 'dashboard' ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <LayoutDashboard size={17} />
              <span>Dashboard Overview</span>
            </div>
          </button>

          <div className="admin-nav-category">Operations</div>
          <button
            onClick={() => {
              setAdminSection('events');
              setSidebarOpen(false);
            }}
            className={`admin-nav-item ${adminSection === 'events' ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <Calendar size={17} />
              <span>Events & Summits</span>
            </div>
            <span className="admin-nav-counter">{events.length}</span>
          </button>

          <button
            onClick={() => {
              setAdminSection('registrations');
              setSidebarOpen(false);
            }}
            className={`admin-nav-item ${adminSection === 'registrations' ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <GraduationCap size={17} />
              <span>Student Registrations</span>
            </div>
            <span className="admin-nav-counter">{registrations.length}</span>
          </button>

          <button
            onClick={() => {
              setAdminSection('startups');
              setSidebarOpen(false);
            }}
            className={`admin-nav-item ${adminSection === 'startups' ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <Lightbulb size={17} />
              <span>Startups & Ideas</span>
            </div>
            <span className="admin-nav-counter">{ideas.length}</span>
          </button>

          <button
            onClick={() => {
              setAdminSection('team');
              setSidebarOpen(false);
            }}
            className={`admin-nav-item ${adminSection === 'team' ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <Users size={17} />
              <span>Core Team Directory</span>
            </div>
            <span className="admin-nav-counter">{teamMembers.length}</span>
          </button>

          <button
            onClick={() => {
              setAdminSection('announcements');
              setSidebarOpen(false);
            }}
            className={`admin-nav-item ${adminSection === 'announcements' ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <Bell size={17} />
              <span>Notices & Broadcasts</span>
            </div>
            <span className="admin-nav-counter">{announcements.length}</span>
          </button>

          <button
            onClick={() => {
              setAdminSection('blogs');
              setSidebarOpen(false);
            }}
            className={`admin-nav-item ${adminSection === 'blogs' ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <BookOpen size={17} />
              <span>Blogs and Media</span>
            </div>
            <span className="admin-nav-counter">{blogs.length}</span>
          </button>

          <div className="admin-nav-category">System</div>
          <button
            onClick={() => {
              setAdminSection('settings');
              setSidebarOpen(false);
            }}
            className={`admin-nav-item ${adminSection === 'settings' ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <Settings size={17} />
              <span>Admin Settings</span>
            </div>
          </button>

          <Link to="/" className="admin-nav-item" style={{ marginTop: '8px' }}>
            <div className="admin-nav-item-left">
              <ExternalLink size={17} />
              <span>View Public Site</span>
            </div>
          </Link>
        </div>

        {/* Sidebar Footer with Logged-in Admin Profile */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-user-avatar">
              {user?.profile?.fullName?.charAt(0) || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.profile?.fullName || user?.email}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600 }}>
                {user?.role} • E-Cell SITRC
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              style={{ padding: '6px' }}
              title="Sign Out of Admin Portal"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. ADMIN MAIN WRAPPER */}
      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              title="Toggle Menu"
            >
              <Menu size={16} />
            </button>

            <div className="admin-breadcrumb-brand">
              <span>E-Cell SITRC</span>
              <span className="admin-breadcrumb-divider">/</span>
              <span className="admin-breadcrumb-section">
                {adminSection === 'dashboard' && 'Administrative Control Center'}
                {adminSection === 'events' && 'Events & Summits'}
                {adminSection === 'registrations' && 'Student Registrations'}
                {adminSection === 'startups' && 'Startups & Ideas'}
                {adminSection === 'team' && 'Core Team Directory'}
                {adminSection === 'announcements' && 'Notices & Broadcasts'}
                {adminSection === 'blogs' && 'Blogs and Media'}
                {adminSection === 'settings' && 'Admin Settings'}
              </span>
            </div>
          </div>

          <div className="admin-search-box">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search records, students, events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="admin-topbar-right">
            <button
              onClick={() => setShowCreateEventModal(true)}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              <Plus size={14} />
              <span>New Event</span>
            </button>

            <Link to="/" className="admin-btn admin-btn-secondary admin-btn-sm" title="View Public Website">
              <ExternalLink size={14} />
              <span>Public Site</span>
            </Link>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="admin-body-container">
          {/* SECTION 1: DASHBOARD OVERVIEW */}
          {adminSection === 'dashboard' && (
            <div>
              <div className="admin-heading-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-brand-tag">
                    <Rocket size={13} />
                    E-Cell SITRC
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    • Sandip Institute of Technology and Research Centre
                  </span>
                </div>

                <h1 className="admin-main-heading">Administrative Control Center</h1>

                <p className="admin-subtitle">
                  Manage events, students, teams, startups, and campus entrepreneurship activities.
                </p>
              </div>

              {/* Metadata Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                  padding: '12px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: '#475569' }}>
                  <span>📍 <strong>Campus:</strong> SITRC Nashik</span>
                  <span>🏛️ <strong>Council:</strong> Institutional Innovation Council (IIC)</span>
                  <span>📅 <strong>Session:</strong> Academic Year 2026-27</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => authToken && fetchRealData(authToken)} className="admin-btn admin-btn-secondary admin-btn-sm">
                    <RefreshCw size={13} />
                    Refresh Data
                  </button>
                  <button onClick={() => setShowCreateAnnouncementModal(true)} className="admin-btn admin-btn-primary admin-btn-sm">
                    <Plus size={13} />
                    Broadcast Notice
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Flagship Events</span>
                    <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                      <Calendar size={18} />
                    </div>
                  </div>
                  <div className="admin-stat-value">{events.length}</div>
                  <div className="admin-stat-footer">
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Active</span> • Summits, Workshops & Hackathons
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Startups & Ideas</span>
                    <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                      <Lightbulb size={18} />
                    </div>
                  </div>
                  <div className="admin-stat-value">{ideas.length}</div>
                  <div className="admin-stat-footer">
                    <span style={{ color: '#d97706', fontWeight: 600 }}>
                      {ideas.filter((i) => ['SUBMITTED', 'UNDER_REVIEW'].includes(i.status)).length} Pending
                    </span>{' '}
                    • Incubation proposals
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Core Team & Mentors</span>
                    <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="admin-stat-value">{teamMembers.length}</div>
                  <div className="admin-stat-footer">
                    <span style={{ color: '#059669', fontWeight: 600 }}>Leadership</span> • Faculty & Student Leads
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Official Broadcasts</span>
                    <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                      <Bell size={18} />
                    </div>
                  </div>
                  <div className="admin-stat-value">{announcements.length}</div>
                  <div className="admin-stat-footer">
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Published</span> • Campus Bulletins & Notices
                  </div>
                </div>
              </div>

              {/* Startup Pipeline & Events Tables */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <div className="admin-card-title">Incubation Pipeline</div>
                      <div className="admin-card-desc">Review student innovations submitted to E-Cell SITRC</div>
                    </div>
                    <button onClick={() => setAdminSection('startups')} className="admin-btn admin-btn-secondary admin-btn-sm">
                      View All
                    </button>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Startup Name</th>
                          <th>Student Founder</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ideas.slice(0, 5).map((idea) => (
                          <tr key={idea.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{idea.title}</div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{idea.problem.slice(0, 50)}...</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{idea.user?.profile?.fullName || idea.user?.email}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{idea.user?.profile?.department || 'Engg'}</div>
                            </td>
                            <td>{renderStatusBadge(idea.status)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setReviewingIdea(idea);
                                  setReviewStatus(idea.status);
                                  setReviewFeedback(idea.adminFeedback || '');
                                }}
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                              >
                                <Edit3 size={13} />
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <div className="admin-card-title">Campus Events & Summits</div>
                      <div className="admin-card-desc">Active hackathons, bootcamps & pitch arenas</div>
                    </div>
                    <button onClick={() => setShowCreateEventModal(true)} className="admin-btn admin-btn-primary admin-btn-sm">
                      <Plus size={13} />
                      Add Event
                    </button>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Event Title</th>
                          <th>Schedule</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.slice(0, 5).map((ev) => (
                          <tr key={ev.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{ev.title}</div>
                              <span className="status-pill status-normal" style={{ fontSize: '0.68rem', marginTop: '4px' }}>
                                {ev.eventType}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem' }}>
                              <div>📅 {new Date(ev.date).toLocaleDateString()}</div>
                              <div style={{ color: '#64748b' }}>📍 {ev.venue}</div>
                            </td>
                            <td>{renderStatusBadge(ev.status || (ev.registrationOpen ? 'REGISTRATION_OPEN' : 'CLOSED'))}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleToggleEventStatus(ev)}
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                              >
                                {ev.status === 'REGISTRATION_OPEN' ? 'Close Reg' : 'Open Reg'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: EVENTS & SUMMITS */}
          {adminSection === 'events' && (
            <div>
              <div className="admin-heading-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-brand-tag">
                    <Rocket size={13} />
                    E-Cell SITRC
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    • Administrative Control Center
                  </span>
                </div>
                <h1 className="admin-main-heading">Events & Summits Management</h1>
                <p className="admin-subtitle">
                  Curate summits, schedule workshops, set attendance caps, and manage participant registrations.
                </p>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-title">All Flagship Events ({events.length})</div>
                    <div className="admin-card-desc">Published events directly rendered on the public website</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['ALL', 'WORKSHOP', 'HACKATHON', 'COMPETITION', 'SEMINAR'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setEventFilter(cat)}
                        className="admin-btn admin-btn-sm"
                        style={{
                          backgroundColor: eventFilter === cat ? '#4f46e5' : '#f8fafc',
                          color: eventFilter === cat ? '#ffffff' : '#475569',
                          border: `1px solid ${eventFilter === cat ? '#4338ca' : '#cbd5e1'}`,
                        }}
                      >
                        {cat === 'ALL' ? 'All Types' : cat}
                      </button>
                    ))}
                    <button onClick={() => setShowCreateEventModal(true)} className="admin-btn admin-btn-primary admin-btn-sm">
                      <Plus size={14} />
                      Create New Event
                    </button>
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Event Name</th>
                        <th>Category</th>
                        <th>Date & Time</th>
                        <th>Venue</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((ev) => (
                        <tr key={ev.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{ev.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{ev.description.slice(0, 85)}...</div>
                          </td>
                          <td>
                            <span className="status-pill status-normal">{ev.eventType}</span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            <div>{new Date(ev.date).toLocaleDateString()}</div>
                            <div style={{ color: '#64748b' }}>{ev.startTime} - {ev.endTime}</div>
                          </td>
                          <td>{ev.venue}</td>
                          <td>{renderStatusBadge(ev.status || (ev.registrationOpen ? 'REGISTRATION_OPEN' : 'CLOSED'))}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => handleToggleEventStatus(ev)}
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                              >
                                {ev.status === 'REGISTRATION_OPEN' ? 'Close Reg' : 'Open Reg'}
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="admin-btn admin-btn-danger admin-btn-sm"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: STUDENT REGISTRATIONS */}
          {adminSection === 'registrations' && (
            <div>
              <div className="admin-heading-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-brand-tag">
                    <Rocket size={13} />
                    E-Cell SITRC
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    • Administrative Control Center
                  </span>
                </div>
                <h1 className="admin-main-heading">Student Event Registrations</h1>
                <p className="admin-subtitle">
                  Inspect verified student registrations, update attendance statuses, and export participant rosters.
                </p>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div>
                      <div className="admin-card-title">Attendee Roster</div>
                      <div className="admin-card-desc">Verified registrations from actual students</div>
                    </div>
                    <select
                      value={selectedEventId}
                      onChange={(e) => {
                        setSelectedEventId(e.target.value);
                        if (authToken) fetchRegistrations(e.target.value, authToken);
                      }}
                      className="admin-select"
                      style={{ maxWidth: '280px', padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEventId && (
                    <a
                      href={`${API_BASE}/registrations/event/${selectedEventId}/export`}
                      download
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      <Download size={14} />
                      Export CSV Roster
                    </a>
                  )}
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Ticket Code</th>
                        <th>Student Attendee</th>
                        <th>Email & Phone</th>
                        <th>Department & Year</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                            No registration records found for this event.
                          </td>
                        </tr>
                      ) : (
                        filteredRegistrations.map((reg) => (
                          <tr key={reg.id}>
                            <td>
                              <code style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                {reg.ticketCode}
                              </code>
                            </td>
                            <td style={{ fontWeight: 600 }}>{reg.user?.profile?.fullName || 'Student'}</td>
                            <td style={{ fontSize: '0.82rem' }}>
                              <div>{reg.user?.email}</div>
                              <div style={{ color: '#64748b' }}>{reg.user?.profile?.phone}</div>
                            </td>
                            <td style={{ fontSize: '0.82rem' }}>
                              <div>{reg.user?.profile?.department || 'Engineering'}</div>
                              <div style={{ color: '#64748b' }}>Year: {reg.user?.profile?.year || 'N/A'}</div>
                            </td>
                            <td>{renderStatusBadge(reg.status)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleUpdateRegStatus(reg.id, 'ATTENDED')}
                                  className="admin-btn admin-btn-secondary admin-btn-sm"
                                  title="Mark student as present"
                                >
                                  Mark Attended
                                </button>
                                <button
                                  onClick={() => handleUpdateRegStatus(reg.id, 'CANCELLED')}
                                  className="admin-btn admin-btn-danger admin-btn-sm"
                                  title="Cancel registration"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: STARTUPS & IDEAS */}
          {adminSection === 'startups' && (
            <div>
              <div className="admin-heading-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-brand-tag">
                    <Rocket size={13} />
                    E-Cell SITRC
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    • Administrative Control Center
                  </span>
                </div>
                <h1 className="admin-main-heading">Startups & Incubation Pipeline</h1>
                <p className="admin-subtitle">
                  Review student business models, assign mentors, and evaluate ideas for seed incubation grants.
                </p>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-title">Incubation Applications ({ideas.length})</div>
                    <div className="admin-card-desc">Submitted business models and prototypes</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setIdeaStatusFilter(st)}
                        className="admin-btn admin-btn-sm"
                        style={{
                          backgroundColor: ideaStatusFilter === st ? '#4f46e5' : '#f8fafc',
                          color: ideaStatusFilter === st ? '#ffffff' : '#475569',
                          border: `1px solid ${ideaStatusFilter === st ? '#4338ca' : '#cbd5e1'}`,
                        }}
                      >
                        {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Startup Project Title</th>
                        <th>Founder Student</th>
                        <th>Department & Year</th>
                        <th>Status</th>
                        <th>Admin Review Feedback</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIdeas.map((idea) => (
                        <tr key={idea.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{idea.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                              <strong>Problem:</strong> {idea.problem}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '2px' }}>
                              <strong>Solution:</strong> {idea.proposedSolution}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{idea.user?.profile?.fullName || idea.user?.email}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{idea.user?.email}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{idea.user?.profile?.phone}</div>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            <div>{idea.user?.profile?.department || 'Engg'}</div>
                            <div style={{ color: '#64748b' }}>Year: {idea.user?.profile?.year || 'N/A'}</div>
                          </td>
                          <td>{renderStatusBadge(idea.status)}</td>
                          <td style={{ fontSize: '0.82rem', color: idea.adminFeedback ? '#1e293b' : '#94a3b8' }}>
                            {idea.adminFeedback || 'No feedback yet'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setReviewingIdea(idea);
                                setReviewStatus(idea.status);
                                setReviewFeedback(idea.adminFeedback || '');
                              }}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                            >
                              <Edit3 size={13} />
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: CORE TEAM DIRECTORY */}
          {adminSection === 'team' && (
            <div>
              <div className="admin-heading-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-brand-tag">
                    <Rocket size={13} />
                    E-Cell SITRC
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    • Administrative Control Center
                  </span>
                </div>
                <h1 className="admin-main-heading">Core Leadership & Mentors Directory</h1>
                <p className="admin-subtitle">
                  Manage student domain leads, faculty conveners, and incubator mentors visible on the public site.
                </p>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-title">Leadership Members ({teamMembers.length})</div>
                    <div className="admin-card-desc">Active members of the Sandip Foundation E-Cell Board</div>
                  </div>
                  <button onClick={() => setShowCreateTeamModal(true)} className="admin-btn admin-btn-primary">
                    <Plus size={15} />
                    Add Member
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Member Name</th>
                        <th>Role</th>
                        <th>Category</th>
                        <th>Department & Year</th>
                        <th>Skills</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                            {m.bio && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.bio}</div>}
                          </td>
                          <td>
                            <span className="status-pill status-normal" style={{ fontWeight: 700 }}>
                              {m.role}
                            </span>
                          </td>
                          <td>{m.category || 'Core'}</td>
                          <td style={{ fontSize: '0.82rem' }}>
                            <div>{m.department}</div>
                            <div style={{ color: '#64748b' }}>{m.year}</div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#475569' }}>{m.skills || '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteTeamMember(m.id)}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: NOTICES & BROADCASTS */}
          {adminSection === 'announcements' && (
            <div>
              <div className="admin-heading-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-brand-tag">
                    <Rocket size={13} />
                    E-Cell SITRC
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    • Administrative Control Center
                  </span>
                </div>
                <h1 className="admin-main-heading">Official Notices & Campus Bulletins</h1>
                <p className="admin-subtitle">
                  Post official broadcasts, event timetables, and recruitment alerts to all student boards.
                </p>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-title">Campus Announcements ({announcements.length})</div>
                    <div className="admin-card-desc">Notices published to the public notice board</div>
                  </div>
                  <button onClick={() => setShowCreateAnnouncementModal(true)} className="admin-btn admin-btn-primary">
                    <Plus size={15} />
                    Broadcast New Notice
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Headline</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Broadcast Date</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.map((ann) => (
                        <tr key={ann.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{ann.title}</div>
                            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                              {ann.content}
                            </div>
                          </td>
                          <td>
                            <span className="status-pill status-normal">{ann.category}</span>
                          </td>
                          <td>{renderStatusBadge(ann.priority)}</td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: BLOGS AND MEDIA */}
          {adminSection === 'blogs' && (
            <div>
              <div className="admin-heading-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-brand-tag">
                    <Rocket size={13} />
                    E-Cell SITRC
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    • Administrative Control Center
                  </span>
                </div>
                <h1 className="admin-main-heading">Blogs and Founder Stories</h1>
                <p className="admin-subtitle">
                  Publish startup case studies, interview breakdowns, and incubation guides.
                </p>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-title">Published Articles ({blogs.length})</div>
                    <div className="admin-card-desc">Editorial stories rendered on the public knowledge hub</div>
                  </div>
                  <button onClick={() => setShowCreateBlogModal(true)} className="admin-btn admin-btn-primary">
                    <Plus size={15} />
                    Publish New Story
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title & Summary</th>
                        <th>Category</th>
                        <th>Author</th>
                        <th>Published Date</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.summary || b.excerpt}</div>
                          </td>
                          <td>
                            <span className="status-pill status-normal">{b.category || 'Article'}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{b.authorName}</td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(b.publishedAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteBlog(b.id)}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: ADMIN SETTINGS */}
          {adminSection === 'settings' && (
            <div>
              <div className="admin-heading-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-brand-tag">
                    <Rocket size={13} />
                    E-Cell SITRC
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    • Administrative Control Center
                  </span>
                </div>
                <h1 className="admin-main-heading">Institutional Administration Settings</h1>
                <p className="admin-subtitle">
                  Account profile details, role-based access matrix, server configuration, and administrative audits.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div className="admin-card-title">Administrator Profile</div>
                  </div>
                  <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Full Name</span>
                      <strong>{user?.profile?.fullName || 'Institutional Administrator'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Institutional Email</span>
                      <strong>{user?.email}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Privilege Level (Role)</span>
                      <span className="status-pill status-accepted">{user?.role}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Department & Designation</span>
                      <span>{user?.profile?.department || 'Dean - Innovation & Incubation'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Campus & Affiliation</span>
                      <span>Sandip Institute of Technology and Research Centre (SITRC)</span>
                    </div>
                    <button onClick={handleLogout} className="admin-btn admin-btn-danger" style={{ marginTop: '10px' }}>
                      <LogOut size={15} />
                      Log Out of Admin Panel
                    </button>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-header">
                    <div className="admin-card-title">Security & Role Matrix</div>
                  </div>
                  <div style={{ padding: '22px', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                    <p style={{ marginBottom: '10px' }}>
                      The platform enforces backend authorization on all administrative endpoints using JWT with signed HMAC SHA-256 tokens and Bcrypt password hashing.
                    </p>
                    <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>
                        <strong>ADMIN:</strong> Full control over events, ideas evaluation, team leads, notices, registrations, and database operations.
                      </li>
                      <li>
                        <strong>COORDINATOR:</strong> Can publish events, update registration attendance, broadcast notices, and review ideas.
                      </li>
                      <li>
                        <strong>STUDENT:</strong> Public website participant access, event registration, and startup idea submission. Forbidden from administrative endpoints.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}

      {/* Review Startup Idea Modal */}
      {reviewingIdea && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog">
            <div className="admin-modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Review Startup: {reviewingIdea.title}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Submitted by {reviewingIdea.user?.profile?.fullName || reviewingIdea.user?.email}
                </div>
              </div>
              <button onClick={() => setReviewingIdea(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReviewIdeaSubmit}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="admin-form-label">Sector / Domain</label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {reviewingIdea.category || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="admin-form-label">Current Stage</label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {reviewingIdea.currentStage || 'Ideation'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="admin-form-label">Problem Statement</label>
                  <p style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {reviewingIdea.problem}
                  </p>
                </div>

                <div>
                  <label className="admin-form-label">Proposed Solution</label>
                  <p style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {reviewingIdea.proposedSolution}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="admin-form-label">Target Audience / Segment</label>
                    <p style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {reviewingIdea.targetUsers || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="admin-form-label">Market Opportunity</label>
                    <p style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {reviewingIdea.market || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="admin-form-label">Business / Revenue Model</label>
                    <p style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {reviewingIdea.businessModel || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="admin-form-label">Team Members</label>
                    <p style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {reviewingIdea.teamMembers || 'Not specified'}
                    </p>
                  </div>
                </div>

                {reviewingIdea.expectedImpact && (
                  <div style={{ marginBottom: '12px' }}>
                    <label className="admin-form-label">Expected Impact & Milestones</label>
                    <p style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {reviewingIdea.expectedImpact}
                    </p>
                  </div>
                )}

                {reviewingIdea.documentUrl && (
                  <div style={{ marginBottom: '12px' }}>
                    <label className="admin-form-label">Pitch Deck / Project URL</label>
                    <div style={{ fontSize: '0.85rem', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <a href={reviewingIdea.documentUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink size={14} /> Open Pitch Material
                      </a>
                    </div>
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-form-label">Committee Decision / Status</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="admin-select"
                  >
                    <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW (Committee Evaluation)</option>
                    <option value="SHORTLISTED">SHORTLISTED (Pitch Round)</option>
                    <option value="ACCEPTED">ACCEPTED (SIEM Incubation Cohort)</option>
                    <option value="REJECTED">REJECTED (Requires Revision)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Feedback for Student Founder</label>
                  <textarea
                    rows={3}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Enter mentor notes or grant decision..."
                    className="admin-textarea"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setReviewingIdea(null)} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={reviewSubmitting} className="admin-btn admin-btn-primary">
                  <Check size={16} />
                  {reviewSubmitting ? 'Saving...' : 'Save & Update Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog">
            <div className="admin-modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Create Flagship Event</h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>E-Cell SITRC Schedule</div>
              </div>
              <button onClick={() => setShowCreateEventModal(false)} className="admin-btn admin-btn-secondary admin-btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. InnovateX 24-Hour Campus Hackathon"
                    className="admin-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Event Type</label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value)}
                      className="admin-select"
                    >
                      <option value="WORKSHOP">Workshop</option>
                      <option value="HACKATHON">Hackathon</option>
                      <option value="COMPETITION">Pitch Competition</option>
                      <option value="SEMINAR">Seminar</option>
                      <option value="BOOTCAMP">Bootcamp</option>
                      <option value="NETWORKING">Networking</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Date</label>
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Start Time</label>
                    <input
                      type="text"
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">End Time</label>
                    <input
                      type="text"
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                      placeholder="01:00 PM"
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Venue *</label>
                  <input
                    type="text"
                    required
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    placeholder="e.g. Central Computing Facility, SIEM"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    placeholder="Provide overview and objectives..."
                    className="admin-textarea"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Max Capacity</label>
                  <input
                    type="number"
                    value={newEventCapacity}
                    onChange={(e) => setNewEventCapacity(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowCreateEventModal(false)} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <Check size={16} />
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {showCreateAnnouncementModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog">
            <div className="admin-modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Broadcast Notice</h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Post to public SITRC notice board</div>
              </div>
              <button onClick={() => setShowCreateAnnouncementModal(false)} className="admin-btn admin-btn-secondary admin-btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Headline *</label>
                  <input
                    type="text"
                    required
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    placeholder="e.g. InnovateX Hackathon Registration Extended"
                    className="admin-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Category</label>
                    <input
                      type="text"
                      value={newAnnCategory}
                      onChange={(e) => setNewAnnCategory(e.target.value)}
                      placeholder="General / Event / Recruitment"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Priority</label>
                    <select
                      value={newAnnPriority}
                      onChange={(e) => setNewAnnPriority(e.target.value as any)}
                      className="admin-select"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High Alert</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Content *</label>
                  <textarea
                    required
                    rows={4}
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    placeholder="Detailed notice text..."
                    className="admin-textarea"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowCreateAnnouncementModal(false)} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <Send size={16} />
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showCreateTeamModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog">
            <div className="admin-modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Add Team Member</h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>E-Cell SITRC Board</div>
              </div>
              <button onClick={() => setShowCreateTeamModal(false)} className="admin-btn admin-btn-secondary admin-btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTeamMember}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Tanmay Borse"
                    className="admin-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Role Title *</label>
                    <input
                      type="text"
                      required
                      value={newTeamRole}
                      onChange={(e) => setNewTeamRole(e.target.value)}
                      placeholder="e.g. Technical Operations Lead"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Category</label>
                    <select
                      value={newTeamCategory}
                      onChange={(e) => setNewTeamCategory(e.target.value)}
                      className="admin-select"
                    >
                      <option value="FACULTY_ADVISOR">Faculty Advisor</option>
                      <option value="CORE_COORDINATOR">Core Coordinator</option>
                      <option value="TECHNICAL_WING">Technical Wing</option>
                      <option value="EVENTS_WING">Events Wing</option>
                      <option value="STUDENT_COORDINATOR">Student Coordinator</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Department</label>
                    <input
                      type="text"
                      value={newTeamDept}
                      onChange={(e) => setNewTeamDept(e.target.value)}
                      placeholder="Computer Engineering"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Academic Year</label>
                    <input
                      type="text"
                      value={newTeamYear}
                      onChange={(e) => setNewTeamYear(e.target.value)}
                      placeholder="TE / BE / Faculty"
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Skills & Domains</label>
                  <input
                    type="text"
                    value={newTeamSkills}
                    onChange={(e) => setNewTeamSkills(e.target.value)}
                    placeholder="AI, Event Management, Robotics"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Brief Bio</label>
                  <textarea
                    rows={2}
                    value={newTeamBio}
                    onChange={(e) => setNewTeamBio(e.target.value)}
                    placeholder="Short bio..."
                    className="admin-textarea"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowCreateTeamModal(false)} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <Check size={16} />
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Blog Modal */}
      {showCreateBlogModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog">
            <div className="admin-modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Publish Founder Story</h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>E-Cell SITRC Knowledge Hub</div>
              </div>
              <button onClick={() => setShowCreateBlogModal(false)} className="admin-btn admin-btn-secondary admin-btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBlog}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Title *</label>
                  <input
                    type="text"
                    required
                    value={newBlogTitle}
                    onChange={(e) => setNewBlogTitle(e.target.value)}
                    placeholder="e.g. Scaling from Campus Dorm to $2M ARR"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Short Excerpt / Summary *</label>
                  <textarea
                    required
                    rows={2}
                    value={newBlogExcerpt}
                    onChange={(e) => setNewBlogExcerpt(e.target.value)}
                    placeholder="Summary of the case study (minimum 10 characters)..."
                    className="admin-textarea"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Full Article Content *</label>
                  <textarea
                    required
                    rows={5}
                    value={newBlogContent}
                    onChange={(e) => setNewBlogContent(e.target.value)}
                    placeholder="Full article content (minimum 20 characters)..."
                    className="admin-textarea"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Category</label>
                    <input
                      type="text"
                      value={newBlogCategory}
                      onChange={(e) => setNewBlogCategory(e.target.value)}
                      placeholder="Startup Journey / Guide"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Tags</label>
                    <input
                      type="text"
                      value={newBlogTags}
                      onChange={(e) => setNewBlogTags(e.target.value)}
                      placeholder="SaaS, Funding, Mentorship"
                      className="admin-input"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowCreateBlogModal(false)} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <Send size={16} />
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// COMPONENT 3: ORIGINAL PUBLIC-FACING WEBSITE (/)
// Elegant cream and maroon color theme with authentic E-Cell SITRC
// event photos, leadership directory showcase, and official branding logo.
// =====================================================================

function PublicWebsite() {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'gallery' | 'ideas' | 'announcements' | 'team' | 'blogs'>('overview');
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('ecell_token'));

  // Data states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);

  // Modals & Auth States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showRegisterModal, setShowRegisterModal] = useState<EventItem | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    return !sessionStorage.getItem('ecell_welcomed');
  });
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<'all' | 'events' | 'leadership' | 'campaigns'>('all');

  // Sign In form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Idea submission state
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('AI & DeepTech');
  const [ideaCurrentStage, setIdeaCurrentStage] = useState('Ideation');
  const [ideaProblem, setIdeaProblem] = useState('');
  const [ideaSolution, setIdeaSolution] = useState('');
  const [ideaTargetUsers, setIdeaTargetUsers] = useState('');
  const [ideaMarket, setIdeaMarket] = useState('');
  const [ideaBusinessModel, setIdeaBusinessModel] = useState('');
  const [ideaTeamMembers, setIdeaTeamMembers] = useState('');
  const [ideaExpectedImpact, setIdeaExpectedImpact] = useState('');
  const [ideaDocumentUrl, setIdeaDocumentUrl] = useState('');
  const [ideaSubmitting, setIdeaSubmitting] = useState(false);
  const [ideaFormErrors, setIdeaFormErrors] = useState<Record<string, string>>({});
  const [ideaGeneralError, setIdeaGeneralError] = useState('');
  const [ideaSubmitSuccess, setIdeaSubmitSuccess] = useState<IdeaItem | null>(null);
  const [mySubmittedIdeas, setMySubmittedIdeas] = useState<IdeaItem[]>([]);
  const [loadingMyIdeas, setLoadingMyIdeas] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const dismissWelcome = () => {
    sessionStorage.setItem('ecell_welcomed', 'true');
    setShowWelcomeModal(false);
  };

  // Real SITRC Gallery Items
  const galleryItems = [
    {
      id: 'gal-1',
      title: 'Pitch-Perfect 2026 Pre-Zonal of Eureka! (IIT Bombay & SITRC)',
      category: 'events',
      categoryLabel: 'Flagship Summit',
      src: '/assets/event-eureka-pitch.jpg',
      alt: 'Pitch-Perfect 2026 Eureka Pre-Zonal competition poster organized by SITRC E-Cell and IIT Bombay E-Cell',
      description: 'Pre-zonal flagship pitch competition at D-Building Seminar Hall with ₹26L+ cash prizes, mentor access, and entry into IIT Bombay E-Cell Zonals.',
      badge: 'Eureka! 2026',
    },
    {
      id: 'gal-2',
      title: 'E-Cell SITRC Core Leadership & Faculty Advisory Board',
      category: 'leadership',
      categoryLabel: 'Team & Faculty',
      src: '/assets/team-group.jpg',
      alt: 'E-Cell SITRC Faculty Advisors and Student Coordinators on stage in the campus auditorium',
      description: 'Official committee group photograph taken at the SITRC auditorium with faculty advisor Dr. Pavan Baravkar, HOD Dr. Gajanan Waghmare, and student leads.',
      badge: 'Core Leadership',
    },
    {
      id: 'gal-3',
      title: 'Live Startup Pitches Before the Jury Panel',
      category: 'events',
      categoryLabel: 'Venture Pitching',
      src: '/assets/event-pitching.jpg',
      alt: 'Students delivering live prototype presentations before the evaluation jury at SITRC',
      description: 'Student engineering teams presenting functional prototypes, business plans, and tech models to faculty and venture evaluators.',
      badge: 'Pitch Arena',
    },
    {
      id: 'gal-4',
      title: 'Annual Felicitation & Award Ceremony',
      category: 'events',
      categoryLabel: 'Auditorium Conclave',
      src: '/assets/event-felicitation.jpg',
      alt: 'Winners and participants holding certificates and trophies in the SITRC auditorium',
      description: 'Honoring outstanding student founders, hackathon winners, and challenge delegates with certificates and trophies on the main auditorium stage.',
      badge: 'Awards 2026',
    },
    {
      id: 'gal-5',
      title: 'The Power of Networking in Entrepreneurship',
      category: 'campaigns',
      categoryLabel: 'NEC 2026 Campaign',
      src: '/assets/event-networking.jpg',
      alt: 'The Power of Networking in Entrepreneurship - National Entrepreneurship Challenge 2026 poster',
      description: 'National Entrepreneurship Challenge initiative emphasizing mentor connections, genuine founder relationships, and knowledge sharing.',
      badge: 'NEC 2026',
    },
    {
      id: 'gal-6',
      title: 'From Idea to Impact: 5-Step Execution Roadmap',
      category: 'campaigns',
      categoryLabel: 'Incubation Strategy',
      src: '/assets/event-execution-impact.jpg',
      alt: 'From Idea to Impact: Execution Makes It Happen 5-step roadmap poster',
      description: 'Structured framework for translating campus innovations: 1. Idea, 2. Plan, 3. Execute, 4. Learn & Adapt, 5. Impact.',
      badge: 'Methodology',
    },
    {
      id: 'gal-7',
      title: 'The Entrepreneurial Mindset: Turning Challenges into Opportunities',
      category: 'campaigns',
      categoryLabel: 'Founder Mindset',
      src: '/assets/event-mindset.jpg',
      alt: 'The Entrepreneurial Mindset: Turning Challenges into Opportunities poster',
      description: 'Campaign poster highlighting calculated risk-taking, continuous learning, failure as feedback, and founder resilience.',
      badge: 'Mindset',
    },
  ];

  const getEventBanner = (ev: EventItem) => {
    const t = (ev.title + ' ' + (ev.eventType || '')).toLowerCase();
    if (t.includes('eureka') || t.includes('pitch') || t.includes('arena') || t.includes('iit bombay')) {
      return '/assets/event-eureka-pitch.jpg';
    }
    if (t.includes('hackathon') || t.includes('innovatex')) {
      return '/assets/event-pitching.jpg';
    }
    if (t.includes('network') || t.includes('match') || t.includes('speed')) {
      return '/assets/event-networking.jpg';
    }
    if (t.includes('nec') || t.includes('execution') || t.includes('challenge') || t.includes('prep')) {
      return '/assets/event-execution-impact.jpg';
    }
    if (t.includes('design') || t.includes('lean') || t.includes('bootcamp') || t.includes('mindset')) {
      return '/assets/event-mindset.jpg';
    }
    return '/assets/event-felicitation.jpg';
  };

  const getEventAlt = (ev: EventItem) => {
    const t = (ev.title + ' ' + (ev.eventType || '')).toLowerCase();
    if (t.includes('eureka') || t.includes('pitch') || t.includes('arena') || t.includes('iit bombay')) {
      return 'Eureka Pitch-Perfect Pre-Zonal competition poster by E-Cell IIT Bombay and SITRC';
    }
    if (t.includes('hackathon') || t.includes('innovatex')) {
      return 'Students presenting live prototype pitch to jury panel at SITRC';
    }
    if (t.includes('network') || t.includes('match') || t.includes('speed')) {
      return 'The Power of Networking in Entrepreneurship - National Entrepreneurship Challenge 2026 poster';
    }
    if (t.includes('nec') || t.includes('execution') || t.includes('challenge') || t.includes('prep')) {
      return 'From Idea to Impact: Execution Makes It Happen roadmap poster';
    }
    if (t.includes('design') || t.includes('lean') || t.includes('bootcamp') || t.includes('mindset')) {
      return 'The Entrepreneurial Mindset: Turning Challenges into Opportunities poster';
    }
    return 'E-Cell SITRC annual felicitation ceremony in campus auditorium';
  };

  useEffect(() => {
    if (window.location.hash === '#admin') {
      window.location.assign('/admin/dashboard');
    }
  }, []);

  useEffect(() => {
    async function initData() {
      try {
        const healthRes = await fetch(`${API_BASE}/health`).catch(() => null);
        if (!healthRes || !healthRes.ok) {
          console.warn('Backend API connection degraded.');
        }

        const evRes = await fetch(`${API_BASE}/events`).catch(() => null);
        if (evRes && evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData.data?.events || evData.data || []);
        }

        const annRes = await fetch(`${API_BASE}/announcements`).catch(() => null);
        if (annRes && annRes.ok) {
          const annData = await annRes.json();
          setAnnouncements(annData.data || []);
        }

        const teamRes = await fetch(`${API_BASE}/team`).catch(() => null);
        if (teamRes && teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamMembers(teamData.data || []);
        }

        const blogRes = await fetch(`${API_BASE}/blogs`).catch(() => null);
        if (blogRes && blogRes.ok) {
          const blogData = await blogRes.json();
          setBlogs(Array.isArray(blogData.data) ? blogData.data : blogData.data?.blogs || []);
        }
      } catch (err) {
        console.error('API connection failed:', err);
      }
    }

    initData();
  }, []);

  const fetchMyIdeas = async (token: string) => {
    try {
      setLoadingMyIdeas(true);
      const res = await fetch(`${API_BASE}/ideas/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMySubmittedIdeas(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load my ideas:', err);
    } finally {
      setLoadingMyIdeas(false);
    }
  };

  useEffect(() => {
    if (!authToken) {
      setUser(null);
      setMySubmittedIdeas([]);
      return;
    }
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setUser(data.data);
        fetchMyIdeas(authToken);
      })
      .catch(() => {
        localStorage.removeItem('ecell_token');
        setAuthToken(null);
        setUser(null);
        setMySubmittedIdeas([]);
      });
  }, [authToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Invalid email or password');
        return;
      }
      localStorage.setItem('ecell_token', data.data.token);
      setAuthToken(data.data.token);
      setUser(data.data.user);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      showToast(`Welcome back, ${data.data.user.fullName || data.data.user.profile?.fullName || data.data.user.email}!`);
    } catch {
      setAuthError('Failed to connect to authentication service.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (registerName.trim().length < 2) {
      setAuthError('Full Name must be at least 2 characters long.');
      return;
    }
    if (!registerEmail.trim() || !registerEmail.includes('@') || !registerEmail.includes('.')) {
      setAuthError('Please provide a valid email address.');
      return;
    }
    if (registerPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setAuthError("Passwords don't match. Please re-enter.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: registerName.trim(),
          email: registerEmail.trim().toLowerCase(),
          password: registerPassword,
          confirmPassword: registerConfirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Registration failed. Please try again.');
        return;
      }
      localStorage.setItem('ecell_token', data.data.token);
      setAuthToken(data.data.token);
      setUser(data.data.user);
      setShowLoginModal(false);
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      showToast(`Welcome to E-Cell SITRC, ${data.data.user.fullName || data.data.user.profile?.fullName || registerName}!`);
    } catch {
      setAuthError('Failed to connect to authentication service.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      }).catch(() => {});
    } finally {
      localStorage.removeItem('ecell_token');
      setAuthToken(null);
      setUser(null);
      showToast('Logged out successfully.');
    }
  };

  const quickFill = (email: string, pass: string) => {
    setAuthMode('login');
    setAuthError('');
    setLoginEmail(email);
    setLoginPassword(pass);
  };

  const handleRegister = async (eventId: string) => {
    if (!authToken) {
      setShowLoginModal(true);
      showToast('Please sign in first to register for events.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Successfully registered for the event!');
        setShowRegisterModal(null);
      } else {
        showToast(data.message || 'Registration failed');
      }
    } catch {
      showToast('Error sending registration request.');
    }
  };

  const handleIdeaFieldChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (ideaFormErrors[field]) {
      setIdeaFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (ideaGeneralError) {
      setIdeaGeneralError('');
    }
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      setShowLoginModal(true);
      showToast('Please sign in or create an account to submit your startup idea.');
      return;
    }

    // Client-side validation for all required fields
    const errors: Record<string, string> = {};

    if (!ideaTitle.trim()) {
      errors.title = 'Startup / Project name is required.';
    } else if (ideaTitle.trim().length < 3) {
      errors.title = 'Startup / Project name must be at least 3 characters.';
    }

    if (!ideaProblem.trim()) {
      errors.problem = 'Problem statement is required.';
    } else if (ideaProblem.trim().length < 10) {
      errors.problem = 'Please describe the problem in more detail (at least 10 characters).';
    }

    if (!ideaSolution.trim()) {
      errors.proposedSolution = 'Proposed solution is required.';
    } else if (ideaSolution.trim().length < 10) {
      errors.proposedSolution = 'Please describe your proposed solution (at least 10 characters).';
    }

    if (!ideaTargetUsers.trim()) {
      errors.targetUsers = 'Target audience / customer segment is required.';
    } else if (ideaTargetUsers.trim().length < 2) {
      errors.targetUsers = 'Please specify who will use or purchase your product.';
    }

    if (!ideaMarket.trim()) {
      errors.market = 'Market opportunity / competitors is required.';
    } else if (ideaMarket.trim().length < 2) {
      errors.market = 'Please describe the market opportunity or competitors.';
    }

    if (!ideaBusinessModel.trim()) {
      errors.businessModel = 'Revenue / Business model is required.';
    } else if (ideaBusinessModel.trim().length < 2) {
      errors.businessModel = 'Please explain how the startup will earn revenue or achieve sustainability.';
    }

    if (!ideaTeamMembers.trim()) {
      errors.teamMembers = 'Team members information is required.';
    } else if (ideaTeamMembers.trim().length < 2) {
      errors.teamMembers = 'Please list team members and their roles (or write "Solo Founder").';
    }

    if (!ideaExpectedImpact.trim()) {
      errors.expectedImpact = 'Expected impact / outcome is required.';
    } else if (ideaExpectedImpact.trim().length < 5) {
      errors.expectedImpact = 'Please describe key milestones and expected impact (at least 5 characters).';
    }

    if (ideaDocumentUrl.trim()) {
      const url = ideaDocumentUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errors.documentUrl = 'Please provide a valid URL starting with http:// or https://';
      }
    }

    if (Object.keys(errors).length > 0) {
      setIdeaFormErrors(errors);
      setIdeaGeneralError('Please fill in all required fields highlighted below before submitting.');
      showToast('Please complete all required fields highlighted below.');
      const firstKey = Object.keys(errors)[0];
      setTimeout(() => {
        const el = document.getElementById(`idea-field-${firstKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }, 60);
      return;
    }

    setIdeaFormErrors({});
    setIdeaGeneralError('');
    setIdeaSubmitting(true);

    try {
      const payload = {
        title: ideaTitle.trim(),
        category: ideaCategory,
        currentStage: ideaCurrentStage,
        problem: ideaProblem.trim(),
        proposedSolution: ideaSolution.trim(),
        targetUsers: ideaTargetUsers.trim(),
        market: ideaMarket.trim(),
        businessModel: ideaBusinessModel.trim(),
        teamMembers: ideaTeamMembers.trim(),
        expectedImpact: ideaExpectedImpact.trim(),
        documentUrl: ideaDocumentUrl.trim() || null,
      };

      const res = await fetch(`${API_BASE}/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('🎉 Startup idea submitted successfully to E-Cell Review Committee!');
        setIdeaSubmitSuccess(data.data);
        // Clear inputs on success only
        setIdeaTitle('');
        setIdeaProblem('');
        setIdeaSolution('');
        setIdeaTargetUsers('');
        setIdeaMarket('');
        setIdeaBusinessModel('');
        setIdeaTeamMembers('');
        setIdeaExpectedImpact('');
        setIdeaDocumentUrl('');
        setIdeaFormErrors({});
        setIdeaGeneralError('');
        if (authToken) {
          fetchMyIdeas(authToken);
        }
      } else {
        // PRESERVE user input! Highlight field errors
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          setIdeaFormErrors(data.fieldErrors);
          const firstKey = Object.keys(data.fieldErrors)[0];
          setTimeout(() => {
            const el = document.getElementById(`idea-field-${firstKey}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.focus();
            }
          }, 60);
        }
        const errorMsg = data.message || 'Submission failed. Please check the entered data.';
        setIdeaGeneralError(errorMsg);
        showToast(errorMsg);
      }
    } catch {
      const netError = 'Error connecting to the backend server. Please verify backend is running.';
      setIdeaGeneralError(netError);
      showToast(netError);
    } finally {
      setIdeaSubmitting(false);
    }
  };

  const filteredGallery = galleryItems.filter(
    (item) => selectedGalleryCategory === 'all' || item.category === selectedGalleryCategory
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: '#FFF8E7', color: '#302329' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#FFFCF5',
            border: '1px solid #800020',
            color: '#302329',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(128, 0, 32, 0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
          }}
        >
          <Sparkles size={18} color="#800020" />
          {toastMessage}
        </div>
      )}

      {/* WELCOME POPUP (Kept design & functionality with official branding) */}
      {showWelcomeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(48, 35, 41, 0.5)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '36px 32px',
              background: '#FFFCF5',
              border: '1px solid #E6D5D8',
              borderRadius: '20px',
              boxShadow: '0 20px 40px -10px rgba(128, 0, 32, 0.2)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <button
              onClick={dismissWelcome}
              className="btn btn-ghost btn-sm"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '6px',
                borderRadius: '50%',
                color: '#6D5B60',
              }}
              title="Close"
            >
              <X size={20} />
            </button>

            {/* Official Logo */}
            <div className="ecell-logo-modal-container">
              <img
                src="/images/ecell-logo.jpeg"
                alt="Sandip E-Cell SITRC Official Logo"
                className="ecell-logo-modal-img"
              />
            </div>

            <div className="badge badge-purple" style={{ marginBottom: '14px' }}>
              <Award size={13} /> Official Community • SITRC Nashik
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#302329', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Welcome to <span style={{ color: '#800020' }}>SITRC E-Cell</span>
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#6D5B60', lineHeight: 1.6, marginBottom: '24px' }}>
              The campus innovation, incubation, and entrepreneurship catalyst at Sandip Institute of Technology and Research Centre. Discover flagship summits, prototype challenges, seed grants, and venture networks.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  dismissWelcome();
                  setActiveTab('events');
                }}
                className="btn btn-primary"
                style={{ padding: '12px 22px' }}
              >
                <Calendar size={16} />
                Explore Summits & Events
              </button>
              <button
                onClick={dismissWelcome}
                className="btn btn-secondary"
                style={{ padding: '12px 20px' }}
              >
                Continue to Platform
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="glass-nav" style={{ padding: '8px 24px' }}>
        <div className="navbar-layout">
          <div className="navbar-top-row">
            {/* Official Brand Header */}
            <div
              className="navbar-brand-header"
              onClick={() => setActiveTab('overview')}
            >
              <div className="ecell-logo-nav-container">
                <img
                  src="/images/ecell-logo.jpeg"
                  alt="Sandip E-Cell SITRC Official Logo"
                  className="ecell-logo-nav-img"
                />
              </div>
              <div>
                <div style={{ fontSize: '1.20rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#302329' }}>
                  SITRC <span style={{ color: '#800020' }}>E-CELL</span>
                </div>
                <div style={{ fontSize: '0.70rem', color: '#6D5B60', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Innovation & Incubation Hub
                </div>
              </div>
            </div>

            {/* User Status / Sign In */}
            <div className="navbar-user-actions">
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#800020',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(128, 0, 32, 0.2)',
                    }}
                    title={user.fullName || user.profile?.fullName || user.email}
                  >
                    {(user.fullName || user.profile?.fullName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#302329', lineHeight: 1.2 }}>
                      {user.fullName || user.profile?.fullName || user.email}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#800020', fontWeight: 600 }}>{user.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    title="Logout"
                  >
                    <LogOut size={13} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthMode('login'); setAuthError(''); setShowLoginModal(true); }} className="btn btn-primary btn-sm">
                  <LogIn size={14} />
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="navbar-nav-scroll">
            {[
              { id: 'overview', label: 'Overview', icon: Layers },
              { id: 'events', label: 'Events & Summits', icon: Calendar },
              { id: 'gallery', label: 'Gallery', icon: Camera },
              { id: 'ideas', label: 'Incubation', icon: Lightbulb },
              { id: 'announcements', label: 'Notice Board', icon: Bell },
              { id: 'team', label: 'Leadership', icon: Users },
              { id: 'blogs', label: 'Stories', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="btn btn-ghost navbar-nav-btn"
                  style={{
                    color: isActive ? '#800020' : '#6D5B60',
                    background: isActive ? '#F0DDE2' : 'transparent',
                    border: isActive ? '1px solid #E6D5D8' : '1px solid transparent',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <Icon size={15} color={isActive ? '#800020' : '#6D5B60'} />
                  {tab.label}
                </button>
              );
            })}

            {/* Admin Login Link */}
            <Link
              to="/admin/login"
              className="btn btn-ghost navbar-nav-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#800020',
                background: '#F8F0DF',
                border: '1px solid #E6D5D8',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F0DDE2';
                e.currentTarget.style.borderColor = '#A64D65';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F8F0DF';
                e.currentTarget.style.borderColor = '#E6D5D8';
              }}
            >
              <ShieldCheck size={15} color="#800020" />
              <span>Admin Login</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '36px 24px' }}>
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* Hero Card */}
            <div
              className="glass-panel"
              style={{
                padding: '44px 38px',
                marginBottom: '36px',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #F8F0DF 0%, #FFFCF5 100%)',
                border: '1px solid #E6D5D8',
              }}
            >
              <div style={{ maxWidth: '780px' }}>
                <div className="badge badge-purple" style={{ marginBottom: '16px' }}>
                  <Award size={13} /> Official Entrepreneurship Cell • Sandip Foundation (SITRC)
                </div>
                <h1
                  style={{
                    fontSize: '3.1rem',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    marginBottom: '18px',
                    letterSpacing: '-0.03em',
                    color: '#302329',
                  }}
                >
                  Empowering Student <span className="gradient-text">Founders & Innovators</span>
                </h1>
                <p style={{ fontSize: '1.15rem', color: '#6D5B60', marginBottom: '28px', lineHeight: 1.6 }}>
                  SITRC E-Cell serves as the premier launchpad for future entrepreneurs. From seed incubation, hands-on
                  venture workshops, and hackathons to direct angel & venture mentor networks.
                </p>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveTab('events')} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                    <Calendar size={18} />
                    Explore Summits & Events
                    <ArrowRight size={16} />
                  </button>
                  <button onClick={() => setActiveTab('gallery')} className="btn btn-secondary" style={{ padding: '12px 24px' }}>
                    <Camera size={18} color="#800020" />
                    View Real Event Photos
                  </button>
                  <button onClick={() => setActiveTab('ideas')} className="btn btn-secondary" style={{ padding: '12px 24px' }}>
                    <Lightbulb size={18} color="#d97706" />
                    Submit Startup Idea
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '36px',
              }}
            >
              <div className="glass-panel" style={{ padding: '24px', background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#6D5B60', fontSize: '0.85rem', fontWeight: 600 }}>Active Summits & Events</span>
                  <Calendar size={20} color="#800020" />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#302329' }}>{events.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>Workshops, Hackathons & Pitches</div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#6D5B60', fontSize: '0.85rem', fontWeight: 600 }}>Campus Announcements</span>
                  <Bell size={20} color="#0284c7" />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#302329' }}>{announcements.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>Official Notices & Deadlines</div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#6D5B60', fontSize: '0.85rem', fontWeight: 600 }}>Core Leaders & Mentors</span>
                  <Users size={20} color="#800020" />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#302329' }}>{teamMembers.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#800020', marginTop: '4px', fontWeight: 600 }}>Faculty & Student Leads</div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#6D5B60', fontSize: '0.85rem', fontWeight: 600 }}>Case Studies & Blogs</span>
                  <BookOpen size={20} color="#d97706" />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#302329' }}>{blogs.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '4px', fontWeight: 600 }}>Founder Stories & Insights</div>
              </div>
            </div>

            {/* Real Campus Photo Highlights Row */}
            <div
              className="glass-panel"
              style={{
                padding: '28px',
                marginBottom: '36px',
                background: '#FFFCF5',
                border: '1px solid #E6D5D8',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#302329' }}>Real Campus Event Highlights</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6D5B60', margin: '2px 0 0' }}>
                    Authentic snapshots from E-Cell SITRC summits, pitch sessions, and challenge campaigns.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#800020', fontWeight: 600 }}
                >
                  View Full Gallery ({galleryItems.length}) <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {galleryItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab('gallery')}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #E6D5D8',
                      background: '#F8F0DF',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(128, 0, 32, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                    <div style={{ padding: '12px 14px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginBottom: '6px' }}>
                        {item.categoryLabel}
                      </span>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#302329', lineHeight: 1.3 }}>
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Events and Notices */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {/* Featured Events Column */}
              <div className="glass-panel" style={{ padding: '28px', background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#302329' }}>Upcoming Featured Events</h3>
                  <button onClick={() => setActiveTab('events')} className="btn btn-ghost btn-sm" style={{ color: '#800020', fontWeight: 600 }}>
                    View All ({events.length}) <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {events.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: '#F8F0DF',
                        border: '1px solid #E6D5D8',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'center',
                      }}
                    >
                      <img
                        src={getEventBanner(ev)}
                        alt={getEventAlt(ev)}
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid #E6D5D8',
                        }}
                        loading="lazy"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{ev.eventType}</span>
                          <span style={{ fontSize: '0.78rem', color: '#6D5B60' }}>
                            {new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#302329', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.title}
                        </h4>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', color: '#6D5B60' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {ev.startTime}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {ev.venue}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowRegisterModal(ev)}
                        className="btn btn-secondary btn-sm"
                        style={{ whiteSpace: 'nowrap', borderRadius: '8px' }}
                      >
                        Register
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Notices Column */}
              <div className="glass-panel" style={{ padding: '28px', background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#302329' }}>Official Notices</h3>
                  <Bell size={18} color="#800020" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {announcements.slice(0, 4).map((ann) => (
                    <div
                      key={ann.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: '#F8F0DF',
                        borderLeft: `4px solid ${ann.priority === 'HIGH' ? '#800020' : '#A64D65'}`,
                        borderTop: '1px solid #E6D5D8',
                        borderRight: '1px solid #E6D5D8',
                        borderBottom: '1px solid #E6D5D8',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{ann.category}</span>
                        <span style={{ fontSize: '0.72rem', color: '#6D5B60' }}>
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#302329', marginBottom: '4px' }}>
                        {ann.title}
                      </h5>
                      <p style={{ fontSize: '0.8rem', color: '#6D5B60', lineHeight: 1.4 }}>
                        {ann.content.slice(0, 110)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVENTS & SUMMITS */}
        {activeTab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#302329' }}>Summits, Workshops & Hackathons</h2>
                <p style={{ color: '#6D5B60' }}>Register for upcoming flagship events curated by SITRC E-Cell.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    background: '#FFFCF5',
                    border: '1px solid #E6D5D8',
                  }}
                >
                  {/* Real Event Image Banner */}
                  <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={getEventBanner(ev)}
                      alt={getEventAlt(ev)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                      <span className="badge badge-purple" style={{ background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                        {ev.eventType}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      <span className="badge badge-emerald" style={{ background: '#FFFCF5', border: '1px solid #a7f3d0' }}>
                        {ev.registrationOpen || ev.status === 'REGISTRATION_OPEN' ? 'Registration Open' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#302329', marginBottom: '8px' }}>{ev.title}</h3>
                      <p style={{ fontSize: '0.88rem', color: '#6D5B60', marginBottom: '18px', lineHeight: 1.5 }}>
                        {ev.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#6D5B60', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} color="#800020" />
                          <span>{new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={16} color="#800020" />
                          <span>{ev.startTime} - {ev.endTime}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} color="#800020" />
                          <span>{ev.venue}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowRegisterModal(ev)}
                      disabled={ev.status === 'REGISTRATION_CLOSED'}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      <CheckCircle2 size={16} />
                      Register for Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GALLERY */}
        {activeTab === 'gallery' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="badge badge-purple" style={{ marginBottom: '8px' }}>
                  <Camera size={13} /> Official E-Cell SITRC Archive
                </div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#302329' }}>Photo Gallery & Campaigns</h2>
                <p style={{ color: '#6D5B60' }}>Real photographs from summits, live venture pitches, leadership conclaves, and NEC posters.</p>
              </div>

              {/* Filter Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Photos' },
                  { id: 'events', label: 'Summits & Pitches' },
                  { id: 'leadership', label: 'Leadership' },
                  { id: 'campaigns', label: 'NEC Campaign' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedGalleryCategory(f.id as any)}
                    className="btn btn-sm"
                    style={{
                      background: selectedGalleryCategory === f.id ? '#800020' : '#F8F0DF',
                      color: selectedGalleryCategory === f.id ? '#FFFFFF' : '#6D5B60',
                      border: '1px solid #E6D5D8',
                      borderRadius: '8px',
                      fontWeight: 600,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {filteredGallery.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    overflow: 'hidden',
                    background: '#FFFCF5',
                    border: '1px solid #E6D5D8',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(128, 0, 32, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(48, 35, 41, 0.06)';
                  }}
                >
                  <div style={{ width: '100%', height: '230px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={item.src}
                      alt={item.alt}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                      <span className="badge badge-purple" style={{ background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                        {item.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#302329', marginBottom: '8px', lineHeight: 1.35 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#6D5B60', lineHeight: 1.5 }}>
                        {item.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F8F0DF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#800020', fontWeight: 600 }}>
                        {item.badge}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6D5B60' }}>
                        E-Cell SITRC
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: INCUBATION / STARTUP IDEAS */}
        {activeTab === 'ideas' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div className="badge badge-amber" style={{ marginBottom: '12px' }}>
                <Lightbulb size={13} /> SITRC Incubation Council
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#302329' }}>Submit Your Startup Idea</h2>
              <p style={{ color: '#6D5B60' }}>
                Have an innovative concept? Submit it directly to E-Cell advisors for evaluation, seed grants, and mentor pairing.
              </p>
            </div>

            {/* Auth notice if student is not signed in */}
            {!authToken && (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '18px 24px',
                  background: '#F8F0DF',
                  border: '1px solid #E6D5D8',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertCircle size={24} color="#800020" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#302329', fontSize: '0.98rem' }}>
                      Student Account Required
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6D5B60' }}>
                      Please sign in or create a student account to submit your proposal and track review decisions.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowLoginModal(true);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '9px 18px', fontSize: '0.9rem' }}
                >
                  <LogIn size={15} /> Sign In / Register
                </button>
              </div>
            )}

            {/* Success Confirmation Card */}
            {ideaSubmitSuccess && (
              <div
                style={{
                  marginBottom: '28px',
                  padding: '28px',
                  background: '#FFFCF5',
                  border: '2px solid #059669',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.12)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '50%', color: '#059669', flexShrink: 0 }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065F46', margin: 0 }}>
                        Startup Proposal Submitted Successfully!
                      </h3>
                      <span className="badge badge-emerald" style={{ background: '#D1FAE5', color: '#065F46', fontWeight: 700 }}>
                        ID #{ideaSubmitSuccess.id.slice(0, 8)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: '#374151', margin: '6px 0 14px', lineHeight: 1.5 }}>
                      <strong>"{ideaSubmitSuccess.title}"</strong> has been registered with the SITRC Incubation Cell database. Our mentor committee evaluates submissions on a rolling basis.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.84rem', color: '#6D5B60', marginBottom: '18px' }}>
                      <div><strong>Domain:</strong> {ideaSubmitSuccess.category || 'AI & DeepTech'}</div>
                      <div><strong>Stage:</strong> {ideaSubmitSuccess.currentStage || 'Ideation'}</div>
                      <div><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>SUBMITTED (Pending Review)</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setIdeaSubmitSuccess(null)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Submit Another Proposal
                      </button>
                      <a
                        href="#my-submissions"
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        View My Submitted Ideas ↓
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Idea Submission Form */}
            <div className="glass-panel" style={{ padding: '36px', background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
              <form onSubmit={handleSubmitIdea} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
                {/* General error banner */}
                {ideaGeneralError && (
                  <div
                    style={{
                      padding: '14px 18px',
                      background: '#FCE8EC',
                      border: '1.5px solid #800020',
                      borderRadius: '10px',
                      color: '#800020',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontWeight: 600,
                    }}
                  >
                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    <span>{ideaGeneralError}</span>
                  </div>
                )}

                {/* Section 1: Venture Overview & Stage */}
                <div style={{ borderBottom: '1px solid #E6D5D8', paddingBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Rocket size={18} color="#800020" />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#302329', margin: 0 }}>
                      1. Venture Overview & Stage
                    </h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Startup / Project Name <span style={{ color: '#800020' }}>*</span>
                      </label>
                      <input
                        id="idea-field-title"
                        type="text"
                        value={ideaTitle}
                        onChange={(e) => handleIdeaFieldChange('title', e.target.value, setIdeaTitle)}
                        placeholder="e.g. AgriDrone Solutions"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: ideaFormErrors.title ? '2px solid #800020' : '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      />
                      {ideaFormErrors.title && (
                        <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <AlertCircle size={13} /> {ideaFormErrors.title}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Industry Domain / Sector <span style={{ color: '#800020' }}>*</span>
                      </label>
                      <select
                        id="idea-field-category"
                        value={ideaCategory}
                        onChange={(e) => handleIdeaFieldChange('category', e.target.value, setIdeaCategory)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      >
                        <option value="AI & DeepTech">AI & DeepTech</option>
                        <option value="EdTech & Skill Development">EdTech & Skill Development</option>
                        <option value="CleanTech & Renewable Energy">CleanTech & Renewable Energy</option>
                        <option value="HealthTech & BioTech">HealthTech & BioTech</option>
                        <option value="FinTech & Blockchain">FinTech & Blockchain</option>
                        <option value="AgriTech & Rural Innovation">AgriTech & Rural Innovation</option>
                        <option value="Consumer & E-Commerce">Consumer & E-Commerce</option>
                        <option value="Hardware & Robotics">Hardware & Robotics</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Current Development Stage <span style={{ color: '#800020' }}>*</span>
                      </label>
                      <select
                        id="idea-field-currentStage"
                        value={ideaCurrentStage}
                        onChange={(e) => handleIdeaFieldChange('currentStage', e.target.value, setIdeaCurrentStage)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      >
                        <option value="Ideation">Ideation (Concept & Market Research)</option>
                        <option value="Proof of Concept">Proof of Concept (Validated Theory / Feasibility)</option>
                        <option value="Prototype / MVP">Prototype / MVP (Working Prototype / Beta)</option>
                        <option value="Early Traction">Early Traction (Initial Users / Pilots)</option>
                        <option value="Scaling">Scaling (Expanding Market & Operations)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Problem & Value Proposition */}
                <div style={{ borderBottom: '1px solid #E6D5D8', paddingBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Lightbulb size={18} color="#800020" />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#302329', margin: 0 }}>
                      2. Problem & Value Proposition
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Problem Statement <span style={{ color: '#800020' }}>*</span>
                      </label>
                      <textarea
                        id="idea-field-problem"
                        rows={3}
                        value={ideaProblem}
                        onChange={(e) => handleIdeaFieldChange('problem', e.target.value, setIdeaProblem)}
                        placeholder="What real-world pain point or friction are you solving? (min. 10 characters)"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: ideaFormErrors.problem ? '2px solid #800020' : '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      />
                      {ideaFormErrors.problem && (
                        <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <AlertCircle size={13} /> {ideaFormErrors.problem}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Proposed Solution & Value Proposition <span style={{ color: '#800020' }}>*</span>
                      </label>
                      <textarea
                        id="idea-field-proposedSolution"
                        rows={4}
                        value={ideaSolution}
                        onChange={(e) => handleIdeaFieldChange('proposedSolution', e.target.value, setIdeaSolution)}
                        placeholder="How does your product, service, or model uniquely solve this problem? (min. 10 characters)"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: ideaFormErrors.proposedSolution ? '2px solid #800020' : '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      />
                      {ideaFormErrors.proposedSolution && (
                        <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <AlertCircle size={13} /> {ideaFormErrors.proposedSolution}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Target Users & Business Model */}
                <div style={{ borderBottom: '1px solid #E6D5D8', paddingBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Users size={18} color="#800020" />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#302329', margin: 0 }}>
                      3. Target Audience & Business Model
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Target Audience / Customer Segment <span style={{ color: '#800020' }}>*</span>
                      </label>
                      <input
                        id="idea-field-targetUsers"
                        type="text"
                        value={ideaTargetUsers}
                        onChange={(e) => handleIdeaFieldChange('targetUsers', e.target.value, setIdeaTargetUsers)}
                        placeholder="e.g. Small-scale farmers in Nashik district, Engineering students, MSMEs"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: ideaFormErrors.targetUsers ? '2px solid #800020' : '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      />
                      {ideaFormErrors.targetUsers && (
                        <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <AlertCircle size={13} /> {ideaFormErrors.targetUsers}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                          Market Opportunity & Competitors <span style={{ color: '#800020' }}>*</span>
                        </label>
                        <textarea
                          id="idea-field-market"
                          rows={3}
                          value={ideaMarket}
                          onChange={(e) => handleIdeaFieldChange('market', e.target.value, setIdeaMarket)}
                          placeholder="Estimated market size and key existing alternatives/competitors."
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: '#F8F0DF',
                            border: ideaFormErrors.market ? '2px solid #800020' : '1px solid #E6D5D8',
                            borderRadius: '10px',
                            color: '#302329',
                            fontSize: '0.95rem',
                            outline: 'none',
                          }}
                        />
                        {ideaFormErrors.market && (
                          <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <AlertCircle size={13} /> {ideaFormErrors.market}
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                          Revenue / Business Model <span style={{ color: '#800020' }}>*</span>
                        </label>
                        <textarea
                          id="idea-field-businessModel"
                          rows={3}
                          value={ideaBusinessModel}
                          onChange={(e) => handleIdeaFieldChange('businessModel', e.target.value, setIdeaBusinessModel)}
                          placeholder="How will your startup generate revenue (SaaS subscription, transaction fee, B2B)?"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: '#F8F0DF',
                            border: ideaFormErrors.businessModel ? '2px solid #800020' : '1px solid #E6D5D8',
                            borderRadius: '10px',
                            color: '#302329',
                            fontSize: '0.95rem',
                            outline: 'none',
                          }}
                        />
                        {ideaFormErrors.businessModel && (
                          <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <AlertCircle size={13} /> {ideaFormErrors.businessModel}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Team, Milestones & Pitch Link */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Sparkles size={18} color="#800020" />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#302329', margin: 0 }}>
                      4. Team, Milestones & Pitch Link
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Team Members & Roles <span style={{ color: '#800020' }}>*</span>
                      </label>
                      <input
                        id="idea-field-teamMembers"
                        type="text"
                        value={ideaTeamMembers}
                        onChange={(e) => handleIdeaFieldChange('teamMembers', e.target.value, setIdeaTeamMembers)}
                        placeholder="e.g. Ayush K. (Lead & Tech), Pranav S. (Product Design) or 'Solo Founder'"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: ideaFormErrors.teamMembers ? '2px solid #800020' : '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      />
                      {ideaFormErrors.teamMembers && (
                        <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <AlertCircle size={13} /> {ideaFormErrors.teamMembers}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Expected Impact & Key Milestones (Next 6-12 Months) <span style={{ color: '#800020' }}>*</span>
                      </label>
                      <textarea
                        id="idea-field-expectedImpact"
                        rows={3}
                        value={ideaExpectedImpact}
                        onChange={(e) => handleIdeaFieldChange('expectedImpact', e.target.value, setIdeaExpectedImpact)}
                        placeholder="What key goals do you plan to achieve? (e.g. Build prototype by Q3, onboard 50 test users)"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: ideaFormErrors.expectedImpact ? '2px solid #800020' : '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      />
                      {ideaFormErrors.expectedImpact && (
                        <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <AlertCircle size={13} /> {ideaFormErrors.expectedImpact}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#302329', marginBottom: '6px' }}>
                        Pitch Deck / Demo Link <span style={{ fontSize: '0.78rem', color: '#6D5B60', fontWeight: 400 }}>(Optional - Google Drive, Pitch Deck, Figma, GitHub)</span>
                      </label>
                      <input
                        id="idea-field-documentUrl"
                        type="url"
                        value={ideaDocumentUrl}
                        onChange={(e) => handleIdeaFieldChange('documentUrl', e.target.value, setIdeaDocumentUrl)}
                        placeholder="https://drive.google.com/... or https://github.com/..."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#F8F0DF',
                          border: ideaFormErrors.documentUrl ? '2px solid #800020' : '1px solid #E6D5D8',
                          borderRadius: '10px',
                          color: '#302329',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      />
                      {ideaFormErrors.documentUrl && (
                        <div style={{ color: '#800020', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <AlertCircle size={13} /> {ideaFormErrors.documentUrl}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={ideaSubmitting}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: ideaSubmitting ? 'not-allowed' : 'pointer',
                      opacity: ideaSubmitting ? 0.75 : 1,
                    }}
                  >
                    {ideaSubmitting ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        Submitting Proposal to Review Committee...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Submit Idea to E-Cell Review Committee
                      </>
                    )}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#6D5B60', marginTop: '10px' }}>
                    Protected under SITRC Incubation IP Guidelines. All proposals are reviewed under confidentiality.
                  </div>
                </div>
              </form>
            </div>

            {/* My Submitted Ideas Section */}
            {authToken && (
              <div id="my-submissions" style={{ marginTop: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#302329', margin: 0 }}>
                      My Submitted Proposals ({mySubmittedIdeas.length})
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#6D5B60', margin: '4px 0 0' }}>
                      Track review decisions, committee feedback, and mentor evaluations in real time.
                    </p>
                  </div>
                  {loadingMyIdeas && (
                    <span style={{ fontSize: '0.82rem', color: '#800020', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={14} className="animate-spin" /> Refreshing...
                    </span>
                  )}
                </div>

                {mySubmittedIdeas.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', background: '#FFFCF5', border: '1px dashed #E6D5D8', borderRadius: '12px' }}>
                    <Lightbulb size={36} color="#A64D65" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 700, color: '#302329', marginBottom: '4px' }}>No startup proposals submitted yet</div>
                    <div style={{ fontSize: '0.85rem', color: '#6D5B60' }}>
                      Fill out the form above to pitch your innovative idea to the SITRC Incubation Council!
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {mySubmittedIdeas.map((sub) => (
                      <div
                        key={sub.id}
                        className="glass-panel"
                        style={{
                          padding: '24px',
                          background: '#FFFCF5',
                          border: '1px solid #E6D5D8',
                          borderLeft: `5px solid ${
                            sub.status === 'ACCEPTED' ? '#059669' :
                            sub.status === 'SHORTLISTED' ? '#800020' :
                            sub.status === 'UNDER_REVIEW' ? '#D97706' :
                            sub.status === 'REJECTED' ? '#DC2626' : '#2563EB'
                          }`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#302329', margin: 0 }}>
                                {sub.title}
                              </h4>
                              <span className="badge badge-purple" style={{ background: '#F8F0DF', border: '1px solid #E6D5D8' }}>
                                {sub.category || 'AI & DeepTech'}
                              </span>
                              <span className="badge badge-amber" style={{ fontSize: '0.74rem' }}>
                                {sub.currentStage || 'Ideation'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#6D5B60' }}>
                              Submitted on {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                background:
                                  sub.status === 'ACCEPTED' ? '#D1FAE5' :
                                  sub.status === 'SHORTLISTED' ? '#FEF3C7' :
                                  sub.status === 'UNDER_REVIEW' ? '#EDE9FE' :
                                  sub.status === 'REJECTED' ? '#FFE4E6' : '#E0F2FE',
                                color:
                                  sub.status === 'ACCEPTED' ? '#065F46' :
                                  sub.status === 'SHORTLISTED' ? '#92400E' :
                                  sub.status === 'UNDER_REVIEW' ? '#5B21B6' :
                                  sub.status === 'REJECTED' ? '#9F1239' : '#0369A1',
                                border: `1px solid ${
                                  sub.status === 'ACCEPTED' ? '#A7F3D0' :
                                  sub.status === 'SHORTLISTED' ? '#FDE68A' :
                                  sub.status === 'UNDER_REVIEW' ? '#DDD6FE' :
                                  sub.status === 'REJECTED' ? '#FECDD3' : '#BAE6FD'
                                }`,
                              }}
                            >
                              {sub.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', background: '#F8F0DF', padding: '16px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.86rem' }}>
                          <div>
                            <strong style={{ color: '#800020', display: 'block', marginBottom: '4px' }}>Problem Statement:</strong>
                            <div style={{ color: '#302329', lineHeight: 1.45 }}>{sub.problem}</div>
                          </div>
                          <div>
                            <strong style={{ color: '#059669', display: 'block', marginBottom: '4px' }}>Proposed Solution:</strong>
                            <div style={{ color: '#302329', lineHeight: 1.45 }}>{sub.proposedSolution}</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.82rem', color: '#6D5B60', marginBottom: '10px' }}>
                          {sub.targetUsers && <div><strong>Target Users:</strong> {sub.targetUsers}</div>}
                          {sub.businessModel && <div><strong>Revenue Model:</strong> {sub.businessModel}</div>}
                          {sub.teamMembers && <div><strong>Team:</strong> {sub.teamMembers}</div>}
                        </div>

                        {sub.documentUrl && (
                          <div style={{ marginTop: '8px', fontSize: '0.82rem' }}>
                            <a href={sub.documentUrl} target="_blank" rel="noreferrer" style={{ color: '#800020', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}>
                              <ExternalLink size={14} /> View Pitch Deck / Materials
                            </a>
                          </div>
                        )}

                        {sub.adminFeedback && (
                          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', color: '#881337', marginTop: '12px' }}>
                            <strong>Review Committee Feedback:</strong>
                            <div style={{ marginTop: '4px', lineHeight: 1.4 }}>{sub.adminFeedback}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ANNOUNCEMENTS / NOTICE BOARD */}
        {activeTab === 'announcements' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#302329' }}>Official Notices & Broadcasts</h2>
              <p style={{ color: '#6D5B60' }}>Latest updates from the SITRC Entrepreneurship Cell board.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    background: '#FFFCF5',
                    border: '1px solid #E6D5D8',
                    borderLeft: `4px solid ${ann.priority === 'HIGH' ? '#800020' : '#A64D65'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="badge badge-purple">{ann.category}</span>
                      <span className={`badge ${ann.priority === 'HIGH' ? 'badge-rose' : 'badge-amber'}`}>
                        {ann.priority}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#6D5B60' }}>
                      {new Date(ann.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#302329', marginBottom: '8px' }}>{ann.title}</h3>
                  <p style={{ color: '#6D5B60', fontSize: '0.95rem', lineHeight: 1.6 }}>{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: TEAM & LEADERSHIP */}
        {activeTab === 'team' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div className="badge badge-purple" style={{ marginBottom: '10px' }}>
                <Users size={13} /> E-Cell SITRC Board
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#302329' }}>E-Cell Leadership Directory</h2>
              <p style={{ color: '#6D5B60' }}>Meet the visionaries, coordinators, and domain leads spearheading innovation at SITRC.</p>
            </div>

            {/* Official Team Photo Showcase Banner */}
            <div
              className="glass-panel"
              style={{
                marginBottom: '36px',
                overflow: 'hidden',
                background: '#FFFCF5',
                border: '1px solid #E6D5D8',
              }}
            >
              <div style={{ width: '100%', height: '360px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src="/assets/team-group.jpg"
                  alt="E-Cell SITRC Core Leadership and Faculty Advisory Board in Auditorium"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(48, 35, 41, 0.75) 0%, transparent 60%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '28px 32px',
                  }}
                >
                  <span className="badge badge-purple" style={{ width: 'fit-content', marginBottom: '8px', background: '#FFFCF5', color: '#800020' }}>
                    Official Committee
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
                    E-Cell SITRC Core Leadership & Faculty Advisory Board
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#F0DDE2', margin: 0, maxWidth: '780px' }}>
                    Faculty advisors Dr. Pavan Baravkar, Dr. Gajanan Waghmare, Dr. Amol Potgantwar, core student coordinators, and wing leads assembled at the Sandip Institute of Technology and Research Centre auditorium.
                  </p>
                </div>
              </div>
            </div>

            {/* Member Directory Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: '#FFFCF5',
                    border: '1px solid #E6D5D8',
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: '#F0DDE2',
                      border: '2px solid #E6D5D8',
                      margin: '0 auto 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#800020',
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#302329', marginBottom: '4px' }}>{member.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#800020', fontWeight: 600, marginBottom: '8px' }}>{member.role}</div>
                  <p style={{ fontSize: '0.8rem', color: '#6D5B60', marginBottom: '12px' }}>
                    {member.department || 'Sandip Foundation'} {member.year && `• ${member.year}`}
                  </p>
                  {member.bio && (
                    <p style={{ fontSize: '0.82rem', color: '#6D5B60', lineHeight: 1.4, marginBottom: '14px' }}>{member.bio}</p>
                  )}
                  {member.skills && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                      {member.skills.split(',').map((skill, idx) => (
                        <span key={idx} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: BLOGS & STORIES */}
        {activeTab === 'blogs' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#302329' }}>Founder Stories & Knowledge Hub</h2>
              <p style={{ color: '#6D5B60' }}>Insights, startup playbooks, and journey breakdowns written by mentors.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {blogs.map((b) => (
                <div key={b.id} className="glass-panel" style={{ padding: '24px', background: '#FFFCF5', border: '1px solid #E6D5D8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-purple">Case Study</span>
                    <span style={{ fontSize: '0.8rem', color: '#6D5B60' }}>
                      {new Date(b.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#302329', marginBottom: '8px' }}>{b.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6D5B60', lineHeight: 1.5, marginBottom: '16px' }}>{b.summary || b.excerpt}</p>
                  <div style={{ fontSize: '0.8rem', color: '#6D5B60', borderTop: '1px solid #F8F0DF', paddingTop: '12px' }}>
                    By <strong style={{ color: '#302329' }}>{b.authorName}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* LOGIN MODAL (STUDENT / MEMBER) */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(48, 35, 41, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '28px 30px',
              background: '#FFFCF5',
              border: '1px solid #E6D5D8',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(48, 35, 41, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="ecell-logo-footer-container" style={{ borderRadius: '8px', padding: '2px' }}>
                  <img src="/images/ecell-logo.jpeg" alt="Sandip E-Cell SITRC Official Logo" style={{ width: '40px', height: 'auto', objectFit: 'contain', display: 'block', borderRadius: '6px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#302329', lineHeight: 1.2 }}>
                    {authMode === 'login' ? 'Sign In to E-Cell' : 'Join E-Cell SITRC'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#6D5B60' }}>
                    Sandip Institute of Technology and Research Centre
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setShowLoginModal(false); setAuthError(''); }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px', color: '#6D5B60' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Auth Mode Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                marginBottom: '18px',
                background: '#F8F0DF',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid #E6D5D8',
              }}
            >
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: authMode === 'login' ? 700 : 600,
                  background: authMode === 'login' ? '#800020' : 'transparent',
                  color: authMode === 'login' ? '#FFFFFF' : '#6D5B60',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: authMode === 'login' ? '0 2px 6px rgba(128, 0, 32, 0.2)' : 'none',
                }}
              >
                <LogIn size={15} />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: authMode === 'register' ? 700 : 600,
                  background: authMode === 'register' ? '#800020' : 'transparent',
                  color: authMode === 'register' ? '#FFFFFF' : '#6D5B60',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: authMode === 'register' ? '0 2px 6px rgba(128, 0, 32, 0.2)' : 'none',
                }}
              >
                <UserPlus size={15} />
                Create Account
              </button>
            </div>

            {/* Error Notification */}
            {authError && (
              <div
                style={{
                  background: '#F0DDE2',
                  border: '1px solid #E6D5D8',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#800020',
                  fontSize: '0.84rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#302329', fontWeight: 600, marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student1@ecell.org"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#F8F0DF',
                      border: '1px solid #E6D5D8',
                      borderRadius: '8px',
                      color: '#302329',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#302329', fontWeight: 600, marginBottom: '6px' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        background: '#F8F0DF',
                        border: '1px solid #E6D5D8',
                        borderRadius: '8px',
                        color: '#302329',
                        outline: 'none',
                        fontSize: '0.9rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#800020',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6D5B60', marginBottom: '8px', fontWeight: 600 }}>
                    Quick Demo Credentials:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => quickFill('student1@ecell.org', 'Student@123')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      🎓 Student 1
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFill('member1@ecell.org', 'Member@123')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      💼 Member 1
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary"
                  style={{ padding: '12px', marginTop: '4px', opacity: authLoading ? 0.7 : 1 }}
                >
                  <LogIn size={16} />
                  {authLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6D5B60', marginTop: '6px' }}>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: '#800020', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#302329', fontWeight: 600, marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. Atharva Patil"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#F8F0DF',
                      border: '1px solid #E6D5D8',
                      borderRadius: '8px',
                      color: '#302329',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#302329', fontWeight: 600, marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="e.g. atharva.patil@sitrc.ac.in"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#F8F0DF',
                      border: '1px solid #E6D5D8',
                      borderRadius: '8px',
                      color: '#302329',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#302329', fontWeight: 600, marginBottom: '6px' }}>
                    Password * <span style={{ fontSize: '0.72rem', color: '#6D5B60', fontWeight: 400 }}>(min. 6 characters)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Create a secure password"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        background: '#F8F0DF',
                        border: '1px solid #E6D5D8',
                        borderRadius: '8px',
                        color: '#302329',
                        outline: 'none',
                        fontSize: '0.9rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#800020',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#302329', fontWeight: 600, marginBottom: '6px' }}>
                    Confirm Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegisterConfirmPassword ? 'text' : 'password'}
                      required
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        background: '#F8F0DF',
                        border: '1px solid #E6D5D8',
                        borderRadius: '8px',
                        color: '#302329',
                        outline: 'none',
                        fontSize: '0.9rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#800020',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={showRegisterConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary"
                  style={{ padding: '12px', marginTop: '4px', opacity: authLoading ? 0.7 : 1 }}
                >
                  <UserPlus size={16} />
                  {authLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6D5B60', marginTop: '6px' }}>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: '#800020', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Sign In here
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EVENT REGISTRATION MODAL */}
      {showRegisterModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(48, 35, 41, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '32px',
              background: '#FFFCF5',
              border: '1px solid #E6D5D8',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#302329' }}>Confirm Event Registration</h3>
              <button onClick={() => setShowRegisterModal(null)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1.1rem', color: '#800020', fontWeight: 700, marginBottom: '8px' }}>{showRegisterModal.title}</h4>
              <p style={{ fontSize: '0.85rem', color: '#6D5B60', lineHeight: 1.5 }}>
                {showRegisterModal.description}
              </p>
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#302329', background: '#F8F0DF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E6D5D8' }}>
                📍 Venue: {showRegisterModal.venue} <br />
                ⏰ Time: {showRegisterModal.startTime} - {showRegisterModal.endTime}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleRegister(showRegisterModal.id)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Confirm Registration
              </button>
              <button onClick={() => setShowRegisterModal(null)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Official Logo, Admin Login Link, Contact Us, Official Social Media Handles, and Developer Credit */}
      <footer
        style={{
          borderTop: '1px solid #E6D5D8',
          padding: '32px 24px 28px',
          marginTop: 'auto',
          background: '#F8F0DF',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Section 1: Logo, Copyright, Server Info and Discreet Admin Login */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.85rem',
              color: '#6D5B60',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="ecell-logo-footer-container">
                <img
                  src="/images/ecell-logo.jpeg"
                  alt="Sandip E-Cell SITRC Official Logo"
                  className="ecell-logo-footer-img"
                />
              </div>
              <div>
                © {new Date().getFullYear()} SITRC Entrepreneurship Cell (E-Cell). Sandip Institute of Technology and Research Centre, Nashik.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
              {import.meta.env.DEV ? (
                <>
                  <span>Backend: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}</span>
                  <span>Frontend: http://localhost:5173</span>
                </>
              ) : (
                <>
                  <span>E-Cell SITRC Official Platform</span>
                  <span>Status: Operational (v1.0)</span>
                </>
              )}
              {/* Discreet Admin Login Link */}
              <Link
                to="/admin/login"
                style={{
                  color: '#800020',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  borderLeft: '1px solid #E6D5D8',
                  paddingLeft: '16px',
                  fontWeight: 600,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#5C0018')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#800020')}
              >
                Admin Login
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #E6D5D8' }} />

          {/* Section 2: Contact Us Section */}
          <div className="footer-contact-section">
            <div className="footer-contact-header">
              <div className="footer-contact-title">
                <Phone size={18} color="#800020" />
                <span>Contact Us</span>
              </div>
              <div className="footer-contact-subtitle">
                Get in touch with our student coordinators for event queries, partnerships, and support
              </div>
            </div>

            <div className="footer-contact-cards">
              {/* Contact Person 1: Ayush Katkar */}
              <div className="footer-contact-card">
                <div className="footer-contact-icon-box" aria-hidden="true">
                  <Phone size={20} />
                </div>
                <div className="footer-contact-info">
                  <div className="footer-contact-name">Ayush Katkar</div>
                  <div className="footer-contact-role">Student Coordinator — E-Cell SITRC</div>
                  <a
                    href="tel:9049886082"
                    className="footer-contact-tel"
                    aria-label="Call Ayush Katkar at 9049886082"
                  >
                    <Phone size={14} /> +91 90498 86082
                  </a>
                </div>
              </div>

              {/* Contact Person 2: Ayush Sonawane */}
              <div className="footer-contact-card">
                <div className="footer-contact-icon-box" aria-hidden="true">
                  <Phone size={20} />
                </div>
                <div className="footer-contact-info">
                  <div className="footer-contact-name">Ayush Sonawane</div>
                  <div className="footer-contact-role">Student Coordinator — E-Cell SITRC</div>
                  <a
                    href="tel:7666088537"
                    className="footer-contact-tel"
                    aria-label="Call Ayush Sonawane at 7666088537"
                  >
                    <Phone size={14} /> +91 76660 88537
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #E6D5D8' }} />

          {/* Section 3: Connect With Us Section */}
          <div className="footer-social-section">
            <div className="footer-social-header">
              <div className="footer-social-title">
                <span>Connect With Us</span>
              </div>
              <div className="footer-social-subtitle">
                Follow our official updates & join our community
              </div>
            </div>

            <div className="footer-social-cards">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/e-cell-sitrc-026588378"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-card"
                aria-label="LinkedIn — Follow our professional updates"
              >
                <div className="footer-social-icon-box" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.5a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z"/>
                  </svg>
                </div>
                <div className="footer-social-info">
                  <div className="footer-social-platform">LinkedIn</div>
                  <div className="footer-social-desc">Follow our professional updates</div>
                </div>
                <ExternalLink size={16} className="footer-social-arrow" aria-hidden="true" />
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/ecell.sitrc/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-card"
                aria-label="Instagram — Explore our events and activities"
              >
                <div className="footer-social-icon-box" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div className="footer-social-info">
                  <div className="footer-social-platform">Instagram</div>
                  <div className="footer-social-desc">Explore our events and activities</div>
                </div>
                <ExternalLink size={16} className="footer-social-arrow" aria-hidden="true" />
              </a>

              {/* WhatsApp Community */}
              <a
                href="https://chat.whatsapp.com/HXklYqEm0pdGDO9djphTtC"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-card"
                aria-label="WhatsApp Community — Join our community"
              >
                <div className="footer-social-icon-box" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.04C9.36 7.04 9.09 7.1 8.87 7.34C8.64 7.58 8 8.18 8 9.4C8 10.62 8.89 11.8 9.01 11.96C9.14 12.12 10.74 14.6 13.21 15.67C15.26 16.56 15.68 16.38 16.13 16.34C16.58 16.3 17.58 15.75 17.78 15.18C17.98 14.61 17.98 14.12 17.92 14.02C17.86 13.92 17.71 13.86 17.48 13.75C17.26 13.63 16.16 13.1 15.96 13.02C15.75 12.95 15.6 12.91 15.45 13.14C15.3 13.36 14.87 13.86 14.74 14.02C14.61 14.17 14.49 14.19 14.26 14.08C14.04 13.96 13.1 13.65 11.98 12.65C11.11 11.87 10.52 10.91 10.4 10.7C10.29 10.48 10.39 10.36 10.5 10.25C10.6 10.15 10.73 9.98 10.84 9.84C10.95 9.71 10.99 9.61 11.06 9.46C11.14 9.32 11.1 9.19 11.05 9.09C10.99 8.98 10.55 7.89 10.37 7.44C10.19 7 10.01 7.06 9.87 7.05C9.74 7.04 9.58 7.04 9.53 7.04Z"/>
                  </svg>
                </div>
                <div className="footer-social-info">
                  <div className="footer-social-platform">WhatsApp Community</div>
                  <div className="footer-social-desc">Join our community</div>
                </div>
                <ExternalLink size={16} className="footer-social-arrow" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Thin Divider above Developer Credit */}
          <div style={{ borderTop: '1px solid #E6D5D8' }} />

          {/* Section 4: Website Developer Credit at the Very Bottom */}
          <div className="footer-developer-credit">
            <div className="footer-dev-left">
              <div className="footer-dev-avatar" aria-hidden="true">
                PS
              </div>
              <div>
                <div className="footer-dev-tagline">Website Designed & Developed By</div>
                <div className="footer-dev-name">Pranav Suryawanshi</div>
                <div className="footer-dev-role">Website Developer — E-Cell SITRC</div>
              </div>
            </div>

            <div className="footer-dev-actions">
              <a
                href="tel:9545010200"
                className="footer-dev-tel"
                aria-label="Call developer Pranav Suryawanshi at 9545010200"
              >
                <Phone size={14} />
                <span>+91 95450 10200</span>
              </a>

              <a
                href="https://www.linkedin.com/in/pranav-suryawanshi-86b0b532a"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-dev-linkedin"
                aria-label="Connect on LinkedIn with Pranav Suryawanshi"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.5a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z"/>
                </svg>
                <span>Connect on LinkedIn</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =====================================================================
// ROOT APP COMPONENT WITH BROWSER ROUTING
// =====================================================================

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<PublicWebsite />} />
      </Routes>
    </BrowserRouter>
  );
}
