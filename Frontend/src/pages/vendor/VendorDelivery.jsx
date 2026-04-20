import { useState, useEffect } from "react";
import { orderService } from "../../services/orderService";
import { deliveryService } from "../../services/deliveryService";
import { Search, Loader2, Truck, CheckCircle, Package } from "lucide-react";    
import { useAuth } from "../../context/AuthContext";

export default function VendorDelivery() {
  const [orders, setOrders] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  
  // local state for selections
  const [selectedPerson, setSelectedPerson] = useState({});
  const [manualMode, setManualMode] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const handleAutoAssign = async (orderId) => {
    try {
      const vendorStoreName = user?.shopName || user?.storeName || user?.name || "Vendor Store";
      const res = await orderService.assignDelivery(orderId, vendorStoreName);
      if (res.data?.success === false || res.success === false) {
        // Backend returns success: false if no DP available, or success: true if assigned. 
        // Order controller gives { success: false, assigned: false, message: ... } via `res.status(200).json(...)` wait, let's just check assigned property.
        const returnedData = res.data || res;
        if (returnedData.assigned === false || returnedData.success === false) {
          alert(returnedData.message || "No delivery person available. Please select manually.");
          setManualMode(prev => ({ ...prev, [orderId]: true }));
        } else {
          alert("Driver automatically assigned and order is now Processing!");
          fetchData();
        }
      } else {
        alert("Driver automatically assigned and order is now Processing!");
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert("No available driver found or failed to auto assign. You may assign manually.");
      setManualMode(prev => ({ ...prev, [orderId]: true }));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resOrders, resPersons] = await Promise.all([
        orderService.getOrderHistory(),
        deliveryService.getDeliveryPersons(user?.shopName || user?.storeName || user?.name)
      ]);

      const shopId = user?._id || user?.id;
      const userName = user?.name || user?.shopName;

      // Debugging to see what's actually arriving vs what's being filtered
      console.log("All Orders from Backend:", resOrders.data);
      console.log("User Identity:", { shopId, userName, shopName: user?.shopName, storeName: user?.storeName });

      const shopOrders = (resOrders.data || []).filter(o => 
        // Make sure it handles the demo gracefully. If they are a shop_owner, filter to their shop or just show all for demo
        (o.shop && (o.shop === shopId || o.shop._id === shopId)) || 
        [userName, user?.shopName, user?.storeName].includes(o.shopName) ||
        (user?.role === 'shop_owner') // In absence of hard linking in demo, let vendor see all orders to handle them
      );
      
      // show orders that need delivery or are in delivery
      const activeDeliveries = shopOrders
        .filter(o => ["Pending", "Processing", "Ready for Pickup", "Out for Delivery", "Delivered"].includes(o.status))
        .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));

      setOrders(activeDeliveries);
      setDeliveryPersons(resPersons.data || []);
    } catch (err) {
      setError("Failed to load delivery tracking data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (orderId) => {
    const dpId = selectedPerson[orderId];
    if (!dpId) return alert("Please select a delivery person!");
    try {
      await deliveryService.assignDeliveryPerson(orderId, dpId);
      alert("Delivery person assigned successfully!");
      fetchData(); // refresh
    } catch (err) {
      alert("Failed to assign delivery person.");
    }
  };

  const handleSelectChange = (orderId, personId) => {
    setSelectedPerson(prev => ({...prev, [orderId]: personId}));
  };

  const availablePersons = deliveryPersons.filter(p => p.availability === "Available");

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Assignment & Tracking</h1>
          <p className="text-gray-500">Monitor active and past shop order deliveries and manage dispatch.</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 text-sm btn-outline">
          Refresh Tracking
        </button>
      </div>

      {error && <div className="p-4 text-red-700 rounded-lg bg-red-50">{error}</div>}

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center p-4 card bg-green-50 border-accent/20">
           <h3 className="text-3xl font-bold text-accent-dark">{availablePersons.length}</h3>
           <p className="text-sm font-semibold uppercase text-accent-dark">Available Riders</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border-orange-200 card bg-orange-50">
           <h3 className="text-3xl font-bold text-orange-700">{deliveryPersons.filter(p => p.availability === "Busy").length}</h3>
           <p className="text-sm font-semibold text-orange-800 uppercase">Busy on Delivery</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">    
        <div className="flex flex-col items-center justify-between gap-4 p-4 border-b border-gray-200 sm:flex-row">
           <h3 className="flex items-center gap-2 font-bold"><Truck className="w-5 h-5 text-blue-600"/> Dispatch Queue</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">    
            <thead>
              <tr className="text-sm text-gray-600 border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Date Dispatched</th>
                <th className="p-4 font-semibold">Delivery Address</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Assign Delivery Person</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">    
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
                    Loading deliveries...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-500">   
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-900">No Active Deliveries Found</p>
                    <p className="text-sm">There are no pending or completed dispatch tracked.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="inline-block p-4 mt-3 font-mono text-xs text-gray-600 bg-gray-100 rounded">
                      #{order._id.substring(order._id.length - 6).toUpperCase()}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(order.updatedAt || order.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-700">      
                      {order.deliveryAddress || "Standard Campus Pick-Up"}   
                    </td>
                    <td className="p-4">
                      {order.status === "Out for Delivery" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Truck className="w-4 h-4" /> Out for Delivery        
                        </span>
                      ) : order.status === "Delivered" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent-dark">
                          <CheckCircle className="w-4 h-4" /> Delivered     
                        </span>
                      ) : order.status === "Processing" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Truck className="w-4 h-4" /> Processing / Ready for Pickup
                        </span>
                      ) : (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending / Awaiting Action
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {order.deliveryAssignment && order.deliveryAssignment.status !== 'Rejected' ? (
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-700 block">
                            {order.deliveryAssignment.status === 'Pending' ? 'Awaiting Request Acceptance' : 'Tracker Active'}
                          </span>
                          <span className="text-xs text-blue-600 font-medium block">Rider: {order.deliveryAssignment.deliveryPersonName}</span>
                        </div>
                      ) : ["Processing", "Pending"].includes(order.status) || (order.deliveryAssignment && order.deliveryAssignment.status === 'Rejected') ? (
                        <div className="flex flex-col items-end justify-end gap-2">
                           {order.deliveryAssignment && order.deliveryAssignment.status === 'Rejected' && (
                             <span className="text-xs text-red-600 font-semibold mb-1">Last Request Rejected</span>
                           )}
                           {!manualMode[order._id] ? (
                             <button onClick={() => handleAutoAssign(order._id)} className="btn-primary text-xs px-4 py-1.5 min-w-[200px] whitespace-nowrap">
                               Mark Process & Auto-Assign
                             </button>
                           ) : (
                             <div className="flex justify-end gap-2">
                               <select className="select text-sm p-1.5 w-48" value={selectedPerson[order._id] || ''} onChange={(e) => handleSelectChange(order._id, e.target.value)}>
                                 <option value="">Select Rider...</option>
                                 {availablePersons.map(p => (
                                   <option key={p._id} value={p._id}>{p.fullName} ({p.vehicleType})</option>
                                 ))}
                               </select>
                               <button onClick={() => handleAssign(order._id)} className="px-3 py-1 text-xs btn-primary">Assign</button>
                             </div>
                           )}
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-gray-500">Processing Completed</span>
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
