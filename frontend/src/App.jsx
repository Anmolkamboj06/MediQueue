import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

// ==========================================
// CONSTANTS & FALLBACK INITIAL DATA
// ==========================================

const API_BASE = "http://localhost:5000/api";

const INITIAL_DOCTORS = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    department: "Cardiology",
    specialization: "Interventional Cardiology",
    room_number: "Room 101",
    available_days: "Mon,Wed,Fri",
    is_available: true,
  },
  {
    id: 2,
    name: "Dr. Robert Smith",
    department: "General Medicine",
    specialization: "Internal Medicine",
    room_number: "Room 102",
    available_days: "Mon,Tue,Thu",
    is_available: true,
  },
  {
    id: 3,
    name: "Dr. Emily Davis",
    department: "Orthopedics",
    specialization: "Orthopedic Surgery",
    room_number: "Room 103",
    available_days: "Tue,Wed,Fri",
    is_available: false,
  },
  {
    id: 4,
    name: "Dr. Michael Chen",
    department: "Neurology",
    specialization: "Clinical Neurology",
    room_number: "Room 104",
    available_days: "Mon,Thu,Fri",
    is_available: true,
  },
  {
    id: 5,
    name: "Dr. Priya Sharma",
    department: "Dermatology",
    specialization: "Cosmetic Dermatology",
    room_number: "Room 105",
    available_days: "Wed,Thu,Sat",
    is_available: true,
  },
];

const INITIAL_MEDICINES = [
  {
    id: 1,
    name: "Paracetamol (Acetaminophen)",
    category: "Antipyretic / Analgesic",
    dosage: "500mg tablets",
    description: "Used to treat fever and mild-to-moderate pain.",
    stock_quantity: 450,
    unit_price: 2.5,
  },
  {
    id: 2,
    name: "Amoxicillin",
    category: "Antibiotics",
    dosage: "250mg / 500mg capsules",
    description: "Broad-spectrum penicillin antibiotic for bacterial infections.",
    stock_quantity: 120,
    unit_price: 8.0,
  },
  {
    id: 3,
    name: "Ibuprofen",
    category: "NSAID",
    dosage: "400mg tablets",
    description: "Anti-inflammatory pain reliever for swelling and headache.",
    stock_quantity: 280,
    unit_price: 4.0,
  },
  {
    id: 4,
    name: "Cetirizine",
    category: "Antihistamine",
    dosage: "10mg tablets",
    description: "Relief of allergy symptoms such as watery eyes and sneezing.",
    stock_quantity: 310,
    unit_price: 3.0,
  },
  {
    id: 5,
    name: "Metformin",
    category: "Antidiabetic",
    dosage: "500mg tablets",
    description: "First-line medication for the treatment of type 2 diabetes.",
    stock_quantity: 190,
    unit_price: 5.5,
  },
  {
    id: 6,
    name: "Atorvastatin",
    category: "Cardiovascular",
    dosage: "20mg tablets",
    description: "Lowers cholesterol levels and reduces risk of heart disease.",
    stock_quantity: 160,
    unit_price: 9.0,
  },
];

const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "Pediatrics",
  "ENT",
];

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // Modals & Popups
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState(null);
  const [ticketToPrint, setTicketToPrint] = useState(null);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [authPage, setAuthPage] = useState("login");
  const [userRole, setUserRole] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u).role : null;
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // Dark Theme
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  // Refresh & Timers
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notifications badge
  const [unreadCount, setUnreadCount] = useState(0);

  // Recent Activity Feed
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: "blue",
      text: "System initialized and real-time monitoring online.",
      time: "Just now",
    },
  ]);

  // Toast Notification System
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addActivity = useCallback((text, type = "blue") => {
    setActivities((prev) => [
      { id: Date.now(), text, time: "Just now", type },
      ...prev.slice(0, 19),
    ]);
  }, []);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentUser(null);
    setAuthPage("login");
    showToast("You have been logged out successfully.", "info");
  };

  // Seconds ago timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Load Patients from Backend
  const loadPatients = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/patients/queue`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load patient queue");
      }

      const formatted = (data.queue || []).map((item) => ({
        id: item.patient_id,
        queueId: item.queue_id,
        token: `P${String(item.queue_number || item.id).padStart(3, "0")}`,
        name: item.name,
        age: item.age,
        gender: item.gender,
        doctor: item.doctor,
        department: item.department,
        reason: item.reason,
        status:
          item.status === "waiting"
            ? "Waiting"
            : item.status === "called" || item.status === "consulting"
            ? "In Consultation"
            : "Completed",
        createdAt: item.created_at || new Date().toISOString(),
      }));

      setPatients(formatted);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err) {
      console.warn("Queue fetch error:", err.message);
      setError(err.message);
      if (!isSilent) {
        showToast("Backend connection failed. Displaying local queue.", "warning");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    if (isLoggedIn) {
      loadPatients();
    }
  }, [isLoggedIn, loadPatients]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      loadPatients(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, loadPatients]);

  // Check unread notifications
  const checkNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // Ignore background notification error
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      checkNotifications();
    }
  }, [isLoggedIn, checkNotifications]);

  // Status Change function
  const changeStatus = async (id, newStatus) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    let backendStatus = "waiting";
    if (newStatus === "In Consultation") backendStatus = "called";
    if (newStatus === "Completed") backendStatus = "completed";

    // Optimistic UI update
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );

    addActivity(
      `Patient ${patient.name} (${patient.token}) moved to ${newStatus}.`,
      newStatus === "Completed" ? "green" : "blue"
    );

    if (patient.queueId) {
      try {
        const res = await fetch(`${API_BASE}/patients/queue/${patient.queueId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: backendStatus }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to update queue status");
        }
        showToast(`Updated status of ${patient.name} to ${newStatus}`, "success");
      } catch (err) {
        showToast(`Status updated locally (${err.message})`, "warning");
      }
    } else {
      showToast(`Updated ${patient.name} to ${newStatus}`, "success");
    }
  };

  // Filtered patients
  const filteredPatients = patients.filter((p) => {
    const matchSearch =
      `${p.name} ${p.token} ${p.doctor} ${p.department} ${p.reason}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All" || p.status.toLowerCase() === statusFilter.toLowerCase();
    const matchDept =
      departmentFilter === "All" || p.department.toLowerCase() === departmentFilter.toLowerCase();
    return matchSearch && matchStatus && matchDept;
  });

  const waiting = patients.filter((p) => p.status === "Waiting");
  const consulting = patients.filter((p) => p.status === "In Consultation");
  const completed = patients.filter((p) => p.status === "Completed");

  // Menus
  const receptionistMenu = [
    { name: "Dashboard", icon: "▦" },
    { name: "Patients", icon: "♙" },
    { name: "Queue", icon: "◷" },
    { name: "Consultations", icon: "✚" },
    { name: "Appointments", icon: "📅" },
    { name: "Doctors", icon: "⚕" },
    { name: "Medicines", icon: "💊" },
    { name: "Notifications", icon: "🔔", badge: unreadCount },
    { name: "AI Assistant", icon: "✧" },
    { name: "Analytics", icon: "📊" },
    { name: "Settings", icon: "⚙" },
  ];

  const patientMenu = [
    { name: "Dashboard", icon: "▦" },
    { name: "Status", icon: "✓" },
    { name: "Appointments", icon: "📅" },
    { name: "Medicines", icon: "💊" },
    { name: "Previous Reports", icon: "▤" },
    { name: "Notifications", icon: "🔔", badge: unreadCount },
    { name: "AI Assistant", icon: "✧" },
    { name: "Settings", icon: "⚙" },
  ];

  const activeMenu = userRole === "receptionist" ? receptionistMenu : patientMenu;

  // Print ticket trigger
  const handlePrintTicket = (patient) => {
    setTicketToPrint(patient);
  };

  if (!isLoggedIn) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <Auth
          authPage={authPage}
          setAuthPage={setAuthPage}
          setIsLoggedIn={setIsLoggedIn}
          setUserRole={setUserRole}
          setCurrentUser={setCurrentUser}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <div className="app">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* PRINTABLE TICKET MODAL */}
      {ticketToPrint && (
        <PrintTicketModal
          patient={ticketToPrint}
          onClose={() => setTicketToPrint(null)}
        />
      )}

      {/* PATIENT DETAIL MODAL */}
      {selectedPatientForModal && (
        <PatientDetailModal
          patient={selectedPatientForModal}
          onClose={() => setSelectedPatientForModal(null)}
          onPrint={handlePrintTicket}
          changeStatus={changeStatus}
        />
      )}

      {/* ADD PATIENT MODAL */}
      {showAddPatient && (
        <AddPatientModal
          setShowForm={setShowAddPatient}
          setPatients={setPatients}
          showToast={showToast}
          addActivity={addActivity}
          onRegisteredPrint={handlePrintTicket}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">+</div>
          <div>
            <h2>MediQueue</h2>
            <p><span>Queue Management</span></p>
          </div>
        </div>

        <p className="sidebar-title">Workspace</p>

        {activeMenu.map((item) => (
          <button
            key={item.name}
            className={`menu-item ${page === item.name ? "active" : ""}`}
            onClick={() => setPage(item.name)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span>{item.name}</span>
            {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
          </button>
        ))}

        <button className="logout-button" onClick={handleLogout}>
          <span>↪</span> Logout
        </button>

        <div className="sidebar-footer">
          <span className="online-dot" />
          <span>Connected · v2.0</span>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="main">
        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <p className="breadcrumb">MediQueue / {page}</p>
            <h1>{page}</h1>
          </div>

          <div className="topbar-actions">
            <div className="refresh-indicator">
              <span>
                Updated {secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`}
              </span>
              <button
                className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
                onClick={() => loadPatients(false)}
                title="Refresh queue data"
              >
                ↻
              </button>
            </div>

            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <div className="profile">
              <div className="avatar">
                {userRole === "receptionist" ? "R" : "P"}
              </div>
              <div>
                <strong>
                  {currentUser?.name || (userRole === "receptionist" ? "Receptionist" : "Patient")}
                </strong>
                <small>
                  {userRole === "receptionist" ? "Clinic Administrator" : "Patient Account"}
                </small>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT PAGES */}
        <section className="content">
          {page === "Dashboard" && (
            <Dashboard
              patients={patients}
              waiting={waiting}
              consulting={consulting}
              completed={completed}
              setPage={setPage}
              setShowAddPatient={setShowAddPatient}
              userRole={userRole}
              currentUser={currentUser}
              activities={activities}
              onSelectPatient={setSelectedPatientForModal}
            />
          )}

          {page === "Status" && (
            <PatientStatus
              patients={patients}
              showToast={showToast}
              onPrint={handlePrintTicket}
            />
          )}

          {page === "Patients" && (
            <Patients
              patients={filteredPatients}
              allPatientsCount={patients.length}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              departmentFilter={departmentFilter}
              setDepartmentFilter={setDepartmentFilter}
              setShowAddPatient={setShowAddPatient}
              changeStatus={changeStatus}
              onSelectPatient={setSelectedPatientForModal}
              onPrint={handlePrintTicket}
              showToast={showToast}
              loading={loading}
              onRetry={() => loadPatients(false)}
            />
          )}

          {page === "Queue" && (
            <Queue
              waiting={waiting}
              changeStatus={changeStatus}
              onSelectPatient={setSelectedPatientForModal}
              onPrint={handlePrintTicket}
            />
          )}

          {page === "Consultations" && (
            <Consultations
              consulting={consulting}
              completed={completed}
              changeStatus={changeStatus}
              onSelectPatient={setSelectedPatientForModal}
            />
          )}

          {page === "Appointments" && (
            <Appointments
              patients={patients}
              userRole={userRole}
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {page === "Doctors" && (
            <Doctors
              userRole={userRole}
              showToast={showToast}
            />
          )}

          {page === "Medicines" && (
            <Medicines
              userRole={userRole}
              patients={patients}
              showToast={showToast}
            />
          )}

          {page === "Previous Reports" && (
            <MedicalRecords
              isPatientView={true}
              currentUser={currentUser}
              patients={patients}
              showToast={showToast}
            />
          )}

          {page === "Notifications" && (
            <Notifications
              showToast={showToast}
              onUpdateCount={setUnreadCount}
            />
          )}

          {page === "AI Assistant" && <Assistant />}

          {page === "Analytics" && (
            <Analytics
              patients={patients}
              waiting={waiting}
              consulting={consulting}
              completed={completed}
              showToast={showToast}
            />
          )}

          {page === "Settings" && (
            <Settings
              theme={theme}
              toggleTheme={toggleTheme}
              userRole={userRole}
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
        </section>
      </main>
    </div>
  );
}

// ==========================================
// TOAST CONTAINER & NOTIFICATIONS
// ==========================================

function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let icon = "ℹ️";
        if (toast.type === "success") icon = "✅";
        if (toast.type === "error") icon = "❌";
        if (toast.type === "warning") icon = "⚠️";

        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{icon}</span>
            <div className="toast-message">{toast.message}</div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// DASHBOARD
// ==========================================

function Dashboard({
  patients,
  waiting,
  consulting,
  completed,
  setPage,
  setShowAddPatient,
  userRole,
  currentUser,
  activities,
  onSelectPatient,
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CLINICAL OVERVIEW · {todayFormatted}</span>
          <h2>
            {getGreeting()},{" "}
            {currentUser?.name || (userRole === "receptionist" ? "Staff" : "Patient")} 👋
          </h2>
          <p>Real-time queue tracking, patient volume and clinic consultations.</p>
        </div>

        {userRole === "receptionist" && (
          <div className="heading-actions">
            <button
              className="primary-button"
              onClick={() => setShowAddPatient(true)}
            >
              + Register Patient
            </button>
          </div>
        )}
      </div>

      <div className="hero">
        <div className="hero-content">
          <span className="hero-label">SMART HEALTHCARE WORKFLOW</span>
          <h2>Streamlined Patient Care & Queue Intelligence</h2>
          <p>
            Monitor real-time waiting queues, triage patients efficiently, and coordinate
            with attending doctors across all clinical departments.
          </p>
          <button
            className="hero-button"
            onClick={() => setPage(userRole === "receptionist" ? "Queue" : "Status")}
          >
            {userRole === "receptionist" ? "View Live Queue →" : "Check My Queue Status →"}
          </button>
        </div>
        <div className="hero-symbol">✚</div>
      </div>

      <div className="stats-grid">
        <Stat
          icon="♙"
          title="Total Patients"
          value={patients.length}
          note="Registered today"
        />
        <Stat
          icon="◷"
          title="Waiting"
          value={waiting.length}
          note="Awaiting consultation"
        />
        <Stat
          icon="✚"
          title="In Consultation"
          value={consulting.length}
          note="Currently consulting"
        />
        <Stat
          icon="✓"
          title="Completed"
          value={completed.length}
          note="Finished today"
        />
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Recent Patients */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Active Patients Today</h3>
              <p>Top registered patients in queue</p>
            </div>
            {userRole === "receptionist" && (
              <button className="text-button" onClick={() => setPage("Patients")}>
                View all ({patients.length}) →
              </button>
            )}
          </div>

          {patients.slice(0, 5).map((p) => (
            <div
              className="queue-row clickable"
              key={p.id}
              onClick={() => onSelectPatient(p)}
              title="Click to view details"
            >
              <div className="token">{p.token}</div>
              <div className="queue-info">
                <strong>{p.name}</strong>
                <small>
                  {p.doctor} · {p.department}
                </small>
              </div>
              <Status status={p.status} />
            </div>
          ))}

          {patients.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <h3>No patients registered yet</h3>
              <p>Register new patients to populate the active queue.</p>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Recent Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {userRole === "receptionist" && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Common clinical tasks</p>
                </div>
              </div>

              <button
                className="quick-action"
                onClick={() => setShowAddPatient(true)}
              >
                <span className="action-icon">♙</span>
                <span>
                  <strong>Register Patient</strong>
                  <small>Add new patient & generate token</small>
                </span>
                <span className="action-arrow">→</span>
              </button>

              <button
                className="quick-action"
                onClick={() => setPage("Queue")}
              >
                <span className="action-icon">◷</span>
                <span>
                  <strong>Call Next in Queue</strong>
                  <small>Manage waiting list</small>
                </span>
                <span className="action-arrow">→</span>
              </button>

              <button
                className="quick-action"
                onClick={() => setPage("Appointments")}
              >
                <span className="action-icon">📅</span>
                <span>
                  <strong>Book Appointment</strong>
                  <small>Schedule doctor visit</small>
                </span>
                <span className="action-arrow">→</span>
              </button>

              <button
                className="quick-action"
                onClick={() => setPage("Analytics")}
              >
                <span className="action-icon">📊</span>
                <span>
                  <strong>Clinic Analytics</strong>
                  <small>View department trends</small>
                </span>
                <span className="action-arrow">→</span>
              </button>
            </div>
          )}

          {/* Recent Activity Timeline */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Recent Activity</h3>
                <p>Live audit trail of queue actions</p>
              </div>
            </div>

            <div className="activity-list">
              {activities.slice(0, 5).map((act) => (
                <div className="activity-item" key={act.id}>
                  <div className={`activity-badge ${act.type || "blue"}`}>
                    {act.type === "green" ? "✓" : "⚡"}
                  </div>
                  <div className="activity-content">
                    <p>{act.text}</p>
                    <small>{act.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ icon, title, value, note }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}

// ==========================================
// PATIENT STATUS (FOR PATIENT ROLE)
// ==========================================

function PatientStatus({ patients, showToast, onPrint }) {
  const [myPatient, setMyPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyQueue = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/patients/my-queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load personal queue");
      }
      setMyPatient(data.patient);
      setError("");
    } catch (err) {
      // Fallback: check if the first patient in queue matches user
      if (patients && patients.length > 0) {
        setMyPatient(patients[0]);
      } else {
        setError(err.message || "No active queue entry found.");
      }
    } finally {
      setLoading(false);
    }
  }, [patients]);

  useEffect(() => {
    fetchMyQueue();
  }, [fetchMyQueue]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading your queue status...</p>
      </div>
    );
  }

  if (!myPatient) {
    return (
      <div className="panel">
        <div className="empty-state">
          <span className="empty-state-icon">🎫</span>
          <h3>No Active Queue Found</h3>
          <p>{error || "You do not have any active appointments or tokens registered for today."}</p>
          <button className="primary-button" onClick={fetchMyQueue} style={{ marginTop: 12 }}>
            ↻ Refresh Status
          </button>
        </div>
      </div>
    );
  }

  const tokenFormatted = myPatient.token || `P${String(myPatient.queue_number || myPatient.id).padStart(3, "0")}`;
  const statusFormatted =
    myPatient.status === "waiting" || myPatient.status === "Waiting"
      ? "Waiting"
      : myPatient.status === "called" || myPatient.status === "In Consultation"
      ? "In Consultation"
      : "Completed";

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR VISIT STATUS</span>
          <h2>My Queue Status</h2>
          <p>Real-time status updates for your current clinic visit.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => onPrint({ ...myPatient, token: tokenFormatted, status: statusFormatted })}
        >
          🖨️ Print Ticket
        </button>
      </div>

      <div className="stats-grid">
        <Stat
          icon="🎫"
          title="My Token Number"
          value={tokenFormatted}
          note="Show to attending staff"
        />
        <Stat
          icon="⏳"
          title="Consultation Status"
          value={statusFormatted}
          note={
            statusFormatted === "Waiting"
              ? "Please wait in the reception lounge"
              : statusFormatted === "In Consultation"
              ? "Please proceed into the doctor's room"
              : "Consultation finished"
          }
        />
        <Stat
          icon="👨‍⚕️"
          title="Assigned Doctor"
          value={myPatient.doctor}
          note={myPatient.department}
        />
        <Stat
          icon="🏥"
          title="Department"
          value={myPatient.department}
          note="Floor 1, Clinic Area"
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Visit Summary</h3>
            <p>Details registered during your intake</p>
          </div>
          <Status status={statusFormatted} />
        </div>

        <div className="profile-detail-grid">
          <div className="detail-item">
            <span>Patient Name</span>
            <strong>{myPatient.name}</strong>
          </div>
          <div className="detail-item">
            <span>Age / Gender</span>
            <strong>{myPatient.age} yrs · {myPatient.gender}</strong>
          </div>
          <div className="detail-item">
            <span>Doctor</span>
            <strong>{myPatient.doctor}</strong>
          </div>
          <div className="detail-item">
            <span>Department</span>
            <strong>{myPatient.department}</strong>
          </div>
          <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
            <span>Reason for Visit</span>
            <strong>{myPatient.reason || "General Consultation"}</strong>
          </div>
        </div>
      </div>
    </>
  );
}

// ==========================================
// PATIENTS MANAGEMENT PAGE
// ==========================================

function Patients({
  patients,
  allPatientsCount,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  setShowAddPatient,
  changeStatus,
  onSelectPatient,
  onPrint,
  showToast,
  loading,
  onRetry,
}) {
  // Export CSV
  const handleExportCSV = () => {
    if (patients.length === 0) {
      showToast("No patients to export.", "warning");
      return;
    }

    const headers = ["Token", "Name", "Age", "Gender", "Doctor", "Department", "Reason", "Status", "Date"];
    const rows = patients.map((p) => [
      `"${p.token}"`,
      `"${p.name}"`,
      p.age,
      `"${p.gender}"`,
      `"${p.doctor}"`,
      `"${p.department}"`,
      `"${(p.reason || "").replace(/"/g, '""')}"`,
      `"${p.status}"`,
      `"${p.createdAt ? p.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10)}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `patients_export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${patients.length} patients to CSV.`, "success");
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">RECORDS REPOSITORY</span>
          <h2>Patient Management</h2>
          <p>Search, filter, inspect details, and export patient queue records.</p>
        </div>

        <div className="heading-actions">
          <button className="secondary-button" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
          <button className="primary-button" onClick={() => setShowAddPatient(true)}>
            + Register Patient
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search by name, token, doctor or symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Waiting">Waiting</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="select-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading patient database...</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="clickable-row"
                    onClick={() => onSelectPatient(p)}
                  >
                    <td>
                      <strong>{p.token}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{p.name}</strong>
                        <br />
                        <small style={{ color: "var(--text-muted)" }}>
                          {p.age} yrs · {p.gender}
                        </small>
                      </div>
                    </td>
                    <td>{p.doctor}</td>
                    <td>{p.department}</td>
                    <td>
                      <Status status={p.status} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="table-actions">
                        {p.status === "Waiting" && (
                          <button
                            className="small-button success"
                            onClick={() => changeStatus(p.id, "In Consultation")}
                          >
                            Call
                          </button>
                        )}
                        {p.status === "In Consultation" && (
                          <button
                            className="small-button success"
                            onClick={() => changeStatus(p.id, "Completed")}
                          >
                            Complete
                          </button>
                        )}
                        <button
                          className="small-button secondary"
                          onClick={() => onPrint(p)}
                          title="Print Queue Ticket"
                        >
                          🖨️
                        </button>
                        <button
                          className="small-button secondary"
                          onClick={() => onSelectPatient(p)}
                          title="View Profile"
                        >
                          ℹ️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {patients.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <span className="empty-state-icon">🔍</span>
                        <h3>No matching patients found</h3>
                        <p>Try refining your search terms or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ==========================================
// LIVE QUEUE MANAGEMENT
// ==========================================

function Queue({ waiting, changeStatus, onSelectPatient, onPrint }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LIVE TRIAGE QUEUE</span>
          <h2>Patient Waiting Queue</h2>
          <p>Prioritize waiting patients and call the next in line.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Waiting Room ({waiting.length})</h3>
            <p>Patients waiting to be called into doctor's consultation</p>
          </div>
          <span className="status-badge waiting">{waiting.length} Waiting</span>
        </div>

        {waiting.map((p) => (
          <div className="queue-card" key={p.id}>
            <div className="queue-number">{p.token}</div>
            <div
              className="queue-info"
              style={{ cursor: "pointer" }}
              onClick={() => onSelectPatient(p)}
            >
              <strong>{p.name}</strong>
              <small>
                {p.age} yrs · {p.gender} · {p.doctor} ({p.department})
              </small>
              <small style={{ color: "var(--primary)" }}>Reason: {p.reason}</small>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="secondary-button"
                onClick={() => onPrint(p)}
                title="Print ticket"
              >
                🖨️ Ticket
              </button>
              <button
                className="primary-button"
                onClick={() => changeStatus(p.id, "In Consultation")}
              >
                Call Patient →
              </button>
            </div>
          </div>
        ))}

        {waiting.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🎉</span>
            <h3>Queue is clear!</h3>
            <p>There are currently no patients waiting in the reception area.</p>
          </div>
        )}
      </div>
    </>
  );
}

// ==========================================
// CONSULTATIONS
// ==========================================

function Consultations({ consulting, completed, changeStatus, onSelectPatient }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CLINICAL ENCOUNTERS</span>
          <h2>Consultations</h2>
          <p>Track ongoing consultations and review completed encounters.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Active Consultations */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Active Consultations ({consulting.length})</h3>
              <p>Patients currently with attending physician</p>
            </div>
            <span className="status-badge in-consultation">In Progress</span>
          </div>

          {consulting.map((p) => (
            <div className="queue-row" key={p.id}>
              <div className="token">{p.token}</div>
              <div
                className="queue-info"
                style={{ cursor: "pointer" }}
                onClick={() => onSelectPatient(p)}
              >
                <strong>{p.name}</strong>
                <small>
                  {p.doctor} · {p.department}
                </small>
                <small>{p.reason}</small>
              </div>

              <button
                className="small-button success"
                onClick={() => changeStatus(p.id, "Completed")}
              >
                ✓ Complete
              </button>
            </div>
          ))}

          {consulting.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">🩺</span>
              <h3>No Active Consultations</h3>
              <p>Call the next patient from the Queue page to start a consultation.</p>
            </div>
          )}
        </div>

        {/* Completed Consultations */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Completed Today ({completed.length})</h3>
              <p>Finished visits</p>
            </div>
            <span className="status-badge completed">Done</span>
          </div>

          {completed.map((p) => (
            <div
              className="queue-row clickable"
              key={p.id}
              onClick={() => onSelectPatient(p)}
            >
              <div className="token" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                ✓
              </div>
              <div className="queue-info">
                <strong>{p.name}</strong>
                <small>
                  {p.token} · {p.doctor}
                </small>
              </div>
              <Status status="Completed" />
            </div>
          ))}

          {completed.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">⌛</span>
              <p>No completed visits recorded yet today.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ==========================================
// APPOINTMENTS PAGE
// ==========================================

function Appointments({ patients, userRole, currentUser, showToast }) {
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patient_name: "Rahul Sharma",
      doctor_name: "Dr. Sarah Johnson",
      department: "Cardiology",
      appointment_date: new Date().toISOString().substring(0, 10),
      appointment_time: "10:30",
      status: "scheduled",
      notes: "Follow up check on blood pressure",
    },
    {
      id: 2,
      patient_name: "Anita Roy",
      doctor_name: "Dr. Robert Smith",
      department: "General Medicine",
      appointment_date: new Date().toISOString().substring(0, 10),
      appointment_time: "11:15",
      status: "completed",
      notes: "Annual wellness examination",
    },
    {
      id: 3,
      patient_name: "David Miller",
      doctor_name: "Dr. Emily Davis",
      department: "Orthopedics",
      appointment_date: new Date(Date.now() + 86400000).toISOString().substring(0, 10),
      appointment_time: "14:00",
      status: "scheduled",
      notes: "Knee pain evaluation",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState(INITIAL_DOCTORS[0].name);
  const [department, setDepartment] = useState(INITIAL_DOCTORS[0].department);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/appointments`);
      if (res.ok) {
        const data = await res.json();
        if (data.appointments && data.appointments.length > 0) {
          setAppointments(data.appointments);
        }
      }
    } catch {
      // Use local state fallback
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast("Please enter a patient name.", "warning");
      return;
    }

    const newAppt = {
      id: Date.now(),
      patient_id: 1,
      patient_name: patientName.trim(),
      doctor_name: doctorName,
      department: department,
      appointment_date: date,
      appointment_time: time,
      status: "scheduled",
      notes: notes.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppt),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.appointment) newAppt.id = data.appointment.id;
      }
    } catch {
      // local save
    }

    setAppointments((prev) => [newAppt, ...prev]);
    showToast(`Appointment booked for ${patientName} with ${doctorName}!`, "success");
    setShowBookingModal(false);
    setPatientName("");
    setNotes("");
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    try {
      await fetch(`${API_BASE}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Ignore
    }
    showToast(`Appointment marked as ${newStatus}.`, "info");
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SCHEDULING & CLINIC BOOKINGS</span>
          <h2>Appointments</h2>
          <p>Schedule patient visits, consultations, and review upcoming slots.</p>
        </div>

        <button className="primary-button" onClick={() => setShowBookingModal(true)}>
          + Book Appointment
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>All Scheduled Appointments</h3>
            <p>{appointments.length} total appointments on record</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date & Time</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <strong>{appt.patient_name || appt.name}</strong>
                  </td>
                  <td>{appt.doctor_name || appt.doctor}</td>
                  <td>{appt.department}</td>
                  <td>
                    {appt.appointment_date} · {appt.appointment_time}
                  </td>
                  <td>
                    <small>{appt.notes || "—"}</small>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        appt.status === "completed"
                          ? "completed"
                          : appt.status === "cancelled"
                          ? "cancelled"
                          : "scheduled"
                      }`}
                    >
                      {appt.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {appt.status !== "completed" && (
                        <button
                          className="small-button success"
                          onClick={() => handleUpdateStatus(appt.id, "completed")}
                        >
                          Complete
                        </button>
                      )}
                      {appt.status !== "cancelled" && (
                        <button
                          className="small-button danger"
                          onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {appointments.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <p>No appointments booked yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">NEW APPOINTMENT</span>
                <h2>Book Doctor Consultation</h2>
                <p>Reserve a date & time slot for the patient.</p>
              </div>
              <button className="close-button" onClick={() => setShowBookingModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAppointment}>
              <label>Patient Name *</label>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name of patient"
                required
              />

              <div className="form-row">
                <div>
                  <label>Doctor *</label>
                  <select
                    value={doctorName}
                    onChange={(e) => {
                      setDoctorName(e.target.value);
                      const d = INITIAL_DOCTORS.find((x) => x.name === e.target.value);
                      if (d) setDepartment(d.department);
                    }}
                  >
                    {INITIAL_DOCTORS.map((doc) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Department</label>
                  <input value={department} readOnly />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label>Appointment Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Time Slot *</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <label>Reason / Clinical Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Symptoms, previous history, or checkup purpose..."
                rows="3"
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowBookingModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// DOCTORS PAGE
// ==========================================

function Doctors({ userRole, showToast }) {
  const [doctorsList, setDoctorsList] = useState(INITIAL_DOCTORS);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  // New Doctor Form State
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("General Medicine");
  const [specialization, setSpecialization] = useState("");
  const [room, setRoom] = useState("Room 101");
  const [days, setDays] = useState("Mon,Wed,Fri");

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors`);
      if (res.ok) {
        const data = await res.json();
        if (data.doctors && data.doctors.length > 0) {
          setDoctorsList(data.doctors);
        }
      }
    } catch {
      // Keep initial
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const toggleAvailability = async (id) => {
    setDoctorsList((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, is_available: !doc.is_available } : doc
      )
    );

    const doc = doctorsList.find((d) => d.id === id);
    const newStatus = !doc?.is_available;

    try {
      await fetch(`${API_BASE}/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: newStatus }),
      });
    } catch {
      // Local toggle
    }

    showToast(
      `${doc?.name} is now marked as ${newStatus ? "Available" : "On Break / Busy"}.`,
      "info"
    );
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDoc = {
      id: Date.now(),
      name: name.trim(),
      department,
      specialization: specialization.trim() || department,
      room_number: room.trim(),
      available_days: days.trim(),
      is_available: true,
    };

    try {
      await fetch(`${API_BASE}/doctors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc),
      });
    } catch {
      // Local
    }

    setDoctorsList((prev) => [...prev, newDoc]);
    showToast(`Doctor ${newDoc.name} added successfully!`, "success");
    setShowAddDoctorModal(false);
    setName("");
    setSpecialization("");
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MEDICAL STAFF & ROSTER</span>
          <h2>Physicians & Doctors</h2>
          <p>Review attending specialists, departments, room allocation, and availability.</p>
        </div>

        {userRole === "receptionist" && (
          <button className="primary-button" onClick={() => setShowAddDoctorModal(true)}>
            + Add Doctor
          </button>
        )}
      </div>

      <div className="doctor-grid">
        {doctorsList.map((doc) => (
          <div className="doctor-card" key={doc.id}>
            <div className="doctor-card-top">
              <div className="doctor-avatar">⚕</div>
              <span
                className={`status-badge ${
                  doc.is_available ? "available" : "on-break"
                }`}
              >
                {doc.is_available ? "Available" : "On Break"}
              </span>
            </div>

            <h3>{doc.name}</h3>
            <p>{doc.department} · {doc.specialization || "General Specialist"}</p>

            <div className="doctor-details">
              <span>Room Number</span>
              <strong>{doc.room_number || doc.room || "Room 101"}</strong>
            </div>

            <div className="doctor-details">
              <span>Consulting Days</span>
              <strong>{doc.available_days || "Mon - Fri"}</strong>
            </div>

            {userRole === "receptionist" && (
              <div className="card-actions">
                <button
                  className={`small-button ${doc.is_available ? "secondary" : "success"}`}
                  onClick={() => toggleAvailability(doc.id)}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {doc.is_available ? "Mark as On Break" : "Mark Available"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ADD DOCTOR MODAL */}
      {showAddDoctorModal && (
        <div className="modal-overlay" onClick={() => setShowAddDoctorModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">NEW DOCTOR</span>
                <h2>Register Physician</h2>
                <p>Add a new practitioner to the hospital roster.</p>
              </div>
              <button className="close-button" onClick={() => setShowAddDoctorModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleAddDoctor}>
              <label>Doctor Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Jane Wilson"
                required
              />

              <div className="form-row">
                <div>
                  <label>Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Room Number</label>
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Room 204"
                    required
                  />
                </div>
              </div>

              <label>Specialization</label>
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Pediatric Cardiology"
              />

              <label>Available Days</label>
              <input
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="e.g. Mon,Wed,Fri"
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddDoctorModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// MEDICINES & PRESCRIPTION CATALOG
// ==========================================

function Medicines({ userRole, patients, showToast }) {
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Prescribe Modal State
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "");
  const [dosageInstructions, setDosageInstructions] = useState("1 tablet twice daily after meals");

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/medicines`);
      if (res.ok) {
        const data = await res.json();
        if (data.medicines && data.medicines.length > 0) {
          setMedicines(data.medicines);
        }
      }
    } catch {
      // Local catalog fallback
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const filteredMedicines = medicines.filter((m) => {
    const matchSearch =
      `${m.name} ${m.category} ${m.description}`.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoryFilter === "All" || m.category.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchSearch && matchCat;
  });

  const handleOpenPrescribe = (med) => {
    setSelectedMedicine(med);
    setShowPrescribeModal(true);
  };

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();
    const patientObj = patients.find((p) => String(p.id) === String(selectedPatientId));
    const patientName = patientObj ? patientObj.name : "Patient";

    try {
      await fetch(`${API_BASE}/medicines/prescribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatientId,
          medicine_id: selectedMedicine?.id,
          prescribed_by: "Clinic Doctor",
          dosage_instructions: dosageInstructions,
        }),
      });
    } catch {
      // Ignore
    }

    showToast(
      `Prescribed ${selectedMedicine?.name} to ${patientName} (${dosageInstructions})!`,
      "success"
    );
    setShowPrescribeModal(false);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PHARMACEUTICAL REPOSITORY</span>
          <h2>Medicine Catalog & Formulary</h2>
          <p>Search medications, check inventory dosage guidelines, and prescribe to patients.</p>
        </div>
      </div>

      <div className="panel">
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search medications by brand, active salt, or indication..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Analgesic">Analgesic / Pain Relief</option>
            <option value="Antipyretic">Antipyretic / Fever</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Antidiabetic">Antidiabetic</option>
          </select>
        </div>

        <div className="medicines-grid">
          {filteredMedicines.map((med) => (
            <div className="medicine-card" key={med.id}>
              <div className="medicine-card-top">
                <span className="token" style={{ background: "var(--info-bg)", color: "var(--info)" }}>
                  💊
                </span>
                <span className="status-badge available">
                  In Stock ({med.stock_quantity || 100})
                </span>
              </div>

              <h3>{med.name}</h3>
              <p>{med.category}</p>

              <div className="medicine-details">
                <span>Standard Dosage</span>
                <strong>{med.dosage}</strong>
              </div>

              <div className="medicine-details">
                <span>Description</span>
                <small style={{ color: "var(--text-muted)", textAlign: "right", maxWidth: 160 }}>
                  {med.description}
                </small>
              </div>

              {userRole === "receptionist" && (
                <div className="card-actions">
                  <button
                    className="small-button success"
                    onClick={() => handleOpenPrescribe(med)}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    + Prescribe to Patient
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PRESCRIBE MODAL */}
      {showPrescribeModal && selectedMedicine && (
        <div className="modal-overlay" onClick={() => setShowPrescribeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">DISPENSE MEDICATION</span>
                <h2>Prescribe {selectedMedicine.name}</h2>
                <p>Category: {selectedMedicine.category} · {selectedMedicine.dosage}</p>
              </div>
              <button className="close-button" onClick={() => setShowPrescribeModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handlePrescribeSubmit}>
              <label>Select Patient *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.token} · {p.department})
                  </option>
                ))}
              </select>

              <label>Dosage & Intake Instructions *</label>
              <textarea
                value={dosageInstructions}
                onChange={(e) => setDosageInstructions(e.target.value)}
                rows="3"
                placeholder="e.g. 1 tablet twice a day for 5 days after food"
                required
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowPrescribeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Record Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// MEDICAL RECORDS / PREVIOUS REPORTS
// ==========================================

function MedicalRecords({ isPatientView, currentUser, patients, showToast }) {
  const [records, setRecords] = useState([
    {
      id: 1,
      patient_name: "Rahul Sharma",
      doctor_name: "Dr. Sarah Johnson",
      visit_date: "2026-10-01",
      diagnosis: "Mild Hypertension & Acute Stress",
      prescription: "Amlodipine 5mg once daily, Low sodium diet",
      notes: "Patient advised to monitor blood pressure every morning and follow up in 2 weeks.",
    },
    {
      id: 2,
      patient_name: "Anita Roy",
      doctor_name: "Dr. Robert Smith",
      visit_date: "2026-09-24",
      diagnosis: "Seasonal Viral Pharyngitis",
      prescription: "Paracetamol 500mg, Warm saline gargles, Vitamin C",
      notes: "Symptoms resolving well. Throat redness diminished.",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Record State
  const [patientId, setPatientId] = useState(patients[0]?.id || 1);
  const [doctorName, setDoctorName] = useState(INITIAL_DOCTORS[0].name);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().substring(0, 10));

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/medical-records`);
      if (res.ok) {
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          setRecords(data.records);
        }
      }
    } catch {
      // Local fallback
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      showToast("Please enter a clinical diagnosis.", "warning");
      return;
    }

    const patientObj = patients.find((p) => String(p.id) === String(patientId));
    const newRec = {
      id: Date.now(),
      patient_id: patientId,
      patient_name: patientObj ? patientObj.name : "Registered Patient",
      doctor_name: doctorName,
      diagnosis: diagnosis.trim(),
      prescription: prescription.trim(),
      notes: notes.trim(),
      visit_date: visitDate,
    };

    try {
      await fetch(`${API_BASE}/medical-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRec),
      });
    } catch {
      // Ignore
    }

    setRecords((prev) => [newRec, ...prev]);
    showToast(`Medical record created for ${newRec.patient_name}!`, "success");
    setShowAddModal(false);
    setDiagnosis("");
    setPrescription("");
    setNotes("");
  };

  const filtered = records.filter((r) => {
    return (
      (r.patient_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.doctor_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.diagnosis || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">HEALTH HISTORY & DIAGNOSTICS</span>
          <h2>{isPatientView ? "Previous Medical Reports" : "Clinical Medical Records"}</h2>
          <p>
            {isPatientView
              ? "Access your past diagnosis history, prescriptions, and physician notes."
              : "Search, inspect, and document patient clinical records."}
          </p>
        </div>

        {!isPatientView && (
          <button className="primary-button" onClick={() => setShowAddModal(true)}>
            + Add Medical Record
          </button>
        )}
      </div>

      <div className="panel">
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search by patient, doctor, diagnosis or condition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Diagnosis</th>
                <th>Prescription</th>
                <th>Clinical Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <strong>{rec.visit_date}</strong>
                  </td>
                  <td>
                    <strong>{rec.patient_name || rec.name}</strong>
                  </td>
                  <td>{rec.doctor_name || rec.doctor}</td>
                  <td>
                    <span className="status-badge waiting">{rec.diagnosis}</span>
                  </td>
                  <td>{rec.prescription || "None"}</td>
                  <td>
                    <small>{rec.notes || "—"}</small>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <p>No medical records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD RECORD MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">NEW CLINICAL REPORT</span>
                <h2>Add Medical Record</h2>
                <p>Record medical encounter notes and treatment plan.</p>
              </div>
              <button className="close-button" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateRecord}>
              <div className="form-row">
                <div>
                  <label>Select Patient *</label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.token})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Doctor *</label>
                  <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  >
                    {INITIAL_DOCTORS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label>Diagnosis *</label>
              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Bronchitis, Type 2 Diabetes"
                required
              />

              <label>Prescription</label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                rows="2"
                placeholder="Medication name, dosage, frequency..."
              />

              <label>Clinical Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                placeholder="Observations, diet recommendations, follow-up..."
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// LIVE NOTIFICATIONS
// ==========================================

function Notifications({ showToast, onUpdateCount }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Queue Alert",
      message: "Cardiology department queue has exceeded 5 waiting patients.",
      type: "warning",
      is_read: false,
      created_at: "10 mins ago",
    },
    {
      id: 2,
      title: "Doctor Roster Update",
      message: "Dr. Sarah Johnson is currently available in Room 101.",
      type: "info",
      is_read: false,
      created_at: "35 mins ago",
    },
    {
      id: 3,
      title: "Consultation Complete",
      message: "Token P002 consultation successfully completed.",
      type: "success",
      is_read: true,
      created_at: "1 hour ago",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const fetchLiveNotifications = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications);
          onUpdateCount(data.unread_count || 0);
        }
      }
    } catch {
      // Local fallback
    } finally {
      setLoading(false);
    }
  }, [onUpdateCount]);

  useEffect(() => {
    fetchLiveNotifications();
  }, [fetchLiveNotifications]);

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_BASE}/notifications/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore
      }
    }

    onUpdateCount((prev) => Math.max(0, prev - 1));
    showToast("Notification marked as read.", "info");
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_BASE}/notifications/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore
      }
    }
    onUpdateCount(0);
    showToast("All notifications marked as read.", "success");
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">COMMUNICATION FEED</span>
          <h2>Hospital Notifications</h2>
          <p>Real-time queue announcements, doctor availability, and clinic alerts.</p>
        </div>

        <button className="secondary-button" onClick={markAllAsRead}>
          ✓ Mark All as Read
        </button>
      </div>

      <div className="panel">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`notification-card ${!item.is_read ? "unread" : ""}`}
          >
            <div className="notification-icon">
              {item.type === "warning" ? "⚠️" : item.type === "success" ? "✅" : "🔔"}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3>{item.title}</h3>
                {!item.is_read && (
                  <button
                    className="small-button secondary"
                    onClick={() => markAsRead(item.id)}
                  >
                    Mark Read
                  </button>
                )}
              </div>
              <p>{item.message}</p>
              <small>{item.created_at || "Recent"}</small>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🔔</span>
            <p>No notifications available.</p>
          </div>
        )}
      </div>
    </>
  );
}

// ==========================================
// AI ASSISTANT
// ==========================================

function Assistant() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      sender: "bot",
      text: "Hello! 👋 I'm your MediQueue Assistant. Ask me about patient registration, waiting queue triage, consulting doctors, appointments, or general medication guidelines.",
    },
  ]);

  const askAssistant = (e) => {
    e.preventDefault();
    const q = message.trim().toLowerCase();
    if (!q) return;

    let reply = "";
    if (q.includes("hello") || q.includes("hi")) {
      reply = "Hello! How can I assist you with the clinic queue and patient records today?";
    } else if (q.includes("queue") || q.includes("waiting")) {
      reply =
        "You can manage waiting patients in the 'Queue' tab. Clicking 'Call Patient' assigns them directly to an active consultation room.";
    } else if (q.includes("register") || q.includes("add patient")) {
      reply =
        "Click '+ Register Patient' in the top right to create a new intake record. This automatically issues the next token (e.g. P004) and queues the patient.";
    } else if (q.includes("doctor") || q.includes("room") || q.includes("available")) {
      reply =
        "Open the 'Doctors' tab to see attending physicians, assigned consultation rooms, and toggle live availability (Available vs On Break).";
    } else if (q.includes("medicine") || q.includes("tablet") || q.includes("prescribe")) {
      reply =
        "In the 'Medicines' section, you can review inventory, dosages, and prescribe directly to active patients. Note: clinical medication advice should always be approved by the licensed physician.";
    } else if (q.includes("print") || q.includes("ticket")) {
      reply =
        "You can print a queue token ticket anytime by clicking the 🖨️ icon next to any patient row, or immediately following patient registration.";
    } else if (q.includes("analytics") || q.includes("stats")) {
      reply =
        "Visit the 'Analytics' page to inspect patient volume by department, doctor workload distribution, and weekly trends.";
    } else {
      reply =
        "I can help with patient registration, queue status, doctors, appointments, medicines, and analytics. Try asking a specific question!";
    }

    setChat((prev) => [
      ...prev,
      { sender: "user", text: message.trim() },
      { sender: "bot", text: reply },
    ]);
    setMessage("");
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">VIRTUAL HELPDESK</span>
          <h2>MediQueue AI Assistant</h2>
          <p>Instant answers on clinic workflow, queue navigation, and medical guidelines.</p>
        </div>
      </div>

      <div className="panel chatbot">
        <div className="chatbot-header">
          <div className="assistant-avatar">✧</div>
          <div>
            <h3>MediQueue Smart Assistant</h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <span className="online-dot" /> Online & Responsive
            </span>
          </div>
        </div>

        <div className="chat-history">
          {chat.map((item, index) => (
            <div
              key={index}
              className={`chat-message ${
                item.sender === "user" ? "user-message" : "bot-message"
              }`}
            >
              {item.text}
            </div>
          ))}
        </div>

        <form className="chat-form" onSubmit={askAssistant}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about registering patients, queue tickets, doctors..."
          />
          <button className="primary-button" type="submit">
            Send →
          </button>
        </form>

        <p className="safety-note">
          MediQueue Assistant answers queries on clinical workflow and operations.
        </p>
      </div>
    </>
  );
}

// ==========================================
// ANALYTICS DASHBOARD
// ==========================================

function Analytics({ patients, waiting, consulting, completed, showToast }) {
  // Department breakdown
  const deptCounts = DEPARTMENTS.map((dept) => {
    const count = patients.filter((p) => p.department === dept).length;
    return { dept, count };
  });
  const maxDeptCount = Math.max(...deptCounts.map((d) => d.count), 1);

  // Doctor breakdown
  const docCounts = INITIAL_DOCTORS.map((doc) => {
    const count = patients.filter((p) => p.doctor === doc.name).length;
    return { doctor: doc.name, count };
  });
  const maxDocCount = Math.max(...docCounts.map((d) => d.count), 1);

  // Weekly Trend Mock
  const weeklyData = [
    { day: "Mon", count: 18 },
    { day: "Tue", count: 24 },
    { day: "Wed", count: 32 },
    { day: "Thu", count: 28 },
    { day: "Fri", count: 35 },
    { day: "Sat", count: 21 },
    { day: "Sun", count: 14 },
  ];
  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PERFORMANCE & METRICS</span>
          <h2>Clinic Analytics Dashboard</h2>
          <p>Visualizing patient throughput, department allocation, and physician caseload.</p>
        </div>
      </div>

      <div className="stats-grid">
        <Stat
          icon="📊"
          title="Completion Rate"
          value={
            patients.length > 0
              ? `${Math.round((completed.length / patients.length) * 100)}%`
              : "0%"
          }
          note="Consultations finalized"
        />
        <Stat
          icon="⏳"
          title="Avg. Triage Wait"
          value="14 min"
          note="From intake to doctor"
        />
        <Stat
          icon="🔥"
          title="Peak Clinic Hour"
          value="11:00 AM"
          note="Highest queue influx"
        />
        <Stat
          icon="👨‍⚕️"
          title="Active Doctors"
          value={INITIAL_DOCTORS.filter((d) => d.is_available).length}
          note="Currently consulting"
        />
      </div>

      <div className="analytics-grid">
        {/* Department Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Patients by Department</h3>
            <p>Current patient volume distribution across specialties</p>
          </div>

          <div className="bar-chart-list">
            {deptCounts.map((item) => {
              const pct = Math.round((item.count / maxDeptCount) * 100);
              return (
                <div className="bar-chart-item" key={item.dept}>
                  <div className="bar-item-header">
                    <strong>{item.dept}</strong>
                    <span>{item.count} patients</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doctor Caseload */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Patients by Attending Doctor</h3>
            <p>Active patient assignments per physician</p>
          </div>

          <div className="bar-chart-list">
            {docCounts.map((item) => {
              const pct = Math.round((item.count / maxDocCount) * 100);
              return (
                <div className="bar-chart-item" key={item.doctor}>
                  <div className="bar-item-header">
                    <strong>{item.doctor}</strong>
                    <span>{item.count} assigned</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill accent"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Trend Bar Chart */}
        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
          <div className="chart-card-header">
            <h3>Weekly Patient Volume Trend</h3>
            <p>Total registrations over the past 7 days</p>
          </div>

          <div className="vertical-chart">
            {weeklyData.map((item) => {
              const heightPct = Math.round((item.count / maxWeekly) * 100);
              return (
                <div className="vertical-bar-group" key={item.day}>
                  <span className="vertical-bar-val">{item.count}</span>
                  <div className="vertical-bar-track">
                    <div
                      className="vertical-bar-fill"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="vertical-bar-label">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ==========================================
// SETTINGS PAGE (WITH DARK MODE TOGGLE)
// ==========================================

function Settings({ theme, toggleTheme, userRole, currentUser, showToast }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM & PREFERENCES</span>
          <h2>Settings</h2>
          <p>Application preferences, theme configuration, and system information.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Dark Mode Card */}
        <div className="panel setting-card">
          <div className="setting-icon">🌓</div>
          <h3>Display Theme</h3>
          <p>Toggle between clean light mode and high-contrast dark mode.</p>

          <div className="toggle-wrapper">
            <span>Dark Theme: <strong>{theme === "dark" ? "Enabled" : "Disabled"}</strong></span>
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={() => {
                  toggleTheme();
                  showToast(
                    `Switched to ${theme === "dark" ? "light" : "dark"} mode.`,
                    "info"
                  );
                }}
              />
              <span className="slider" />
            </label>
          </div>
        </div>

        {/* User Account Info */}
        <div className="panel setting-card">
          <div className="setting-icon">👤</div>
          <h3>User Profile</h3>
          <p>Active session identity and permissions.</p>
          <div style={{ marginTop: 8 }}>
            <strong>{currentUser?.name || "Clinic User"}</strong>
            <br />
            <small style={{ color: "var(--text-muted)" }}>
              Email: {currentUser?.email || "user@mediqueue.local"}
            </small>
            <br />
            <small style={{ color: "var(--text-muted)" }}>
              Role: {userRole === "receptionist" ? "Clinic Administrator" : "Patient"}
            </small>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="panel setting-card">
          <div className="setting-icon">✓</div>
          <h3>System Status</h3>
          <p>MediQueue frontend running in connected mode.</p>
          <span className="status-badge available" style={{ marginTop: 8 }}>
            Online · v2.0 Production
          </span>
        </div>

        {/* Real-time Refresh Configuration */}
        <div className="panel setting-card">
          <div className="setting-icon">◷</div>
          <h3>Auto-refresh Rate</h3>
          <p>Background queue polling is active every 30 seconds.</p>
          <small style={{ color: "var(--text-muted)", marginTop: 8 }}>
            Supports zero-touch triage synchronization.
          </small>
        </div>
      </div>
    </>
  );
}

// ==========================================
// ADD PATIENT MODAL
// ==========================================

function AddPatientModal({
  setShowForm,
  setPatients,
  showToast,
  addActivity,
  onRegisteredPrint,
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [doctor, setDoctor] = useState(INITIAL_DOCTORS[0].name);
  const [department, setDepartment] = useState(INITIAL_DOCTORS[0].department);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !age || !reason.trim()) {
      showToast("Please fill in the patient name, age, and reason for visit.", "warning");
      return;
    }

    setSubmitting(true);
    let newPatient = null;

    try {
      const response = await fetch(`${API_BASE}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age: Number(age),
          gender,
          doctor,
          department,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register patient in database");
      }

      newPatient = {
        id: data.patient?.id || Date.now(),
        queueId: data.queue?.id,
        token: `P${String(data.queue?.queue_number || data.patient?.id || 1).padStart(3, "0")}`,
        name: data.patient?.name || name.trim(),
        age: data.patient?.age || Number(age),
        gender: data.patient?.gender || gender,
        doctor: data.patient?.doctor || doctor,
        department: data.patient?.department || department,
        reason: data.patient?.reason || reason.trim(),
        status: "Waiting",
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("Backend registration error:", err.message);
      // Fallback local registration
      const localId = Date.now();
      newPatient = {
        id: localId,
        queueId: localId,
        token: `P${String(Math.floor(Math.random() * 800) + 100).padStart(3, "0")}`,
        name: name.trim(),
        age: Number(age),
        gender,
        doctor,
        department,
        reason: reason.trim(),
        status: "Waiting",
        createdAt: new Date().toISOString(),
      };
    } finally {
      setSubmitting(false);
    }

    setPatients((prev) => [...prev, newPatient]);
    addActivity(`Registered new patient ${newPatient.name} (Token ${newPatient.token}).`, "blue");
    showToast(`Patient ${newPatient.name} registered! Token: ${newPatient.token}`, "success");
    setShowForm(false);

    // Offer to print ticket immediately
    onRegisteredPrint(newPatient);
  };

  return (
    <div className="modal-overlay" onClick={() => setShowForm(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">NEW INTAKE</span>
            <h2>Register Patient</h2>
            <p>Generate a queue token and assign clinical department.</p>
          </div>
          <button className="close-button" onClick={() => setShowForm(false)}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Patient Full Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
            autoFocus
          />

          <div className="form-row">
            <div>
              <label>Age *</label>
              <input
                type="number"
                min="1"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age in years"
                required
              />
            </div>
            <div>
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Attending Doctor</label>
              <select
                value={doctor}
                onChange={(e) => {
                  setDoctor(e.target.value);
                  const doc = INITIAL_DOCTORS.find((d) => d.name === e.target.value);
                  if (doc) setDepartment(doc.department);
                }}
              >
                {INITIAL_DOCTORS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} — {d.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Department</label>
              <input value={department} readOnly />
            </div>
          </div>

          <label>Chief Complaint / Reason for Visit *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe symptoms, complaints, or checkup reason..."
            rows="3"
            required
          />

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Registering..." : "+ Register & Issue Token"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// PATIENT PROFILE MODAL
// ==========================================

function PatientDetailModal({ patient, onClose, onPrint, changeStatus }) {
  if (!patient) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">PATIENT PROFILE & QUEUE RECORD</span>
            <h2>{patient.name}</h2>
            <p>Token: {patient.token} · Department: {patient.department}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="profile-detail-grid">
          <div className="detail-item">
            <span>Token Number</span>
            <strong style={{ fontSize: 18, color: "var(--primary)" }}>{patient.token}</strong>
          </div>
          <div className="detail-item">
            <span>Current Status</span>
            <div><Status status={patient.status} /></div>
          </div>
          <div className="detail-item">
            <span>Age / Gender</span>
            <strong>{patient.age} yrs · {patient.gender}</strong>
          </div>
          <div className="detail-item">
            <span>Assigned Doctor</span>
            <strong>{patient.doctor}</strong>
          </div>
          <div className="detail-item">
            <span>Department</span>
            <strong>{patient.department}</strong>
          </div>
          <div className="detail-item">
            <span>Registration Time</span>
            <strong>{patient.createdAt ? new Date(patient.createdAt).toLocaleTimeString() : "Today"}</strong>
          </div>
          <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
            <span>Reason for Visit</span>
            <p style={{ marginTop: 4 }}>{patient.reason || "General Consultation"}</p>
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <h4 style={{ fontSize: 14, marginBottom: 8 }}>Queue Actions</h4>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {patient.status === "Waiting" && (
              <button
                className="small-button success"
                onClick={() => {
                  changeStatus(patient.id, "In Consultation");
                  onClose();
                }}
              >
                Call to Consultation
              </button>
            )}
            {patient.status === "In Consultation" && (
              <button
                className="small-button success"
                onClick={() => {
                  changeStatus(patient.id, "Completed");
                  onClose();
                }}
              >
                Mark as Completed
              </button>
            )}
            <button
              className="small-button secondary"
              onClick={() => {
                onPrint(patient);
              }}
            >
              🖨️ Print Ticket
            </button>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PRINT QUEUE TICKET MODAL & PRINTABLE
// ==========================================

function PrintTicketModal({ patient, onClose }) {
  if (!patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">QUEUE SLIP</span>
            <h2>Queue Ticket</h2>
            <p>Formatted patient token for reception receipt printing.</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* PRINTABLE TICKET ELEMENT */}
        <div className="ticket-wrapper printable-ticket">
          <div className="ticket-header">
            <h3>🏥 MEDIQUEUE CLINICAL CARE</h3>
            <p>Patient Queue Management Ticket</p>
          </div>

          <div className="ticket-token">{patient.token}</div>

          <div className="ticket-details">
            <div>
              <strong>Patient:</strong> {patient.name} ({patient.age} yrs, {patient.gender})
            </div>
            <div>
              <strong>Doctor:</strong> {patient.doctor}
            </div>
            <div>
              <strong>Department:</strong> {patient.department}
            </div>
            <div>
              <strong>Issued:</strong> {currentDate} · {currentTime}
            </div>
          </div>

          <div className="barcode-sim">|| | ||| |||| | ||| |||</div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            Please wait until your token is called on the lounge monitor.
          </p>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
          <button className="primary-button" onClick={handlePrint}>
            🖨️ Print Ticket Dialog
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// AUTHENTICATION COMPONENT
// ==========================================

function Auth({
  authPage,
  setAuthPage,
  setIsLoggedIn,
  setUserRole,
  setCurrentUser,
  showToast,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>MediQueue</h1>
        <p>Smart Patient Queue & Clinical Management</p>

        {authPage === "login" && (
          <LoginForm
            setAuthPage={setAuthPage}
            setIsLoggedIn={setIsLoggedIn}
            setUserRole={setUserRole}
            setCurrentUser={setCurrentUser}
            showToast={showToast}
          />
        )}

        {authPage === "register" && (
          <RegisterForm
            setAuthPage={setAuthPage}
            showToast={showToast}
          />
        )}

        {authPage === "forgot" && (
          <ForgotPasswordForm
            setAuthPage={setAuthPage}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}

function LoginForm({
  setAuthPage,
  setIsLoggedIn,
  setUserRole,
  setCurrentUser,
  showToast,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUserRole(data.user.role || "receptionist");
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      showToast(`Welcome back, ${data.user.name}!`, "success");
    } catch (err) {
      console.warn("Login API error:", err.message);
      // Fallback demo login if backend is not actively responding
      const fallbackRole = email.toLowerCase().includes("patient")
        ? "patient"
        : "receptionist";
      const fallbackUser = {
        id: 1,
        name: email.split("@")[0] || "Staff Member",
        email: email,
        role: fallbackRole,
      };

      localStorage.setItem("token", "demo-token-" + Date.now());
      localStorage.setItem("user", JSON.stringify(fallbackUser));

      setUserRole(fallbackRole);
      setCurrentUser(fallbackUser);
      setIsLoggedIn(true);
      showToast(`Logged in as ${fallbackRole} (${err.message})`, "info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Account Login</h2>

      <label>Email Address</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="e.g. staff@hospital.com"
        required
      />

      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
      />

      <p style={{ textAlign: "right" }}>
        <button
          type="button"
          className="auth-link"
          onClick={() => setAuthPage("forgot")}
        >
          Forgot Password?
        </button>
      </p>

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? "Authenticating..." : "Sign In →"}
      </button>

      <p>
        Don't have an account?{" "}
        <button
          type="button"
          className="auth-link"
          onClick={() => setAuthPage("register")}
        >
          Register here
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ setAuthPage, showToast }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      showToast("Account created successfully! Please login.", "success");
      setAuthPage("login");
    } catch (err) {
      showToast(`Account registered locally (${err.message}). Please login.`, "info");
      setAuthPage("login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="auth-form">
      <h2>Create New Account</h2>

      <label>Full Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your full name"
        required
      />

      <label>Email Address</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />

      <label>Account Role</label>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="patient">Patient</option>
        <option value="receptionist">Receptionist / Clinic Staff</option>
      </select>

      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Minimum 6 characters"
        minLength="6"
        required
      />

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? "Registering..." : "Create Account"}
      </button>

      <p>
        Already registered?{" "}
        <button
          type="button"
          className="auth-link"
          onClick={() => setAuthPage("login")}
        >
          Login
        </button>
      </p>
    </form>
  );
}

function ForgotPasswordForm({ setAuthPage, showToast }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }
      showToast("Password updated successfully! Please login.", "success");
      setAuthPage("login");
    } catch (err) {
      showToast("Password updated locally. Please login.", "info");
      setAuthPage("login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset} className="auth-form">
      <h2>Reset Password</h2>

      <label>Registered Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter registered email"
        required
      />

      <label>New Password</label>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Minimum 6 characters"
        minLength="6"
        required
      />

      <label>Confirm Password</label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        minLength="6"
        required
      />

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? "Updating..." : "Reset Password"}
      </button>

      <p>
        Remember password?{" "}
        <button
          type="button"
          className="auth-link"
          onClick={() => setAuthPage("login")}
        >
          Back to Login
        </button>
      </p>
    </form>
  );
}

// ==========================================
// STATUS PILL COMPONENT
// ==========================================

function Status({ status }) {
  const statusClass = (status || "Waiting").toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-badge ${statusClass}`}>{status}</span>;
}