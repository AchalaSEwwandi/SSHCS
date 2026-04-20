import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { deliveryService } from "../../services/deliveryService";
import { Package, Truck, CheckCircle, Clock, MapPin, Loader2 } from "lucide-react";

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, completed: 0, pending: 0 });
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getMyDashboard();
      
      if (res.success) {
        setStats(res.data.stats);
        setRecentDeliveries(res.data.recentDeliveries);
        setPendingAssignments(res.data.pendingAssignments || []);
      } else {
        setStats({ active: 0, completed: 0, pending: 0 });
        setRecentDeliveries([]);
        setPendingAssignments([]);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      setStats({ active: 0, completed: 0, pending: 0 });
      setPendingAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, response) => {
    try {
      await deliveryService.respondToAssignment(id, response);
      // Reload dashboard after response
      fetchDashboardData();
    } catch (err) {
      alert(`Failed to ${response.toLowerCase()} assignment.`);
    }
  };

  const statCards = [
    { label: "Active Deliveries", value: stats.active, icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-accent-dark", bg: "bg-green-50" },
    { label: "Pending Pickup", value: stats.pending, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name || "Rider"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {statCards.map((stat, i) => (
          <div key={i} className="flex items-center gap-4 p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className={`p-4 rounded-lg \${stat.bg}`}>
              <stat.icon className={`w-8 h-8 \${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? "-" : stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {pendingAssignments.length > 0 && (
        <div className="p-6 bg-blue-50 border border-blue-100 shadow-sm rounded-xl">
          <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-blue-900">
            🔔 New Delivery Requests ({pendingAssignments.length})
          </h2>
          <div className="space-y-4">
            {pendingAssignments.map((assignment) => (
              <div key={assignment._id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
                <div>
                  <p className="font-semibold text-gray-900">Order from {assignment.order?.shopName || 'Campus Shop'}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" /> {assignment.order?.deliveryAddress || 'Campus'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Order #{assignment.order?._id}</p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <button onClick={() => handleRespond(assignment._id, 'Accept')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                    Accept
                  </button>
                  <button onClick={() => handleRespond(assignment._id, 'Reject')} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
        <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900">
          <Package className="w-5 h-5 text-gray-400" /> Recent Activity
        </h2>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {recentDeliveries.map((delivery, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Order #{delivery.id}</p>
                    <p className="text-sm text-gray-500">{delivery.shop} ? {delivery.dest}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium \${
                    delivery.status === "Active" ? "bg-blue-100 text-blue-700" : "bg-accent/10 text-accent-dark"
                  }`}>
                    {delivery.status}
                  </span>
                  <p className="mt-1 text-xs text-gray-400">{new Date(delivery.time).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
