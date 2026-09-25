/*
 * Optional AI-driven expense categorization assistant.
 *
 * This is implemented as a lightweight keyword-matching heuristic so the
 * project runs fully offline with zero API keys. It fulfils the SRS
 * requirement ("suggest a category automatically as the student types a
 * description") without depending on an external AI service.
 *
 * To upgrade this to a real AI/ML suggestion (as the SRS allows as
 * "optional"), replace the body of suggestCategory() with a call to an
 * LLM/NLP API (e.g. the Anthropic API) and keep the same return shape.
 */

const KEYWORD_MAP = [
  { category: 'Food', keywords: ['cafe', 'canteen', 'restaurant', 'food', 'pizza', 'burger', 'coffee', 'tea', 'lunch', 'dinner', 'breakfast', 'snack', 'delivery', 'mess'] },
  { category: 'Transport', keywords: ['uber', 'careem', 'bus', 'fuel', 'petrol', 'taxi', 'rickshaw', 'fare', 'metro', 'train'] },
  { category: 'Hostel/Rent', keywords: ['rent', 'hostel', 'dorm', 'room', 'utility', 'electricity bill'] },
  { category: 'Academics', keywords: ['book', 'tuition', 'stationery', 'course', 'exam fee', 'printout', 'library'] },
  { category: 'Subscriptions', keywords: ['netflix', 'spotify', 'subscription', 'prime', 'youtube premium', 'app store', 'icloud'] },
  { category: 'Entertainment', keywords: ['movie', 'cinema', 'concert', 'game', 'outing', 'party', 'trip'] },
];

/**
 * @param {string} description free-text entered by the student
 * @param {Array<{category_id:number,name:string,type:string}>} categories user's available expense categories
 * @param {Array<{description:string, category_id:number}>} pastCorrections previously confirmed transactions, used to "learn" from the student's own corrections
 */
function suggestCategory(description, categories, pastCorrections = []) {
  if (!description) return null;
  const text = description.toLowerCase();

  // 1) Learn from the student's own history first: if they previously
  //    categorized a very similar description, reuse that choice.
  const match = pastCorrections.find(
    (t) => t.description && text.includes(t.description.toLowerCase().slice(0, 6))
  );
  if (match) {
    const cat = categories.find((c) => c.category_id === match.category_id);
    if (cat) return { category_id: cat.category_id, name: cat.name, confidence: 'high', source: 'history' };
  }

  // 2) Fall back to keyword heuristics.
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      const cat = categories.find((c) => c.name.toLowerCase() === entry.category.toLowerCase());
      if (cat) return { category_id: cat.category_id, name: cat.name, confidence: 'medium', source: 'keyword' };
    }
  }

  return null; // no confident suggestion; UI should let the student pick manually
}

module.exports = { suggestCategory };
