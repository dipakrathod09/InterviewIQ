import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  topic: { type: String },
  difficulty: { type: String },
  userAnswer: { type: String, default: null },
  evaluation: {
    score: { type: Number, min: 0, max: 10 },
    technicalAccuracy: { type: Number, min: 0, max: 10 },
    completeness: { type: Number, min: 0, max: 10 },
    communication: { type: Number, min: 0, max: 10 },
    problemSolving: { type: Number, min: 0, max: 10 },
    depth: { type: Number, min: 0, max: 10 },
    strengths: [String],
    gaps: [String],
    missingConcepts: [String],
    improvementTips: [String],
    modelAnswer: { type: String }
  }
});

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRole: { type: String, required: true },
    interviewType: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    difficulty: { type: String, required: true },
    techStack: [String],
    
    interviewMode: { type: String, default: 'Normal' },
    focusTopic: { type: String },
    
    questionCount: { type: Number, default: 3, enum: [3, 5, 10] },

    personalizedContext: { type: mongoose.Schema.Types.Mixed },
    
    adaptiveContext: { type: mongoose.Schema.Types.Mixed },
    
    questions: [questionSchema],
    
    overallScore: { type: Number, min: 0, max: 10 },
    
    overallFeedback: {
      summary: String,
      strengths: [String],
      weaknesses: [String],
      missingConcepts: [String],
      improvementPriorities: [String],
      nextSteps: [String]
    },
    
    status: {
      type: String,
      enum: ['created', 'in_progress', 'completed', 'abandoned'],
      default: 'created',
    },
    
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
