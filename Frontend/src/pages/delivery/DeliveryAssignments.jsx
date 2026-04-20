import { useState, useEffect } from "react";
import { orderService } from "../../services/orderService";
import { deliveryService } from "../../services/deliveryService";
import { Truck, CheckCircle, Clock, MapPin, Loader2, Search, XCircle, FileBox, Package } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function DeliveryAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getMyAssignments();
      const relevant = (res.data || []).filter(a => a.order && ["Pending", "Processing", "Ready for Pickup", "Out for Delivery", "Delivered"].includes(a.order.status));
      setAssignments(relevant);
    } catch (err) {
      setError("Failed to fetch delivery assignments.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      if (newStatus === "Delivered") {
        await deliveryService.markDelivered(orderId);
      }
      fetchAssignments();
    } catch (error) {
      console.error("Status update error", error);
      alert("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  const handleRespond = async (id, response) => {
    try {
      setUpdating(id);
      await deliveryService.respondToAssignment(id, response);
      fetchAssignments();
    } catch (err) {
      alert(`Failed to ${response.toLowerCase()} assignment.`);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = assignments.filter(a =>
    a.order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.order.shopName && a.order.shopName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <div className="flex items-center justify-between p-4 mb-6 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Truck className="w-6 h-6 text-blue-600" /> My Assignments
          </h1>
          <p className="text-gray-500">Manage your active delivery tasks.</p>
        </div>
        <div className="relative">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 py-2 pl-10 pr-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {error && <div className="flex items-center gap-2 p-4 text-red-700 rounded-lg bg-red-50"><XCircle/> {error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center col-span-1 p-12 text-gray-500 md:col-span-2 lg:col-span-3">
            <Loader2 className="w-12 h-12 mb-4 animate-spin text-blue-600" />
            <p>Loading assignments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-1 p-12 text-center text-gray-500 bg-white border border-gray-100 shadow-sm md:col-span-2 lg:col-span-3 rounded-xl">
            <FileBox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-800">No Assignments Found</p>
            <p>You have no pending or completed assignments matching your search.</p>
          </div>
        ) : (
          filtered.map((task) => (
            <div key={task._id} className="overflow-hidden transition-shadow bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md">
              <div className="flex items-start justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="font-bold text-gray-900">Order #{task.order._id.substring(task.order._id.length - 6).toUpperCase()}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    task.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                    task.order.status === "Ready for Pickup" ? "bg-orange-100 text-orange-800" :
                    task.order.status === "Out for Delivery" ? "bg-blue-100 text-blue-800" :
                    "bg-accent/10 text-accent-dark"
                  }`}>
                    {task.status === "Pending" ? "New Request" : task.order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="mt-1 text-xs text-gray-500">{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                 <div className="flex items-start gap-3">
                  <FileBox className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pickup Location</p>
                    <p className="text-sm text-gray-500">{task.order.shopName || "Central Campus Hub"}</p>
                  </div>
                 </div>
                 <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Drop-off Location</p>
                    <p className="text-sm text-gray-500">{task.order.deliveryAddress || "Not Specified"}</p>
                  </div>
                 </div>
              </div>

              <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50">
                {task.status === "Pending" && (
                  <>
                    <button
                      onClick={() => handleRespond(task._id, "Accept")}
                      disabled={updating === task._id}
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      {updating === task._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                      Accept Order
                    </button>
                    <button
                      onClick={() => handleRespond(task._id, "Reject")}
                      disabled={updating === task._id}
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-gray-600 transition-colors bg-white border border-gray-300 rounded-lg outline hover:bg-gray-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {task.status === "Accepted" && task.order.status === "Processing" && (
                  <button
                    onClick={() => updateStatus(task.order._id, "Ready for Pickup")}
                    disabled={updating === task.order._id}
                    className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white transition-colors bg-orange-500 rounded-lg hover:bg-orange-600"
                  >
                    {updating === task.order._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Package className="w-4 h-4"/>}
                    Ready for Pickup
                  </button>
                )}
                {task.status === "Accepted" && task.order.status === "Ready for Pickup" && (
                  <button
                    onClick={() => updateStatus(task.order._id, "Out for Delivery")}
                    disabled={updating === task.order._id}
                    className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {updating === task.order._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Truck className="w-4 h-4"/>}
                    Start Delivery
                  </button>
                )}
                {task.status === "Accepted" && task.order.status === "Out for Delivery" && (
                  <button
                    onClick={() => updateStatus(task.order._id, "Delivered")}
                    disabled={updating === task.order._id}
                    className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    {updating === task.order._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                    Mark Delivered
                  </button>
                )}
                {(task.order.status === "Delivered" || task.status === "Rejected") && (
                   <button
                   disabled
                   className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-gray-500 bg-gray-200 rounded-lg cursor-not-allowed"
                 >
                   <CheckCircle className="w-4 h-4"/>
                   {task.status === "Rejected" ? "Rejected" : "Completed"}
                 </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
