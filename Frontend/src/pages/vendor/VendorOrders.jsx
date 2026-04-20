import { useState, useEffect } from "react";
import { orderService } from "../../services/orderService";
import { Search, Loader2, Package, CheckCircle, Truck, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderHistory();
      
      const allOrders = res.data || [];
      const shopId = user?._id || user?.id;
      const userName = user?.name || user?.shopName;

      const myOrders = allOrders.filter(o => 
        (o.shop && o.shop === shopId) || 
        (o.shop && o.shop._id === shopId) || 
        o.shopName === userName ||
        user?.role === 'shop_owner' // Fallback for DEMO showing all orders
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(myOrders);
    } catch (err) {
      setError("Failed to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Processing": return "bg-blue-100 text-blue-800";
      case "Out for Delivery": return "bg-purple-100 text-purple-800";
      case "Delivered": return "bg-accent/10 text-accent-dark";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Pending": return <Clock className="w-4 h-4" />;
      case "Processing": return <Package className="w-4 h-4" />;
      case "Out for Delivery": return <Truck className="w-4 h-4" />;
      case "Delivered": return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Orders</h1>
          <p className="text-gray-500">Manage and process customer orders.</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 text-sm btn-outline">
          Refresh Orders
        </button>
      </div>

      {error && <div className="p-4 text-red-700 rounded-lg bg-red-50">{error}</div>}

      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col justify-between gap-4 p-4 border-b border-gray-200 sm:flex-row">
          <div className="relative w-full sm:w-96">
            <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 text-sm border rounded-lg focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border rounded-lg focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-sm text-gray-600 border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold">Total (Rs)</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-900">No Orders Found</p>
                    <p className="text-sm">You have no orders matching your current criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="align-top border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <span className="px-2 py-1 font-mono text-xs text-gray-600 bg-gray-100 rounded">
                        #{order._id.substring(order._id.length - 6).toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm">
                      <ul className="pl-4 space-y-1 list-disc">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="text-gray-700">
                            {item.name} <span className="text-gray-400">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      Rs. {order.grandTotal ? order.grandTotal.toFixed(2) : order.totalAmount?.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {order.status === "Pending" && (
                        <button 
                          onClick={() => handleStatusUpdate(order._id, "Processing")}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          Accept Order
                        </button>
                      )}
                      {order.status === "Processing" && (
                        <div className="flex flex-col items-end gap-2">
                           {order.deliveryAssignment && (
                             <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                               Rider: {order.deliveryAssignment.deliveryPersonName}
                             </span>
                           )}
                           <button 
                             onClick={() => handleStatusUpdate(order._id, "Out for Delivery")}
                             className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                           >
                             Ready to Deliver
                           </button>
                        </div>
                      )}
                      {(order.status === "Out for Delivery" || order.status === "Delivered") && (
                        <div className="flex flex-col items-end gap-1">
                          {order.deliveryAssignment && (
                           <span className="text-xs text-gray-500 font-medium">
                             Handled by: {order.deliveryAssignment.deliveryPersonName}
                           </span>
                          )}
                          <span className="text-sm text-gray-800 font-semibold">{order.status}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
