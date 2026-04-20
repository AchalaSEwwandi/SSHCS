import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { CheckCircle, XCircle, Loader2, FileText, User } from "lucide-react";

export default function AdminApprovals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({ status: "pending" });
      setPendingUsers(res.data || []);
    } catch (err) {
      setError("Failed to fetch pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    try {
      setError("");
      await adminService.approveUser(id);
      setSuccess(`${name} has been approved.`);
      setPendingUsers(pendingUsers.filter(u => u._id !== id));
    } catch (err) {
      setError(`Failed to approve ${name}.`);
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to reject ${name}?`)) return;
    try {
      setError("");
      await adminService.rejectUser(id);
      setSuccess(`${name} has been rejected.`);
      setPendingUsers(pendingUsers.filter(u => u._id !== id));
    } catch (err) {
      setError(`Failed to reject ${name}.`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-500">Review doctors and shops waiting for approval.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
      {success && <div className="p-4 bg-green-50 text-accent-dark rounded-lg">{success}</div>}

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          Loading pending requests...
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
          <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
          <p>There are no pending accounts to review.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingUsers.map((user) => (
            <div key={user._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
              <div className="mb-4">
                <div className="flex items-start gap-4 mb-3">
                  {user.avatar ? (
                    <img src={`http://localhost:5000/uploads/${user.avatar}`} alt={user.name} className="w-12 h-12 rounded-full object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{user.name}</h3>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium capitalize">
                        {user.role.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-0.5"><strong className="text-gray-700">Email:</strong> {user.email}</p>
                    <p className="text-sm text-gray-500"><strong className="text-gray-700">Phone:</strong> {user.phone}</p>
                  </div>
                </div>
                
                {user.role === "doctor" && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 border border-gray-100">
                    <p className="mb-1"><strong>License:</strong> {user.medicalRegNumber || "N/A"}</p>
                    <p className="mb-1"><strong>Specialty:</strong> {user.specialization || "N/A"}</p>
                    <p className="mb-2"><strong>Hospital:</strong> {user.hospitalName || "N/A"}</p>
                    {user.medicalLicenseFile && (
                      <a href={`http://localhost:5000/uploads/${user.medicalLicenseFile}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-2.5 py-1.5 rounded mt-1">
                        <FileText className="w-3.5 h-3.5" /> View Medical License
                      </a>
                    )}
                  </div>
                )}
                {user.role === "shop_owner" && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 border border-gray-100">
                    <p className="mb-1"><strong>Shop:</strong> {user.shopName || "N/A"}</p>
                    <p className="mb-1"><strong>Type:</strong> {user.shopType || user.businessType || "N/A"}</p>
                    <p className="mb-2"><strong>Address:</strong> {user.shopAddress || "N/A"}</p>
                    {user.businessLicenseFile && (
                      <a href={`http://localhost:5000/uploads/${user.businessLicenseFile}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-2.5 py-1.5 rounded mt-1">
                        <FileText className="w-3.5 h-3.5" /> View Business License
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-auto flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleApprove(user._id, user.name)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button 
                  onClick={() => handleReject(user._id, user.name)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
