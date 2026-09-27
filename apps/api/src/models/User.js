import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    targetRole: {
      type: String,
      default: '',
    },
    experienceLevel: {
      type: String,
      default: '',
    },
    techStack: {
      type: [String],
      default: [],
    },
    resume: {
      rawText: String,
      // PDF upload metadata
      originalFileName: String,
      mimeType: String,
      fileSize: Number,
      uploadedAt: Date,
      // AI analysis results
      analyzedAt: Date,
      summary: String,
      skills: {
        technical: [String],
        programmingLanguages: [String],
        frameworks: [String],
        databases: [String],
        tools: [String],
        softSkills: [String]
      },
      education: [{
        degree: String,
        institution: String,
        duration: String
      }],
      experience: [{
        title: String,
        organization: String,
        duration: String,
        highlights: [String]
      }],
      projects: [{
        name: String,
        technologies: [String],
        highlights: [String]
      }],
      strengths: [String],
      weaknesses: [String],
      missingInformation: [String],
      improvementSuggestions: [String]
    },
    jobDescription: {
      rawText: String,
      analyzedAt: Date,
      role: String,
      requiredSkills: [String],
      preferredSkills: [String],
      responsibilities: [String],
      experienceRequirements: String,
      keywords: [String]
    },
    matchAnalysis: {
      analyzedAt: Date,
      matchScore: Number,
      matchedSkills: [String],
      missingSkills: [String],
      partialMatches: [String],
      preparationPriorities: [String],
      explanation: String
    }
  },
  { timestamps: true }
);

// We won't use a pre-save hook for hashing, we will hash in the service layer as requested by 'do not hide important logic behind unnecessary abstractions', but a pre-save hook is also fine. Let's do it in the service to keep it explicit.

export const User = mongoose.model('User', userSchema);
