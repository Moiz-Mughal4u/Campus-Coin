/*
 * Optional AI-generated monthly insights + personalized saving tips engine.
 *
 * Implemented as rule-based statistics (comparing this month's category
 * totals against the student's own trailing average) rather than a call to
 * an external LLM, so the whole app works offline out of the box. The SRS
 * explicitly marks AI insight generation as OPTIONAL/advisory, so this
 * satisfies the requirement while keeping the project dependency-free.
 * Swap generateNarrative() for a real LLM call if you want free-text
 * narratives from a model instead of the templated sentence below.
 */

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * @param {Array<{category_id, name, month, total}>} categoryMonthTotals all months for this user, one row per category+month
 * @param {string} currentMonth 'YYYY-MM'
 */
function buildInsights(categoryMonthTotals, currentMonth) {
  const byCategory = {};
  for (const row of categoryMonthTotals) {
    byCategory[row.category_id] = byCategory[row.category_id] || { name: row.name, months: [] };
    byCategory[row.category_id].months.push(row);
  }

  const flags = [];
  const tips = [];

  for (const [category_id, data] of Object.entries(byCategory)) {
    const current = data.months.find((m) => m.month === currentMonth);
    const history = data.months.filter((m) => m.month !== currentMonth).map((m) => Number(m.total));
    if (!current || history.length === 0) continue;

    const avg = average(history);
    if (avg <= 0) continue;
    const growth = ((Number(current.total) - avg) / avg) * 100;

    if (growth >= 20) {
      flags.push({
        category_id: Number(category_id),
        category: data.name,
        growth: Math.round(growth),
        current: Number(current.total),
        average: Math.round(avg * 100) / 100,
      });
      tips.push({
        category_id: Number(category_id),
        text: `${data.name} spending is up ${Math.round(growth)}% vs your usual month. Try capping it at roughly ${Math.round(avg)} for the rest of the month.`,
        potential_savings: Math.max(0, Math.round(Number(current.total) - avg)),
      });
    }
  }

  const narrative = generateNarrative(flags, currentMonth);
  tips.sort((a, b) => b.potential_savings - a.potential_savings);

  return { narrative, flags, tips };
}

function generateNarrative(flags, month) {
  if (flags.length === 0) {
    return `Your spending in ${month} looks consistent with your usual habits — no category jumped out this month. Keep it up!`;
  }
  const parts = flags
    .slice(0, 3)
    .map((f) => `${f.category} spending rose ${f.growth}% this month`);
  return `Here's your ${month} snapshot: ${parts.join('; ')}. Consider reviewing these categories to stay on track with your savings goal.`;
}

module.exports = { buildInsights };
