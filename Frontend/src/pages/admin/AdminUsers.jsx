import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { Search, Loader2, Trash2, Users, UserCheck, Clock, UserX } from "lucide-react";

const ROLE_FILTERS = [
  { value: "all", label: "All" },
  { value: "student", label: "Students" },
  { value: "doctor", label: "Doctors" },
  { value: "shop_owner", label: "Shop owners" },
  { value: "delivery_person", label: "Delivery" },
  { value: "admin", label: "Admins" },
];

const AVATAR_COLORS = [
  { bg: "#EDE9FE", color: "#5B21B6" },
  { bg: "#E1F5EE", color: "#085041" },
  { bg: "#FAEEDA", color: "#633806" },
  { bg: "#FAECE7", color: "#712B13" },
  { bg: "#E6F1FB", color: "#0C447C" },
  { bg: "#FBEAF0", color: "#72243E" },
];

function getAvatarColor(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function StatusPill({ status }) {
  const map = {
    approved: { bg: "#ECFDF5", color: "#065F46", label: "Approved" },
    pending:  { bg: "#FFFBEB", color: "#92400E", label: "Pending" },
    rejected: { bg: "#FEF2F2", color: "#991B1B", label: "Rejected" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#4B5563", label: status };
  return (
    <span style={{ ...styles.pill, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => { fetchUsers(); }, [filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = filterRole !== "all" ? { role: filterRole } : {};
      const res = await adminService.getUsers(params);
      setUsers(res.data || []);
    } catch {
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete '${name}'? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch {
      alert("Failed to delete user.");
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "Total users",  value: users.length, color: "var(--color-text-primary)", icon: <Users size={15} /> },
    { label: "Approved",     value: users.filter(u => u.status === "approved").length,  color: "#10B981", icon: <UserCheck size={15} color="#10B981" /> },
    { label: "Pending",      value: users.filter(u => u.status === "pending").length,   color: "#F59E0B", icon: <Clock size={15} color="#F59E0B" /> },
    { label: "Rejected",     value: users.filter(u => u.status === "rejected").length,  color: "#EF4444", icon: <UserX size={15} color="#EF4444" /> },
  ];

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.eyebrow}><div style={styles.eyebrowDot} /><span style={styles.eyebrowTxt}>Admin</span></div>
        <h1 style={styles.title}>User management</h1>
        <p style={styles.subtitle}>Manage all registered users on the platform.</p>
      </div>

      {/* Stat cards */}
      <div style={styles.statGrid}>
        {stats.map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statTop}>
              <span style={styles.statLabel}>{s.label}</span>
              {s.icon}
            </div>
            <div style={{ ...styles.statVal, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {error && <div style={styles.errorBox}><div style={styles.errorDot} />{error}</div>}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={14} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.chipRow}>
          {ROLE_FILTERS.map(f => (
            <button
              key={f.value}
              style={{ ...styles.chip, ...(filterRole === f.value ? styles.chipActive : {}) }}
              onClick={() => setFilterRole(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["User", "Role", "Status", "Joined", ""].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={styles.emptyCell}>
                  <Loader2 size={22} color="#7C3AED" style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px", display: "block" }} />
                  <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading users…</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={styles.emptyCell}>
                  <Users size={28} color="#D1D5DB" style={{ margin: "0 auto 8px", display: "block" }} />
                  <span style={{ fontSize: 13, color: "#9CA3AF" }}>No users found.</span>
                </td>
              </tr>
            ) : (
              filtered.map(user => {
                const ac = getAvatarColor(user.name);
                return (
                  <tr key={user._id} style={styles.tr}
                    onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                    {/* User */}
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        {user.avatar ? (
                          <img
                            src={`http://localhost:5000/uploads/${user.avatar}`}
                            alt={user.name}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <div style={{ ...styles.avatar, background: ac.bg, color: ac.color }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={styles.userName}>{user.name}</div>
                          <div style={styles.userEmail}>{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={styles.td}>
                      <span style={styles.rolePill}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={styles.td}>
                      <StatusPill status={user.status} />
                    </td>

                    {/* Joined */}
                    <td style={{ ...styles.td, ...styles.dateText }}>
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Actions */}
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        style={styles.delBtn}
                        title="Delete user"
                        onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                        onMouseLeave={e => e.currentTarget.style.background = "#FEF2F2"}
                      >
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "inherit" },

  header: { marginBottom: "1.75rem" },
  eyebrow: { display: "flex", alignItems: "center", gap: 7, marginBottom: 8 },
  eyebrowDot: { width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" },
  eyebrowTxt: { fontSize: 11, fontWeight: 600, color: "#7C3AED", letterSpacing: "0.07em", textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: 600, color: "#111827", margin: "0 0 4px", lineHeight: 1.2 },
  subtitle: { fontSize: 13, color: "#6B7280", margin: 0 },

  statGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" },
  statCard: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px" },
  statTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statLabel: { fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em" },
  statVal: { fontSize: 24, fontWeight: 600, lineHeight: 1 },

  errorBox: { display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: "1rem" },
  errorDot: { width: 6, height: 6, borderRadius: "50%", background: "#EF4444", flexShrink: 0 },

  toolbar: { display: "flex", gap: 10, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" },
  searchBox: { display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 12px" },
  searchInput: { border: "none", outline: "none", fontSize: 13, color: "#111827", background: "transparent", width: "100%", fontFamily: "inherit" },
  chipRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  chip: { padding: "5px 14px", borderRadius: 99, border: "1px solid #E5E7EB", fontSize: 12, fontWeight: 500, color: "#6B7280", background: "#fff", cursor: "pointer", transition: "all 0.12s", fontFamily: "inherit" },
  chipActive: { background: "#F5F3FF", border: "1px solid #C4B5FD", color: "#5B21B6" },

  tableCard: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" },
  tr: { borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" },
  td: { padding: "11px 14px", fontSize: 13, color: "#111827", verticalAlign: "middle" },

  nameCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  avatarImg: { width: 32, height: 32, borderRadius: 9, objectFit: "cover", flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 500, color: "#111827" },
  userEmail: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },

  pill: { display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600 },
  rolePill: { display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#4B5563", textTransform: "capitalize" },
  dateText: { fontSize: 12, color: "#9CA3AF" },

  delBtn: { width: 30, height: 30, borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.12s" },

  emptyCell: { padding: "2.5rem", textAlign: "center", color: "#9CA3AF" },
};