import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  description: { type: String, required: true },
  isDone: { type: Boolean, default: false }
});

const roadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ideaTitle: { type: String, required: true },
    tasks: [taskSchema]
  },
  { timestamps: true }
);

export default mongoose.model('Roadmap', roadmapSchema);
