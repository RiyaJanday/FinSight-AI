import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Generate spending insights ────────────────────────────────
export const generateInsights = async (financialData) => {
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    spendingByCategory,
    recentTransactions,
  } = financialData;

  const prompt = `
You are a personal finance advisor. Analyze this user's financial data and provide exactly 4 actionable insights in JSON format.

Financial Data:
- Total Balance: ₹${totalBalance?.toLocaleString("en-IN") || 0}
- Monthly Income: ₹${monthlyIncome?.toLocaleString("en-IN") || 0}
- Monthly Expenses: ₹${monthlyExpenses?.toLocaleString("en-IN") || 0}
- Savings Rate: ${savingsRate || 0}%
- Spending by Category: ${JSON.stringify(spendingByCategory || [])}
- Recent Transactions: ${JSON.stringify((recentTransactions || []).slice(0, 5))}

Return ONLY a valid JSON array with exactly 4 objects. Each object must have:
{
  "type": "warning" | "success" | "info" | "tip",
  "title": "Short title (max 5 words)",
  "description": "Actionable insight (max 2 sentences)",
  "priority": "high" | "medium" | "low"
}

Focus on: overspending alerts, savings opportunities, unusual patterns, and financial tips.
Return ONLY the JSON array, no other text.
`;

  const response = await client.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 1000,
    messages:   [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();
  const json = JSON.parse(text.replace(/```json|```/g, "").trim());
  return json;
};

// ── Generate spending forecast ────────────────────────────────
export const generateForecast = async (transactions) => {
  const prompt = `
You are a financial analyst. Based on these recent transactions, predict next month's spending by category.

Transactions (last 30 days): ${JSON.stringify(transactions.slice(0, 20))}

Return ONLY a valid JSON object:
{
  "forecast": [
    { "category": "category name", "predicted": number, "trend": "up" | "down" | "stable" }
  ],
  "totalPredicted": number,
  "summary": "One sentence overall forecast"
}

Return ONLY the JSON, no other text.
`;

  const response = await client.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 800,
    messages:   [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text.replace(/```json|```/g, "").trim());
};

// ── Categorize a transaction ──────────────────────────────────
export const categorizeTransaction = async (merchant) => {
  const prompt = `
Categorize this merchant/transaction into one of these categories:
Food & Dining, Transportation, Shopping, Entertainment, Utilities, Health, Income, Others

Merchant: "${merchant}"

Return ONLY the category name, nothing else.
`;

  const response = await client.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 20,
    messages:   [{ role: "user", content: prompt }],
  });

  return response.content[0].text.trim();
};