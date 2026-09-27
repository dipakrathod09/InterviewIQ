/**
 * Abstract AI Provider Interface
 * All AI providers must implement these methods.
 * For Phase 3 architecture setup, we return generic/stubbed objects.
 */

class MockProvider {
  async generateQuestions(context) {
    console.log('[MockProvider] Generating questions for context:', { id: context._id, mode: context.interviewMode });
    
    const count = context.questionCount || 3;
    const questions = [];

    if (context.interviewMode === 'Personalized' && context.personalizedContext) {
      const pc = context.personalizedContext;
      
      if (pc.match?.missingSkills?.length > 0) {
        questions.push({
          questionText: `How would ${pc.match.missingSkills[0]} improve maintainability in a project like ${pc.resume?.projects?.[0]?.name || 'your previous work'}?`,
          topic: pc.match.missingSkills[0],
          difficulty: context.difficulty || "Medium"
        });
      } else if (pc.match?.preparationPriorities?.length > 0) {
        questions.push({
          questionText: `Let's discuss ${pc.match.preparationPriorities[0]}. How would you approach it given your background?`,
          topic: "Preparation",
          difficulty: context.difficulty || "Medium"
        });
      }

      if (pc.performance?.weakTopics?.length > 0) {
        questions.push({
          questionText: `Explain a ${pc.performance.weakTopics[0]} concept you found challenging and how it affects real applications.`,
          topic: pc.performance.weakTopics[0],
          difficulty: context.difficulty || "Medium"
        });
      } else if (pc.jobDescription?.role) {
        questions.push({
          questionText: `As a ${pc.jobDescription.role}, what is your approach to ensuring code quality?`,
          topic: "Code Quality",
          difficulty: context.difficulty || "Medium"
        });
      }

      if (pc.resume?.strengths?.length > 0) {
        questions.push({
          questionText: `Walk through one technical decision you made where your strength in ${pc.resume.strengths[0]} helped you.`,
          topic: "Architecture",
          difficulty: context.difficulty || "Hard"
        });
      } else {
        const stack = context.techStack?.[0] || 'your core stack';
        questions.push({
          questionText: `What is the most complex issue you've resolved in ${stack}?`,
          topic: stack,
          difficulty: context.difficulty || "Hard"
        });
      }
    } else {
      questions.push({
        questionText: "Can you explain the virtual DOM in React?",
        topic: "React",
        difficulty: "Medium"
      }, {
        questionText: "How does event delegation work in JavaScript?",
        topic: "JavaScript",
        difficulty: "Medium"
      });
    }

    while (questions.length < count) {
      questions.push({
        questionText: `General ${context.targetRole || 'engineering'} question ${questions.length + 1}.`,
        topic: "General",
        difficulty: "Medium"
      });
    }

    return questions.slice(0, count);
  }

  async evaluateAnswer(context) {
    console.log('[MockProvider] Evaluating answer:', context.userAnswer);
    return {
      score: 7,
      technicalAccuracy: 7,
      completeness: 6,
      communication: 8,
      problemSolving: 7,
      depth: 6,
      strengths: ["Clear communication", "Basic understanding shown"],
      gaps: ["Missed deeper architectural reasons"],
      missingConcepts: ["Reconciliation process"],
      improvementTips: ["Dive deeper into React fiber"],
      modelAnswer: "The virtual DOM is a lightweight copy of the real DOM..."
    };
  }

  async generateOverallFeedback(context) {
    return {
      summary: "Good overall performance with solid foundational knowledge.",
      strengths: ["JavaScript basics", "React hooks"],
      weaknesses: ["Advanced CSS", "State management"],
      missingConcepts: ["Redux", "CSS Grid"],
      improvementPriorities: ["Deepen knowledge in global state management"],
      nextSteps: ["Practice Redux toolkit"]
    };
  }

  async generateDashboardInsights(context) {
    return {
      summary: "You are improving steadily.",
      focusAreas: ["React Context API", "Node streams"],
      recommendedNextStep: "Start a focused practice on Node.js",
      reasoning: "Your Node.js scores have been slightly lower in recent sessions."
    };
  }

  async analyzeResume(context) {
    return {
      status: "completed",
      summary: "A solid frontend developer resume.",
      skills: {
        technical: ["Frontend Development"],
        programmingLanguages: ["JavaScript", "HTML", "CSS"],
        frameworks: ["React", "Express"],
        databases: ["MongoDB"],
        tools: ["Git", "Webpack"],
        softSkills: ["Teamwork"]
      },
      experience: [
        {
          title: "Frontend Developer",
          organization: "TechCorp",
          duration: "2020 - Present",
          highlights: ["Built scalable UI", "Improved performance by 20%"]
        }
      ],
      education: [
        {
          degree: "B.S. Computer Science",
          institution: "University of Tech",
          duration: "2016 - 2020"
        }
      ],
      projects: [
        {
          name: "Portfolio Website",
          technologies: ["React", "CSS"],
          highlights: ["Showcased 5 projects"]
        }
      ],
      certifications: [],
      strengths: ["Clear skill listings"],
      weaknesses: ["Lacks quantifiable achievements"],
      missingInformation: ["Links to live projects"],
      improvementSuggestions: ["Add metrics to bullet points"],
      analyzedAt: new Date()
    };
  }

  async analyzeJobDescription(context) {
    return {
      status: "completed",
      role: "Frontend Developer",
      requiredSkills: ["React", "JavaScript", "CSS"],
      preferredSkills: ["TypeScript", "Next.js"],
      responsibilities: ["Build UI components", "Optimize performance"],
      experienceRequirements: "2+ years",
      keywords: ["Frontend", "React"],
      analyzedAt: new Date()
    };
  }

  async matchResumeToJob(context) {
    return {
      matchScore: 75,
      matchedSkills: ["React", "JavaScript"],
      missingSkills: ["Next.js", "TypeScript"],
      partialMatches: ["CSS"],
      preparationPriorities: ["Learn TypeScript fundamentals"],
      explanation: "Good match overall, but lacking some preferred modern stack technologies."
    };
  }
}

export default new MockProvider();
