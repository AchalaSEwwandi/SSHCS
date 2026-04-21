import { useState, useEffect } from "react";
import { feedbackService } from "../../services/feedbackService";
import { Star, Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SENTIMENT_CONFIG = {
  positive: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e" },
  neutral:  { bg: "#fffbeb", border: "#fde68a", text: "#b45309", dot: "#eab308" },
  negative: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", dot: "#ef4444" },
};

function SentimentBadge({ sentiment }) {
  const s = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.dot }} />
      {sentiment}
    </span>
  );
}

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-amber-400 fill-current" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function VendorFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user?._id || user?.id) fetchFeedbacks();
  }, [user]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await feedbackService.getShopFeedback(user._id || user.id);
      setFeedbacks(res.data || []);
      setStats(res.stats || null);
    } catch {
      setError("Failed to load customer feedback.");
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = () => {
    if (feedbacks.length === 0) return "0.0";
    const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    return (sum / feedbacks.length).toFixed(1);
  };

  const initials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const AVATAR_COLORS = ["#6366f1","#8b5cf6","#f59e0b","#ef4444","#10b981","#3b82f6"];
  const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
          <p className="text-sm text-gray-400 mt-0.5">What customers are saying about your shop.</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm"
          style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", color: "#b45309" }}
        >
          <Star className="w-4 h-4 fill-current text-amber-400" />
          {getAverageRating()} / 5.0
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Total Reviews */}
          <div
            className="relative rounded-2xl border p-5 overflow-hidden"
            style={{ backgroundColor: "#eef2ff", borderColor: "#c7d2fe" }}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 bg-indigo-500" />
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-indigo-500">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">Total Reviews</p>
            <p className="text-3xl font-extrabold text-indigo-700">{stats.total}</p>
          </div>

          {/* Average Rating */}
          <div
            className="relative rounded-2xl border p-5 overflow-hidden"
            style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 bg-amber-400" />
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-amber-400">
              <Star className="w-5 h-5 text-white fill-current" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">Average Rating</p>
            <p className="text-3xl font-extrabold text-amber-700">{getAverageRating()}</p>
          </div>

          {/* Sentiment */}
          <div
            className="relative rounded-2xl border p-5 overflow-hidden"
            style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe" }}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 bg-purple-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-4">Sentiment</p>
            <div className="flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-full flex-shrink-0"
                style={{
                  background: `conic-gradient(
                    #22c55e 0% ${(stats.positive / stats.total) * 100}%,
                    #eab308 ${(stats.positive / stats.total) * 100}% ${((stats.positive + stats.neutral) / stats.total) * 100}%,
                    #ef4444 ${((stats.positive + stats.neutral) / stats.total) * 100}% 100%
                  )`,
                  borderRadius: "50%",
                }}
              />
              <div className="space-y-1.5 flex-1">
                {[
                  { label: "Positive", count: stats.positive, dot: "#22c55e" },
                  { label: "Neutral",  count: stats.neutral,  dot: "#eab308" },
                  { label: "Negative", count: stats.negative, dot: "#ef4444" },
                ].map(({ label, count, dot }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                      <span className="text-xs text-purple-700">{label}</span>
                    </div>
                    <span className="text-xs font-bold text-purple-800">
                      {((count / stats.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-sm">Loading reviews...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-10 rounded-2xl border border-indigo-100 bg-indigo-50 text-center">
            <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-indigo-800">No Feedback Yet</h3>
            <p className="text-sm text-indigo-500 mt-1">Customer reviews and ratings will appear here.</p>
          </div>
        ) : (
          feedbacks.map((feedback) => {
            const name = feedback.userId?.name || "Anonymous";
            const color = avatarColor(name);
            return (
              <div
                key={feedback._id}
                className="rounded-2xl border p-5 bg-white transition-shadow hover:shadow-md"
                style={{ borderColor: "#e5e7eb" }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {initials(name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{name}</p>
                        <StarRow rating={feedback.rating} />
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">
                      {feedback.comment || "No detailed comment provided."}
                    </p>

                    {feedback.sentiment && (
                      <div className="mt-3">
                        <SentimentBadge sentiment={feedback.sentiment} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}