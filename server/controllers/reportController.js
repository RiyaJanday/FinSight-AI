import Transaction from "../models/Transaction.js";
import Budget      from "../models/Budget.js";
import Goal        from "../models/Goal.js";
import PDFDocument from "pdfkit";

export const generateReport = async (req, res) => {
  try {
    const { month } = req.query;
    const now       = new Date();
    const [year, mon] = month
      ? month.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    const startDate = new Date(year, mon - 1, 1);
    const endDate   = new Date(year, mon, 0, 23, 59, 59);
    const monthLabel = startDate.toLocaleString("default", { month: "long", year: "numeric" });

    // Fetch data
    const transactions = await Transaction.find({
      userId: req.user._id,
      date:   { $gte: startDate, $lte: endDate },
    }).sort("date");

    const budgets = await Budget.find({
      userId: req.user._id,
      month:  `${year}-${String(mon).padStart(2, "0")}`,
    });

    const goals = await Goal.find({ userId: req.user._id });

    // Calculate stats
    const income   = transactions.filter(t => t.type === "income") .reduce((s, t) => s + t.amount, 0);
    const expense  = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    const savings  = income - expense;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

    // Category breakdown
    const categoryMap = {};
    transactions.filter(t => t.type === "expense").forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });

    // Build PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=FinSight-Report-${year}-${mon}.pdf`);
    doc.pipe(res);

    // ── Header ────────────────────────────────────────────────
    doc.rect(0, 0, 612, 80).fill("#1d4ed8");
    doc.fillColor("#ffffff")
       .fontSize(22).font("Helvetica-Bold")
       .text("FinSight AI", 50, 20);
    doc.fontSize(12).font("Helvetica")
       .text(`Financial Report — ${monthLabel}`, 50, 48);

    doc.fillColor("#000000").moveDown(3);

    // ── Summary Section ───────────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold")
       .fillColor("#1d4ed8")
       .text("Financial Summary", 50, 100);

    doc.moveTo(50, 118).lineTo(562, 118).strokeColor("#e2e8f0").stroke();

    const summaryY = 128;
    const cols     = [50, 170, 330, 450];

    doc.fontSize(9).font("Helvetica").fillColor("#64748b");
    doc.text("TOTAL INCOME",   cols[0], summaryY);
    doc.text("TOTAL EXPENSES", cols[1], summaryY);
    doc.text("NET SAVINGS",    cols[2], summaryY);
    doc.text("SAVINGS RATE",   cols[3], summaryY);

    doc.fontSize(13).font("Helvetica-Bold").fillColor("#0f172a");
    doc.text(`₹${income.toLocaleString("en-IN")}`,   cols[0], summaryY + 16);
    doc.text(`₹${expense.toLocaleString("en-IN")}`,  cols[1], summaryY + 16);
    doc.text(`₹${savings.toLocaleString("en-IN")}`,  cols[2], summaryY + 16, {
      color: savings >= 0 ? "#16a34a" : "#ef4444"
    });
    doc.fillColor(savings >= 0 ? "#16a34a" : "#ef4444")
       .text(`${savingsRate}%`, cols[3], summaryY + 16);

    // ── Category Breakdown ────────────────────────────────────
    doc.fillColor("#1d4ed8").fontSize(14).font("Helvetica-Bold")
       .text("Spending by Category", 50, summaryY + 60);
    doc.moveTo(50, summaryY + 78).lineTo(562, summaryY + 78).strokeColor("#e2e8f0").stroke();

    let catY = summaryY + 90;
    Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, amount]) => {
        const pct  = expense > 0 ? Math.round((amount / expense) * 100) : 0;
        const barW = Math.round((amount / expense) * 300);

        doc.fillColor("#0f172a").fontSize(10).font("Helvetica")
           .text(cat, 50, catY);
        doc.fillColor("#64748b").fontSize(10)
           .text(`₹${amount.toLocaleString("en-IN")} (${pct}%)`, 380, catY);

        // Progress bar background
        doc.rect(50, catY + 14, 300, 6).fillColor("#f1f5f9").fill();
        // Progress bar fill
        doc.rect(50, catY + 14, barW, 6).fillColor("#3b82f6").fill();

        catY += 36;
      });

    // ── Budget Summary ────────────────────────────────────────
    if (budgets.length > 0) {
      catY += 10;
      doc.fillColor("#1d4ed8").fontSize(14).font("Helvetica-Bold")
         .text("Budget Overview", 50, catY);
      doc.moveTo(50, catY + 18).lineTo(562, catY + 18).strokeColor("#e2e8f0").stroke();

      catY += 30;
      budgets.forEach((b) => {
        const spent   = categoryMap[b.category] || 0;
        const pct     = Math.round((spent / b.limit) * 100);
        const isOver  = spent > b.limit;

        doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold")
           .text(b.category, 50, catY);
        doc.font("Helvetica").fillColor(isOver ? "#ef4444" : "#64748b")
           .text(`₹${spent.toLocaleString("en-IN")} / ₹${b.limit.toLocaleString("en-IN")} (${pct}%)`, 280, catY);

        catY += 20;
      });
    }

    // ── Goals Summary ─────────────────────────────────────────
    if (goals.length > 0) {
      catY += 20;
      doc.fillColor("#1d4ed8").fontSize(14).font("Helvetica-Bold")
         .text("Savings Goals", 50, catY);
      doc.moveTo(50, catY + 18).lineTo(562, catY + 18).strokeColor("#e2e8f0").stroke();

      catY += 30;
      goals.forEach((g) => {
        const pct = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
        doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold")
           .text(g.title, 50, catY);
        doc.font("Helvetica").fillColor("#64748b")
           .text(`₹${g.savedAmount.toLocaleString("en-IN")} / ₹${g.targetAmount.toLocaleString("en-IN")} — ${pct}%`, 250, catY);

        catY += 20;
      });
    }

    // ── Transactions Table ────────────────────────────────────
    catY += 20;
    if (catY > 650) { doc.addPage(); catY = 50; }

    doc.fillColor("#1d4ed8").fontSize(14).font("Helvetica-Bold")
       .text("Transaction Details", 50, catY);
    doc.moveTo(50, catY + 18).lineTo(562, catY + 18).strokeColor("#e2e8f0").stroke();

    catY += 30;

    // Table header
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b");
    doc.text("DATE",     50,  catY);
    doc.text("MERCHANT", 130, catY);
    doc.text("CATEGORY", 310, catY);
    doc.text("TYPE",     420, catY);
    doc.text("AMOUNT",   490, catY);
    catY += 16;

    doc.moveTo(50, catY).lineTo(562, catY).strokeColor("#e2e8f0").stroke();
    catY += 8;

    transactions.forEach((tx) => {
      if (catY > 750) { doc.addPage(); catY = 50; }

      const dateStr = new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const amtStr  = `${tx.type === "expense" ? "-" : "+"}₹${Math.abs(tx.amount).toLocaleString("en-IN")}`;

      doc.fontSize(9).font("Helvetica").fillColor("#0f172a");
      doc.text(dateStr,                           50,  catY, { width: 70 });
      doc.text(tx.merchant,                       130, catY, { width: 170 });
      doc.text(tx.category,                       310, catY, { width: 100 });
      doc.text(tx.type,                           420, catY, { width: 60 });
      doc.fillColor(tx.type === "expense" ? "#ef4444" : "#16a34a")
         .text(amtStr,                            490, catY, { width: 70 });

      catY += 18;
    });

    // ── Footer ────────────────────────────────────────────────
    doc.fontSize(8).fillColor("#94a3b8").font("Helvetica")
       .text(`Generated by FinSight AI on ${new Date().toLocaleDateString("en-IN")}`, 50, 800, { align: "center" });

    doc.end();
  } catch (err) {
    console.error("Report generation error:", err.message);
    res.status(500).json({ message: "Failed to generate report" });
  }
};