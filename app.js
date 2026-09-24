"use strict";

/* =====================================================
   MY MONEY APP
   FIXED VERSION
   ===================================================== */

const TRANSACTIONS_KEY = "myMoneyTransactions";
const LANGUAGE_KEY = "myMoneyLanguage";
const PENDING_PAYMENT_KEY = "myMoneyPendingPayment";

let transactions = [];
let currentLanguage =
  localStorage.getItem(LANGUAGE_KEY) || "en";

let qrScanner = null;
let scannerRunning = false;
let deferredPrompt = null;


/* =====================================================
   CATEGORIES
   ===================================================== */

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Education",
  "Medical",
  "Groceries",
  "Recharge",
  "Other"
];

const categoryEmoji = {
  Food: "🍔",
  Travel: "🚗",
  Shopping: "🛍️",
  Bills: "💡",
  Education: "🎓",
  Medical: "🏥",
  Groceries: "🛒",
  Recharge: "📱",
  Other: "📦"
};


/* =====================================================
   PAGE LOAD
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

  loadTransactions();

  setupInstallPrompt();

  setupReportDate();

  migrateOldTransactions();

  renderAll();

  applyLanguage();

  checkPendingPayment();

});


/* =====================================================
   LOAD DATA
   ===================================================== */

function loadTransactions() {

  try {

    const saved =
      localStorage.getItem(TRANSACTIONS_KEY);

    if (saved) {

      const data = JSON.parse(saved);

      transactions =
        Array.isArray(data) ? data : [];

    } else {

      transactions = [];

    }

  } catch (error) {

    console.error(error);

    transactions = [];

  }

}


/* =====================================================
   SAVE DATA
   ===================================================== */

function saveTransactions() {

  localStorage.setItem(
    TRANSACTIONS_KEY,
    JSON.stringify(transactions)
  );

}


/* =====================================================
   FIX OLD TRANSACTIONS
   ===================================================== */

function migrateOldTransactions() {

  let changed = false;

  transactions = transactions.map(function (t) {

    let dateObject;

    if (t.timestamp) {

      dateObject =
        new Date(t.timestamp);

    } else if (t.date) {

      dateObject =
        new Date(t.date);

    } else {

      dateObject =
        new Date();

    }


    if (!t.timestamp) {

      t.timestamp =
        dateObject.getTime();

      changed = true;

    }


    if (!t.date) {

      t.date =
        formatDate(dateObject);

      changed = true;

    }


    if (!t.time) {

      t.time =
        dateObject.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

      changed = true;

    }


    if (!t.day) {

      t.day =
        dateObject.toLocaleDateString(
          "en-IN",
          {
            weekday: "long"
          }
        );

      changed = true;

    }


    if (!t.month) {

      t.month =
        dateObject.toLocaleDateString(
          "en-IN",
          {
            month: "long"
          }
        );

      changed = true;

    }


    if (!t.year) {

      t.year =
        dateObject.getFullYear();

      changed = true;

    }


    if (!t.category) {

      t.category =
        t.type === "income"
          ? "Income"
          : "Other";

      changed = true;

    }


    if (!t.status) {

      t.status = "completed";

      changed = true;

    }


    return t;

  });


  if (changed) {

    saveTransactions();

  }

}


/* =====================================================
   DATE
   ===================================================== */

function formatDate(date) {

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const year =
    date.getFullYear();

  return (
    day +
    "/" +
    month +
    "/" +
    year
  );

}


/* =====================================================
   DATE INFO
   ===================================================== */

function getDateInfo() {

  const now = new Date();

  return {

    date:
      formatDate(now),

    time:
      now.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      ),

    day:
      now.toLocaleDateString(
        "en-IN",
        {
          weekday: "long"
        }
      ),

    month:
      now.toLocaleDateString(
        "en-IN",
        {
          month: "long"
        }
      ),

    year:
      now.getFullYear(),

    timestamp:
      now.getTime()

  };

}


/* =====================================================
   MONEY
   ===================================================== */

function formatMoney(amount) {

  return (
    "₹" +
    Number(amount || 0)
      .toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2
        }
      )
  );

}


/* =====================================================
   ADD INCOME
   ===================================================== */

function addIncome() {

  const amountInput =
    document.getElementById(
      "incomeAmount"
    );

  const typeInput =
    document.getElementById(
      "incomeType"
    );

  const noteInput =
    document.getElementById(
      "incomeNote"
    );


  if (!amountInput) {

    return;

  }


  const amount =
    Number(amountInput.value);


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "Please enter a valid income amount."
    );

    return;

  }


  const transaction = {

    id:
      "INC-" + Date.now(),

    type:
      "income",

    amount:
      amount,

    incomeType:
      typeInput
        ? typeInput.value
        : "Income",

    category:
      "Income",

    merchantName:
      "",

    upiId:
      "",

    note:
      noteInput
        ? noteInput.value.trim()
        : "",

    status:
      "completed",

    ...getDateInfo()

  };


  transactions.unshift(
    transaction
  );


  saveTransactions();

  amountInput.value = "";


  if (noteInput) {

    noteInput.value = "";

  }


  renderAll();

  alert(
    "Income added successfully."
  );

}


/* =====================================================
   MANUAL EXPENSE
   ===================================================== */

function addManualExpense() {

  const amountInput =
    document.getElementById(
      "manualExpenseAmount"
    );

  const categoryInput =
    document.getElementById(
      "manualExpenseCategory"
    );

  const noteInput =
    document.getElementById(
      "manualExpenseNote"
    );


  if (!amountInput) {

    return;

  }


  const amount =
    Number(amountInput.value);


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "Please enter a valid expense amount."
    );

    return;

  }


  const category =
    categoryInput
      ? categoryInput.value
      : "Other";


  const transaction = {

    id:
      "EXP-" + Date.now(),

    type:
      "expense",

    amount:
      amount,

    category:
      category,

    merchantName:
      "",

    upiId:
      "",

    note:
      noteInput
        ? noteInput.value.trim()
        : "",

    status:
      "completed",

    ...getDateInfo()

  };


  transactions.unshift(
    transaction
  );


  saveTransactions();

  amountInput.value = "";


  if (noteInput) {

    noteInput.value = "";

  }


  renderAll();

  alert(
    "Expense added successfully."
  );

}


/* =====================================================
   CATEGORY DETECTION
   ===================================================== */

function detectCategory(
  merchantName,
  upiId
) {

  const text =
    (
      (merchantName || "") +
      " " +
      (upiId || "")
    )
      .toLowerCase();


  if (
    /swiggy|zomato|restaurant|hotel|food|cafe|bakery|biryani|mess|tiffin|sweets/
      .test(text)
  ) {

    return "Food";

  }


  if (
    /uber|ola|rapido|cab|taxi|auto|fuel|petrol|diesel|transport|travels|bus|railway|irctc/
      .test(text)
  ) {

    return "Travel";

  }


  if (
    /amazon|flipkart|myntra|meesho|shopping|mall|store|fashion|clothing|garments|electronics/
      .test(text)
  ) {

    return "Shopping";

  }


  if (
    /electric|electricity|water|gas|bill|apcpdcl|discom|lpg/
      .test(text)
  ) {

    return "Bills";

  }


  if (
    /school|college|university|education|tuition|fees|academy|institute/
      .test(text)
  ) {

    return "Education";

  }


  if (
    /hospital|apollo|pharmacy|medical|clinic|diagnostic|medplus|netmeds|doctor|health/
      .test(text)
  ) {

    return "Medical";

  }


  if (
    /grocery|groceries|kirana|supermarket|dmart|reliance fresh|vegetable|fruits/
      .test(text)
  ) {

    return "Groceries";

  }


  if (
    /recharge|jio|airtel|vodafone|idea|bsnl|prepaid|postpaid/
      .test(text)
  ) {

    return "Recharge";

  }


  return "Other";

}


/* =====================================================
   TOTAL INCOME
   ===================================================== */

function getTotalIncome(list) {

  list =
    list || transactions;


  return list
    .filter(function (t) {

      return t.type === "income";

    })
    .reduce(function (total, t) {

      return (
        total +
        Number(t.amount || 0)
      );

    }, 0);

}


/* =====================================================
   TOTAL EXPENSE
   ===================================================== */

function getTotalExpense(list) {

  list =
    list || transactions;


  return list
    .filter(function (t) {

      return (
        t.type === "expense" &&
        t.status !== "pending"
      );

    })
    .reduce(function (total, t) {

      return (
        total +
        Number(t.amount || 0)
      );

    }, 0);

}


/* =====================================================
   DASHBOARD
   ===================================================== */

function updateDashboard() {

  const income =
    getTotalIncome();


  const expense =
    getTotalExpense();


  const balance =
    income - expense;


  const balanceElement =
    document.getElementById(
      "balance"
    );

  const incomeElement =
    document.getElementById(
      "totalIncome"
    );

  const expenseElement =
    document.getElementById(
      "totalExpense"
    );


  if (balanceElement) {

    balanceElement.textContent =
      formatMoney(balance);

  }


  if (incomeElement) {

    incomeElement.textContent =
      formatMoney(income);

  }


  if (expenseElement) {

    expenseElement.textContent =
      formatMoney(expense);

  }

}


/* =====================================================
   CATEGORY TOTALS
   ===================================================== */

function updateCategoryTotals() {

  const totals = {};


  categories.forEach(function (category) {

    totals[category] = 0;

  });


  transactions.forEach(function (t) {

    if (
      t.type !== "expense" ||
      t.status === "pending"
    ) {

      return;

    }


    const category =
      categories.includes(
        t.category
      )
        ? t.category
        : "Other";


    totals[category] +=
      Number(t.amount || 0);

  });


  categories.forEach(function (category) {

    const element =
      document.getElementById(
        "cat" + category
      );


    if (element) {

      element.textContent =
        formatMoney(
          totals[category]
        );

    }

  });

}


/* =====================================================
   REPORT FILTER
   Supports:
   All Time
   Today
   This Week
   This Month
   This Year
   Selected Date
   ===================================================== */

function getReportTransactions(type) {

  const now =
    new Date();


  if (
    type === "all" ||
    type === "all-time"
  ) {

    return transactions.slice();

  }


  if (
    type === "today" ||
    type === "date"
  ) {

    /*
      If report date input exists
      and has a selected date,
      use that date.
    */

    const dateInput =
      document.getElementById(
        "reportDate"
      );


    if (
      type === "date" &&
      dateInput &&
      dateInput.value
    ) {

      const selected =
        dateInput.value;


      return transactions.filter(
        function (t) {

          return normaliseStoredDate(
            t
          ) === selected;

        }
      );

    }


    return transactions.filter(
      function (t) {

        const d =
          getTransactionDate(t);


        return (
          d.getDate() ===
            now.getDate() &&

          d.getMonth() ===
            now.getMonth() &&

          d.getFullYear() ===
            now.getFullYear()
        );

      }
    );

  }


  if (
    type === "week" ||
    type === "weekly"
  ) {

    const currentDay =
      now.getDay();


    const difference =
      currentDay === 0
        ? -6
        : 1 - currentDay;


    const monday =
      new Date(now);


    monday.setDate(
      now.getDate() +
      difference
    );


    monday.setHours(
      0,
      0,
      0,
      0
    );


    const sunday =
      new Date(monday);


    sunday.setDate(
      monday.getDate() +
      6
    );


    sunday.setHours(
      23,
      59,
      59,
      999
    );


    return transactions.filter(
      function (t) {

        const d =
          getTransactionDate(t);


        return (
          d >= monday &&
          d <= sunday
        );

      }
    );

  }


  if (
    type === "month" ||
    type === "monthly"
  ) {

    return transactions.filter(
      function (t) {

        const d =
          getTransactionDate(t);


        return (
          d.getMonth() ===
            now.getMonth() &&

          d.getFullYear() ===
            now.getFullYear()
        );

      }
    );

  }


  if (
    type === "year" ||
    type === "yearly"
  ) {

    return transactions.filter(
      function (t) {

        const d =
          getTransactionDate(t);


        return (
          d.getFullYear() ===
          now.getFullYear()
        );

      }
    );

  }


  return transactions.slice();

}


/* =====================================================
   GET TRANSACTION DATE
   ===================================================== */

function getTransactionDate(t) {

  if (t.timestamp) {

    const d =
      new Date(
        Number(t.timestamp)
      );


    if (!isNaN(d.getTime())) {

      return d;

    }

  }


  if (t.date) {

    const parts =
      String(t.date).split("/");


    if (
      parts.length === 3
    ) {

      const day =
        Number(parts[0]);

      const month =
        Number(parts[1]) - 1;

      const year =
        Number(parts[2]);


      const d =
        new Date(
          year,
          month,
          day
        );


      if (!isNaN(d.getTime())) {

        return d;

      }

    }

  }


  return new Date();

}


/* =====================================================
   NORMALISE DATE
   ===================================================== */

function normaliseStoredDate(t) {

  const d =
    getTransactionDate(t);


  return (
    d.getFullYear() +
    "-" +
    String(
      d.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      d.getDate()
    ).padStart(2, "0")
  );

}


/* =====================================================
   REPORT
   ===================================================== */

function generateReport(type) {

  const list =
    getReportTransactions(
      type
    );


  const income =
    getTotalIncome(list);


  const expense =
    getTotalExpense(list);


  const balance =
    income - expense;


  const incomeElement =
    document.getElementById(
      "reportIncome"
    );

  const expenseElement =
    document.getElementById(
      "reportExpense"
    );

  const balanceElement =
    document.getElementById(
      "reportBalance"
    );

  const countElement =
    document.getElementById(
      "reportTransactions"
    );


  if (incomeElement) {

    incomeElement.textContent =
      formatMoney(income);

  }


  if (expenseElement) {

    expenseElement.textContent =
      formatMoney(expense);

  }


  if (balanceElement) {

    balanceElement.textContent =
      formatMoney(balance);

  }


  if (countElement) {

    countElement.textContent =
      list.length;

  }


  renderReportCategories(
    list
  );

}


/* =====================================================
   REPORT CATEGORY BREAKDOWN
   ===================================================== */

function renderReportCategories(
  list
) {

  const box =
    document.getElementById(
      "reportCategories"
    );


  if (!box) {

    return;

  }


  const totals = {};


  categories.forEach(function (c) {

    totals[c] = 0;

  });


  list.forEach(function (t) {

    if (
      t.type !== "expense" ||
      t.status === "pending"
    ) {

      return;

    }


    const category =
      categories.includes(
        t.category
      )
        ? t.category
        : "Other";


    totals[category] +=
      Number(t.amount || 0);

  });


  const active =
    categories.filter(
      function (c) {

        return totals[c] > 0;

      }
    );


  if (!active.length) {

    box.innerHTML = "";

    return;

  }


  box.innerHTML =
    active.map(function (category) {

      return `

        <div class="report-category-row">

          <span>
            ${categoryEmoji[category]}
            ${category}
          </span>

          <strong>
            ${formatMoney(
              totals[category]
            )}
          </strong>

        </div>

      `;

    }).join("");

}


/* =====================================================
   HISTORY
   ===================================================== */

function renderTransactionHistory() {

  const listElement =
    document.getElementById(
      "transactionList"
    );


  if (!listElement) {

    return;

  }


  if (!transactions.length) {

    listElement.innerHTML = `

      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <p>No transactions yet.</p>
      </div>

    `;

    return;

  }


  listElement.innerHTML =
    transactions.map(
      function (t) {

        return transactionHTML(t);

      }
    ).join("");

}


/* =====================================================
   TRANSACTION HTML
   ===================================================== */

function transactionHTML(t) {

  const income =
    t.type === "income";


  const title =
    income
      ? (
          t.incomeType ||
          "Income"
        )
      : (
          t.merchantName ||
          t.category ||
          "Expense"
        );


  const category =
    income
      ? "Income"
      : (
          t.category ||
          "Other"
        );


  const emoji =
    income
      ? "💰"
      : (
          categoryEmoji[category] ||
          "📦"
        );


  const dateText =
    getHistoryDateText(t);


  return `

    <div class="transaction-item">

      <div class="transaction-top">

        <div class="transaction-title">

          ${emoji}
          ${escapeHTML(title)}

        </div>

        <div
          class="transaction-amount ${
            income
              ? "income"
              : "expense"
          }"
        >

          ${
            income
              ? "+"
              : "-"
          }

          ${formatMoney(t.amount)}

        </div>

      </div>


      <div class="transaction-meta">

        <span class="transaction-tag">
          ${escapeHTML(category)}
        </span>

        ${
          t.upiId
            ? `
              <span class="transaction-tag">
                ${escapeHTML(t.upiId)}
              </span>
            `
            : ""
        }

      </div>


      ${
        t.note
          ? `
       
