import { useState, useEffect } from "react";
import { deliveryService } from "../../services/deliveryService";
import { Loader2, TrendingUp, Users, Activity, ShoppingCart } from "lucide-react";

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getDeliveryStats();
      setStats(res.data);
    } catch (err) {
      setError("Failed to fetch system analytics.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Statistics</h1>
          <p className="text-gray-500">Analytics and performance tracking.</p>
        </div>
      </div>

      {error ? (
         <div className="p-4 text-red-700 rounded-lg bg-red-50">{error}</div>
      ) : loading ? (
        <div className="p-12 text-center text-gray-500">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
          Loading statistics...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           <div className="flex items-center p-6 space-x-4 border border-gray-100 shadow card">
            <div className="flex items-center justify-center w-12 h-12 text-blue-600 bg-blue-100 rounded-full">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Deliveries</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.totalDeliveries || 0}</h3>
            </div>
          </div>

          <div className="flex items-center p-6 space-x-4 border border-gray-100 shadow card">
            <div className="flex items-center justify-center w-12 h-12 text-accent-dark bg-accent/10 rounded-full">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Successful Completion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900">
                 {stats?.totalDeliveries ? ((stats?.completedDeliveries || 0) / stats.totalDeliveries * 100).toFixed(0) : 0}%
              </h3>
            </div>
          </div>

          <div className="flex items-center p-6 space-x-4 border border-gray-100 shadow card">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Personnel</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.activeDeliveryPersonnel || 0}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
