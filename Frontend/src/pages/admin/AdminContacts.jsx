import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { Search, Loader2, Mail, MessageSquare, Send } from "lucide-react";

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await adminService.getContacts();
      setContacts(res.data || []);
    } catch (err) {
      setError("Failed to fetch contacts.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (contactId) => {
    if (!replyText.trim()) return;
    try {
      setError("");
      await adminService.replyContact(contactId, replyText);
      setContacts(contacts.map(c => 
        c._id === contactId ? { ...c, status: "replied", replyMessage: replyText, repliedAt: new Date() } : c
      ));
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send reply");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
          <p className="text-gray-500">View and reply to incoming messages.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            Loading messages...
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Inbox is empty</h3>
            <p>You have no contact submissions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {contacts.map((contact) => (
              <div key={contact._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          {contact.subject}
                       </h3>
                       <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                         contact.status === "replied" ? "bg-accent/10 text-accent-dark" : "bg-amber-100 text-amber-700"
                       }`}>
                         {contact.status === "replied" ? "Replied" : "Awaiting Reply"}
                       </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-4 flex gap-4">
                      <span><strong>From:</strong> {contact.name} ({contact.email})</span>
                      <span><strong>Date:</strong> {new Date(contact.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap border border-gray-100">
                      {contact.message}
                    </div>

                    {contact.status === "replied" && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-blue-900 text-sm border border-blue-100">
                        <div className="font-semibold mb-1 text-blue-800 flex items-center gap-2">
                          <Send className="w-4 h-4"/> Admin Reply ({new Date(contact.repliedAt).toLocaleDateString()}):
                        </div>
                        <div className="whitespace-pre-wrap">{contact.replyMessage}</div>
                      </div>
                    )}
                  </div>
                  
                  {contact.status !== "replied" && replyingTo !== contact._id && (
                    <div className="flex-shrink-0">
                       <button
                         onClick={() => setReplyingTo(contact._id)}
                         className="btn-primary py-2 px-4 shadow-sm flex items-center gap-2"
                       >
                         <Send className="w-4 h-4" /> Reply
                       </button>
                    </div>
                  )}
                </div>

                {replyingTo === contact._id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <label className="block text-sm text-gray-700 font-medium mb-2">Your Reply:</label>
                    <textarea 
                      rows="4" 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600 text-sm mb-3"
                    ></textarea>
                    <div className="flex gap-3 justify-end">
                       <button 
                         onClick={() => { setReplyingTo(null); setReplyText(""); }}
                         className="btn-outline px-4 py-2 text-sm"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={() => handleReplySubmit(contact._id)}
                         disabled={!replyText.trim()}
                         className="btn-primary px-4 py-2 py-2 flex items-center gap-2 text-sm disabled:opacity-50"
                       >
                         <Send className="w-4 h-4"/> Send Reply
                       </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
