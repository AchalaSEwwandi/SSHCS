import { useState, useEffect, useRef } from "react";
import { chatService } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { Send, Search, Users, CircleUser, ArrowLeft, Loader2, Info } from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' or 'contacts'
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  const [selectedUser, setSelectedUser] = useState(null); // The user we are chatting with
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const messagesEndRef = useRef(null);

  // Poll for messages interval (since no socket.io yet)
  const pollInterval = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
    return () => clearInterval(pollInterval.current);
  }, []);

  useEffect(() => {
    // If a user is selected, poll their messages every 3 seconds to fake real-time
    if (selectedUser) {
      fetchMessages(selectedUser._id);
      pollInterval.current = setInterval(() => {
        fetchMessages(selectedUser._id, true); // true = silent fetch without loading state
      }, 3000);
    } else {
      clearInterval(pollInterval.current);
    }
    
    return () => clearInterval(pollInterval.current);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setIsLoadingChats(true);
      const res = await chatService.getConversations();
      if (res.success) setConversations(res.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await chatService.getContacts();
      if (res.success) setContacts(res.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchMessages = async (userId, silent = false) => {
    try {
      if (!silent) setIsLoadingMessages(true);
      const res = await chatService.getMessages(userId);
      if (res.success) {
        setMessages(res.data);
        if (silent) fetchConversations(); // Also silently update the sidebar summary
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    
    const textToSend = newMessage.trim();
    setNewMessage(""); // Optimistically clear input
    
    try {
      setIsSending(true);
      const res = await chatService.sendMessage(selectedUser._id, textToSend);
      if (res.success) {
        // Append optimistic message
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();
        fetchConversations(); // Update side bar snippet summary
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const startChatWith = (targetUser) => {
    // If opening from "contacts" tab, just select them and we pull history
    setSelectedUser(targetUser);
  };

  // Prepare UI Lists
  const displayList = activeTab === "chats" ? conversations : contacts;
  
  // For 'chats' displayList are conversation objects. We need to extract the *other* participant
  const getOtherParticipant = (convo) => {
    return convo.participants?.find((p) => p._id !== user?.id) || {};
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-50 max-w-7xl mx-auto rounded-xl shadow-sm border border-gray-200 mt-2 mb-6">
      
      {/* Left Sidebar - Chat List / Contact List */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Live Chat</h2>
          <div className="flex w-full mt-4 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab("chats")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'chats' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Recent
            </button>
            <button 
              onClick={() => setActiveTab("contacts")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'contacts' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Start New
            </button>
          </div>
          
          {/* Search box optionally... */}
          <div className="relative mt-4">
            <Search className="absolute w-4 h-4 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingChats && activeTab === 'chats' ? (
            <div className="flex items-center justify-center h-32 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeTab === 'chats' && conversations.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No recent conversations.</p>
                  <p className="text-xs mt-1 text-gray-400">Check the "Start New" tab to find someone.</p>
                </div>
              )}
              
              {activeTab === 'chats' && conversations.map((convo) => {
                const partner = convo.participants.find(p => p._id !== user.id) || {};
                
                // search filtering
                if (searchTerm && !partner.name?.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                return (
                  <button 
                    key={convo._id}
                    onClick={() => startChatWith(partner)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-3 ${selectedUser?._id === partner._id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {partner.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-gray-900 truncate">
                          {partner.name}
                        </p>
                        <span className="text-xs text-gray-400">{new Date(convo.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs text-blue-600 font-medium mb-0.5">{partner.role === 'shop_owner' ? partner.shopName || 'Vendor' : partner.role}</p>
                      <p className="text-sm text-gray-500 truncate">{convo.lastMessage}</p>
                    </div>
                  </button>
                );
              })}

              {activeTab === 'contacts' && contacts.map((contact) => {
                if (searchTerm && !contact.name?.toLowerCase().includes(searchTerm.toLowerCase())) return null;
                
                return (
                  <button 
                    key={contact._id}
                    onClick={() => startChatWith(contact)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                      <CircleUser className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {contact.role === 'shop_owner' ? (contact.shopName || 'Campus Vendor') : contact.role}
                        {contact.specialization ? ` • ${contact.specialization}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Active Chat */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-blue-600 translate-x-0.5" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Your Messages</h3>
            <p className="max-w-xs">Select a conversation or start a new chat with a doctor, vendor, or student.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-16 px-4 border-b border-gray-200 flex items-center gap-3 bg-white">
              <button 
                onClick={() => setSelectedUser(null)}
                className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selectedUser.name}</h3>
                <p className="text-xs font-medium text-blue-600 capitalize">
                  {selectedUser.role === 'shop_owner' ? selectedUser.shopName || 'Vendor' : selectedUser.role}
                </p>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 border border-gray-200 text-sky-800 text-xs px-4 py-2 rounded-lg flex items-center gap-2 max-w-sm text-center">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  This is the beginning of your conversation history with {selectedUser.name}.
                </div>
              </div>

              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          isMe 
                            ? 'bg-blue-500 text-white rounded-br-sm shadow-sm' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="break-words text-[15px]">{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-sky-100' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type your message..."
                  className="w-full max-h-32 min-h-[48px] border border-gray-300 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none bg-gray-50"
                  rows="1"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="w-12 h-12 flex-shrink-0 bg-blue-500 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5" />}
                </button>
              </form>
              <p className="text-[10px] text-center text-gray-400 mt-2">Press Enter to send, Shift + Enter for new line.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

