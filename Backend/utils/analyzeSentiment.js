/**
 * Simple keyword-based sentiment analysis
 * Can be enhanced with ML models later
 */

const positiveKeywords = [
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
  'perfect', 'satisfied', 'happy', 'love', 'best', 'awesome',
  'quick', 'fast', 'polite', 'helpful', 'recommend', 'quality',
  'nice', 'clean', 'fresh', 'accurate', 'reliable', 'trustworthy'
];

const negativeKeywords = [
  'bad', 'poor', 'terrible', 'awful', 'worst', 'horrible',
  'disappointed', 'unsatisfied', 'unsatisfactory', 'angry', 'upset',
  'slow', 'late', 'delay', 'rude', 'unprofessional', 'mistake',
  'error', 'wrong', 'missing', 'damaged', 'broken', 'dirty',
  'unreliable', 'untrustworthy', 'waste', 'expensive', 'overpriced'
];

const normalizeText = (text) => {
  return text.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const analyzeSentiment = (text) => {
  const normalized = normalizeText(text);
  const words = normalized.split(' ');

  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveKeywords.includes(word)) positiveCount++;
    if (negativeKeywords.includes(word)) negativeCount++;
  });

  // Check for negations that flip sentiment
  const negations = ['not', 'no', 'never', 'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'can\'t'];
  const hasNegation = negations.some((neg) => normalized.includes(neg));

  if (positiveCount > negativeCount) {
    return hasNegation ? 'negative' : 'positive';
  } else if (negativeCount > positiveCount) {
    return hasNegation ? 'positive' : 'negative';
  } else {
    return 'neutral';
  }
};

export default analyzeSentiment;
