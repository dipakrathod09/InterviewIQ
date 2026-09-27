import { InterviewSession } from '../models/InterviewSession.js';
import { aiProvider } from './ai/aiProvider.js';

export const getStats = async (userId) => {
  const sessions = await InterviewSession.find({ userId, status: 'completed' });

  const totalInterviews = sessions.length;
  let averageScore = 0;
  let bestScore = 0;
  let questionsAnswered = 0;
  
  const topicScores = {};

  const typeScores = {};
  const diffScores = {};
  const recentScores = [];

  if (totalInterviews > 0) {
    let totalScoreSum = 0;
    
    // Sort chronologically for recentScores
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    recentScores.push(...sortedSessions.slice(-5).map(s => s.overallScore || 0));
    
    sessions.forEach(session => {
      totalScoreSum += (session.overallScore || 0);
      if (session.overallScore > bestScore) {
        bestScore = session.overallScore;
      }
      
      const type = session.interviewType || 'General';
      if (!typeScores[type]) typeScores[type] = { total: 0, count: 0 };
      typeScores[type].total += (session.overallScore || 0);
      typeScores[type].count++;

      const diff = session.difficulty || 'Medium';
      if (!diffScores[diff]) diffScores[diff] = { total: 0, count: 0 };
      diffScores[diff].total += (session.overallScore || 0);
      diffScores[diff].count++;

      session.questions.forEach(q => {
        questionsAnswered++;
        if (q.topic && q.evaluation?.score) {
          if (!topicScores[q.topic]) {
            topicScores[q.topic] = { total: 0, count: 0 };
          }
          topicScores[q.topic].total += q.evaluation.score;
          topicScores[q.topic].count++;
        }
      });
    });

    averageScore = parseFloat((totalScoreSum / totalInterviews).toFixed(1));
  }

  // Calculate averages per topic
  const topicAverages = Object.entries(topicScores).map(([topic, data]) => ({
    topic,
    average: parseFloat((data.total / data.count).toFixed(1))
  }));

  // Sort topics by average score
  topicAverages.sort((a, b) => a.average - b.average);

  const weakTopics = topicAverages.slice(0, 3).map(t => t.topic);
  const strongTopics = topicAverages.slice(-3).reverse().map(t => t.topic);

  const interviewTypePerformance = Object.fromEntries(
    Object.entries(typeScores).map(([k, v]) => [k, parseFloat((v.total / v.count).toFixed(1))])
  );
  
  const difficultyPerformance = Object.fromEntries(
    Object.entries(diffScores).map(([k, v]) => [k, parseFloat((v.total / v.count).toFixed(1))])
  );

  return {
    overview: {
      totalInterviews,
      averageScore,
      bestScore,
      questionsAnswered
    },
    topicAverages,
    weakTopics,
    strongTopics,
    recentScores,
    interviewTypePerformance,
    difficultyPerformance
  };
};

export const getInsights = async (userId) => {
  const stats = await getStats(userId);
  
  if (stats.overview.totalInterviews === 0) {
    return {
      summary: "You haven't completed any interviews yet.",
      focusAreas: [],
      recommendedNextStep: "Start your first mock interview!",
      reasoning: "We need data to provide personalized insights."
    };
  }

  const context = {
    completedInterviews: stats.overview.totalInterviews,
    averageScore: stats.overview.averageScore,
    weakTopics: stats.weakTopics,
    strongTopics: stats.strongTopics
  };

  try {
    const insights = await aiProvider.generateDashboardInsights(context);
    return insights;
  } catch (error) {
    console.error('AI Insights failed, using deterministic fallback', error);
    // Deterministic fallback
    return {
      summary: `You have completed ${stats.overview.totalInterviews} interviews with an average score of ${stats.overview.averageScore}/10.`,
      focusAreas: stats.weakTopics,
      recommendedNextStep: stats.weakTopics.length > 0 
        ? `Focus practice on ${stats.weakTopics[0]}` 
        : 'Continue practicing general topics',
      reasoning: "Based on historical scores, this is your weakest area."
    };
  }
};
