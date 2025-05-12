/**
 * AI Detection Phase
 *
 * This phase analyzes content for patterns commonly found in AI-generated text:
 * - Overused transition phrases
 * - Generic hedging language
 * - Stiff academic phrasing
 * - Overly balanced tone
 * - Unnatural vocabulary
 * - Repetitive structure
 * - Sentence templates
 *
 * It calculates a score based on these patterns and flags content that exceeds
 * a configurable threshold as potentially AI-generated.
 */

import { parse } from 'node-html-parser';
import { CATEGORIES } from './types.js';
import { addIssue, extractTextContent } from './utils.js';

// Pattern collections from our analysis
const AI_PATTERNS = {
  // Common transition phrases overused in AI text
  transitions: [
    'moreover', 'furthermore', 'in conclusion', 'therefore', 'thus',
    'consequently', 'in addition', 'on the other hand', 'as a result',
    'to summarize', 'in contrast', 'that being said', 'however', 'nevertheless'
  ],
  
  // Generic hedging language
  hedging: [
    'it seems that', 'one could argue', 'this may suggest', 
    'there is a possibility that', 'it is important to note',
    'it should be noted that', 'some might say', 'studies have shown that',
    'according to research', 'in many cases', 'in other words'
  ],
  
  // Formal and stiff phrasings
  formality: [
    'in today\'s world', 'in this article, we will explore',
    'the purpose of this essay is to', 'it is widely believed',
    'throughout history', 'let us delve into', 'this paper aims to',
    'it is essential to understand', 'in recent years', 'in modern times'
  ],
  
  // Overly balanced or diplomatic tone
  balanced: [
    'both sides have valid points', 'there are pros and cons',
    'while some may disagree, others support', 'this is a topic of much debate',
    'the answer is not black and white'
  ],
  
  // Unnatural vocabulary that humans rarely use in casual writing
  unnatural: [
    'utilize', 'commence', 'endeavor', 'leverage', 'albeit',
    'notwithstanding', 'whilst', 'heretofore'
  ],
  
  // Common phrase templates
  templates: [
    'is an important aspect of', 'can be defined as',
    'when it comes to', 'plays a crucial role in',
    'this brings us to the question of'
  ],
  
  // Common sentence starters
  starters: [
    'as mentioned earlier', 'to begin with', 'with that being said',
    'in order to better understand', 'it goes without saying',
    'it\'s worth mentioning that'
  ],
  
  // Overused universal claims
  universal: [
    'everyone knows that', 'it is universally accepted that',
    'all people strive for', 'the world is constantly changing'
  ],
  
  // Common call-to-actions in AI content
  callToActions: [
    'let\'s explore this further', 'read on to learn more',
    'in the following sections', 'let\'s dive in',
    'discover the benefits of', 'this guide will help you understand'
  ]
};

/**
 * Main handler for AI Detection phase
 *
 * @param {string} htmlContent - Raw HTML content to analyze
 * @param {Map} issuesMap - Map to store found issues
 * @param {string} baseUrl - Base URL for the document
 * @param {string} documentPath - Path to the HTML file
 * @param {string} distPath - Path to the build output directory
 * @param {Object} options - Configuration options
 * @param {number} [options.aiDetectionThreshold=60] - Score threshold (0-100) for flagging AI content
 * @param {string[]} [options.aiDetectionExcludePaths=[]] - Paths to exclude from AI detection
 */
export async function checkAiDetectionPhase(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {}
) {
  // Skip if this path is in exclusion list
  const excludePaths = options.aiDetectionExcludePaths || [];
  if (excludePaths.some(pattern => documentPath.includes(pattern))) {
    return;
  }
  
  // Parse HTML and extract text content
  const root = parse(htmlContent);
  
  // Extract all paragraph text for analysis
  const paragraphs = root.querySelectorAll('p, article, section, .content, .post');
  
  // Skip if not enough content to analyze
  if (paragraphs.length === 0) {
    return;
  }
  
  // Extract text from all content sections
  let fullText = '';
  for (const paragraph of paragraphs) {
    const text = extractTextContent(paragraph);
    if (text && text.trim().length > 0) {
      fullText += ' ' + text;
    }
  }
  
  // Skip if not enough text to analyze (less than 100 characters)
  fullText = fullText.trim();
  if (fullText.length < 100) {
    return;
  }
  
  // Calculate AI detection score
  const score = calculateAiScore(fullText);
  
  // Use configurable threshold (default 60 on 100-point scale)
  const threshold = options.aiDetectionThreshold || 60;
  
  // If score exceeds threshold, flag as potential AI content
  if (score >= threshold) {
    const scorePercentage = Math.round(score);
    addIssue(
      issuesMap,
      documentPath,
      `AI content score: ${scorePercentage}% (threshold: ${threshold}%)`,
      CATEGORIES.AI_CONTENT,
      distPath
    );
  }
}

/**
 * Calculate an AI detection score for the provided text
 * 
 * @param {string} text - Text content to analyze
 * @returns {number} - Score from 0-100 indicating likelihood of AI generation
 */
function calculateAiScore(text) {
  // Normalize text to lowercase for pattern matching
  const normalizedText = text.toLowerCase();
  
  // Word count is used to normalize scores across different text lengths
  const wordCount = text.split(/\s+/).length;
  
  // Skip extremely short content
  if (wordCount < 20) {
    return 0;
  }
  
  // Individual pattern category scores
  let scores = {
    transitions: 0,
    hedging: 0,
    formality: 0,
    balanced: 0,
    unnatural: 0,
    templates: 0,
    starters: 0,
    universal: 0,
    callToActions: 0
  };
  
  // Check for transition phrases (weighted by frequency per word count)
  for (const phrase of AI_PATTERNS.transitions) {
    const count = countOccurrences(normalizedText, phrase);
    scores.transitions += count;
  }
  
  // Check for hedging language
  for (const phrase of AI_PATTERNS.hedging) {
    const count = countOccurrences(normalizedText, phrase);
    scores.hedging += count * 2; // Weighted higher as stronger indicator
  }
  
  // Check for formal/stiff phrasing
  for (const phrase of AI_PATTERNS.formality) {
    const count = countOccurrences(normalizedText, phrase);
    scores.formality += count * 2;
  }
  
  // Check for overly balanced tone
  for (const phrase of AI_PATTERNS.balanced) {
    const count = countOccurrences(normalizedText, phrase);
    scores.balanced += count * 3; // Weighted even higher
  }
  
  // Check for unnatural vocabulary
  for (const word of AI_PATTERNS.unnatural) {
    const count = countOccurrences(normalizedText, word);
    scores.unnatural += count * 2;
  }
  
  // Check for template phrases
  for (const template of AI_PATTERNS.templates) {
    const count = countOccurrences(normalizedText, template);
    scores.templates += count * 3;
  }
  
  // Check for common sentence starters
  for (const starter of AI_PATTERNS.starters) {
    const count = countOccurrences(normalizedText, starter);
    scores.starters += count * 1.5;
  }
  
  // Check for universal claims
  for (const claim of AI_PATTERNS.universal) {
    const count = countOccurrences(normalizedText, claim);
    scores.universal += count * 2.5;
  }
  
  // Check for common AI call-to-actions
  for (const cta of AI_PATTERNS.callToActions) {
    const count = countOccurrences(normalizedText, cta);
    scores.callToActions += count * 2;
  }
  
  // Additional structural checks
  
  // Check for list-like structure with 3 examples ("X, Y, and Z")
  const listPatternCount = (normalizedText.match(/\w+,\s+\w+,\s+and\s+\w+/g) || []).length;
  
  // Check for consistent paragraph length (AI often creates very uniform paragraphs)
  const paragraphs = normalizedText.split(/\n\n+/);
  const paragraphLengths = paragraphs.map(p => p.trim().length);
  const avgLength = paragraphLengths.reduce((sum, len) => sum + len, 0) / paragraphLengths.length;
  
  let uniformityScore = 0;
  if (paragraphs.length >= 3) {
    // Calculate standard deviation of paragraph lengths
    const variance = paragraphLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / paragraphLengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation means more uniform paragraph lengths (AI-like)
    // Normalize to a 0-10 scale (inverted, where 10 means highly uniform)
    const normalizedStdDev = Math.min(stdDev / 100, 1);
    uniformityScore = 10 * (1 - normalizedStdDev);
  }
  
  // Calculate composite score normalized by word count
  // Each word count divisor is tuned to create reasonable thresholds
  const rawScore = 
    (scores.transitions / (wordCount / 100)) * 10 +
    (scores.hedging / (wordCount / 200)) * 12 +
    (scores.formality / (wordCount / 300)) * 15 +
    (scores.balanced / (wordCount / 400)) * 20 +
    (scores.unnatural / (wordCount / 100)) * 15 +
    (scores.templates / (wordCount / 300)) * 20 +
    (scores.starters / (wordCount / 200)) * 12 +
    (scores.universal / (wordCount / 400)) * 18 +
    (scores.callToActions / (wordCount / 300)) * 15 +
    (listPatternCount / (wordCount / 500)) * 15 +
    uniformityScore;
  
  // Normalize to 0-100 scale with diminishing returns for very high scores
  const normalizedScore = Math.min(100, Math.floor(100 * (1 - Math.exp(-rawScore / 40))));
  
  return normalizedScore;
}

/**
 * Count occurrences of a phrase in text
 * 
 * @param {string} text - Text to search in
 * @param {string} phrase - Phrase to find
 * @returns {number} - Number of occurrences
 */
function countOccurrences(text, phrase) {
  // For single words, look for word boundaries
  if (!phrase.includes(' ')) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }
  
  // For phrases, use indexOf with a sliding window
  let count = 0;
  let position = text.indexOf(phrase);
  
  while (position !== -1) {
    count++;
    position = text.indexOf(phrase, position + 1);
  }
  
  return count;
}