import { useState, useEffect } from "react";
import { messageService } from "../../services/messageService";
import { Loader2, Mail, Send, User } from "lucide-react";

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await messageService.getReceivedMessages();
      setMessages(res.data || []);
    } catch (err) {
      setError("Failed to fetch inbox messages");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      const res = await messageService.replyToMessage(id, replyText);
      setMessages(messages.map(m => m._id === id ? { ...m, reply: replyText, isReplied: true } : m));
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      alert("Failed to send reply");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500">Respond to messages and inquiries from students.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Messages</h3>
            <p>Your inbox is empty.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((message) => (
              <div key={message._id} className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                      <User className="w-4 h-4" /> {message.senderName || "Student"}  {new Date(message.createdAt).toLocaleDateString()}
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${message.isReplied ? "bg-accent/10 text-accent-dark" : "bg-yellow-100 text-yellow-700"}`}>
                        {message.isReplied ? "Replied" : "Pending"}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-gray-800 text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>

                    {message.isReplied && message.reply && (
                      <div className="mt-4 p-4 border border-blue-100 bg-blue-50 rounded-lg text-sm text-blue-900">
                        <div className="font-semibold text-blue-800 mb-1">Your Reply:</div>
                        {message.reply}
                      </div>
                    )}
                  </div>
                  
                  {!message.isReplied && replyingTo !== message._id && (
                    <button onClick={() => setReplyingTo(message._id)} className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
                       <Send className="w-4 h-4" /> Reply
                    </button>
                  )}
                </div>

                {replyingTo === message._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600 text-sm"
                      rows="3"
                    ></textarea>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setReplyingTo(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">Cancel</button>
                      <button onClick={() => handleReply(message._id)} disabled={!replyText.trim()} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
                         <Send className="w-4 h-4" /> Send Reply
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
