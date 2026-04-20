import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { Users, UserPlus, Mail, ShieldAlert } from "lucide-react";

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
        adminService.getContacts()
      ]);

      const users = usersRes.data || [];
      const contacts = contactsRes.data || [];

      const pendingUsers = users.filter(u => u.status === "pending").length;
      const unreadContacts = contacts.filter(c => c.status !== "replied").length;

      setStats({
        totalUsers: users.length,
        pendingApprovals: pendingUsers,
        totalContacts: contacts.length,
        unreadContacts: unreadContacts,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="w-10 h-10 border-b-2 rounded-full animate-spin border-blue-600 mx-auto"></div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">System overview and overall statistics.</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-outline px-4 py-2">
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border border-gray-100 flex items-center space-x-4 shadow">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="card p-6 border border-gray-100 flex items-center space-x-4 shadow">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</h3>
          </div>
        </div>

        <div className="card p-6 border border-gray-100 flex items-center space-x-4 shadow">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Queries</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalContacts}</h3>
          </div>
        </div>

        <div className="card p-6 border border-gray-100 flex items-center space-x-4 shadow">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Awaiting Reply</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.unreadContacts}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
