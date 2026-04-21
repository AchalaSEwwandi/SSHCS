import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { Users, UserPlus, Mail, ShieldAlert, RefreshCw } from "lucide-react";

const CARDS = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    accent: "#6366f1",
    light: "#eef2ff",
    text: "#4338ca",
    border: "#c7d2fe",
  },
  {
    key: "pendingApprovals",
    label: "Pending Approvals",
    icon: UserPlus,
    accent: "#f59e0b",
    light: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
  },
  {
    key: "totalContacts",
    label: "Total Queries",
    icon: Mail,
    accent: "#8b5cf6",
    light: "#f5f3ff",
    text: "#6d28d9",
    border: "#ddd6fe",
  },
  {
    key: "unreadContacts",
    label: "Awaiting Reply",
    icon: ShieldAlert,
    accent: "#ef4444",
    light: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalContacts: 0,
    unreadContacts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, contactsRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getContacts(),
      ]);

      const users = usersRes.data || [];
      const contacts = contactsRes.data || [];

      setStats({
        totalUsers: users.length,
        pendingApprovals: users.filter((u) => u.status === "pending").length,
        totalContacts: contacts.length,
        unreadContacts: contacts.filter((c) => c.status !== "replied").length,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">System overview and overall statistics.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CARDS.map(({ key, label, icon: Icon, accent, light, text, border }) => (
          <div
            key={key}
            style={{
              backgroundColor: light,
              borderColor: border,
            }}
            className="relative rounded-2xl border p-5 overflow-hidden"
          >
            {/* Decorative circle */}
            <div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20"
              style={{ backgroundColor: accent }}
            />

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: accent }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: text }}>
              {label}
            </p>
            <h3 className="text-3xl font-extrabold" style={{ color: text }}>
              {stats[key]}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}