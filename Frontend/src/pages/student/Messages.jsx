import { useState } from 'react';
import { contactService } from '../../services/contactService';
import { useAuth } from '../../context/AuthContext';
import { Send, LifeBuoy, CheckCircle } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactService.submitContact({
        name: user.name || 'Student',
        email: user.email,
        subject: formData.subject,
        message: formData.message,
      });
      setFormData({ subject: '', message: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      alert('Failed to send support ticket: ' + (error?.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-2">Send inquiries or support tickets directly to the Administrators.</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <LifeBuoy className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Submit a New Ticket</h3>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-accent-dark rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Ticket submitted successfully!</p>
              <p className="text-sm">The admin team will reply to your registered email address ({user?.email}).</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="form-label">Subject *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input"
              placeholder="Briefly describe your issue"
              minLength={5}
              required
            />
          </div>
          <div>
            <label className="form-label">Message details *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="textarea"
              placeholder="Provide as much detail as possible so our admins can assist you..."
              minLength={10}
              required
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? 'Submitting...' : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-gray-200 rounded-xl p-6 mt-8">
        <h4 className="font-semibold text-sky-900 mb-2">How it works</h4>
        <ul className="text-sm text-sky-800 list-disc list-inside space-y-1 ml-4">
          <li>Your ticket will be reviewed by the administration team.</li>
          <li>Replies will be sent directly to your email inbox.</li>
          <li>For immediate assistance, please check your mailbox regularly.</li>
          <li>Live interactions with doctors and vendors can be done via the Live Chat tab.</li>
        </ul>
      </div>
    </div>
  );
};

export default Messages;
