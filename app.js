/* =====================================================
   MY MONEY - INCOME & EXPENSES
   COMPLETE APP JAVASCRIPT
   ===================================================== */

"use strict";

/* =====================================================
   STORAGE KEYS
   ===================================================== */

const TRANSACTIONS_KEY = "myMoneyTransactions";
const LANGUAGE_KEY = "myMoneyLanguage";
const PENDING_PAYMENT_KEY = "myMoneyPendingPayment";


/* =====================================================
   GLOBAL VARIABLES
   ===================================================== */

let transactions = [];

let currentLanguage =
  localStorage.getItem(LANGUAGE_KEY) || "en";

let qrScanner = null;
let scannerRunning = false;

let deferredPrompt = null;

let currentReportType = "date";


/* =====================================================
   CATEGORY LIST
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


/* =====================================================
   CATEGORY EMOJIS
   ===================================================== */

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
   LANGUAGE TEXT
   ===================================================== */

const translations = {

  en: {

    headerSubtitle: "Income & Expenses",

    balanceLabel: "Current Balance",

    incomeLabel: "Total Income",

    expenseLabel: "Total Expenses"

  },

  te: {

    headerSubtitle: "ఆదాయం & ఖర్చులు",

    balanceLabel: "ప్రస్తుత బ్యాలెన్స్",

    incomeLabel: "మొత్తం ఆదాయం",

    expenseLabel: "మొత్తం ఖర్చులు"

  }

};


/* =====================================================
   PAGE LOAD
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    loadTransactions();

    setupDateInput();

    setupInstallPrompt();

    renderAll();

    applyLanguage();

    checkPendingPayment();

    setupReportDateListener();

  }
);


/* =====================================================
   LOAD TRANSACTIONS
   ===================================================== */

function loadTransactions() {

  try {

    const saved =
      localStorage.getItem(
        TRANSACTIONS_KEY
      );

    if (saved) {

      const parsed =
        JSON.parse(saved);

      if (Array.isArray(parsed)) {

        transactions = parsed;

      } else {

        transactions = [];

      }

    } else {

      transactions = [];

    }

  } catch (error) {

    console.error(
      "Unable to load transactions:",
      error
    );

    transactions = [];

  }

}


/* =====================================================
   SAVE TRANSACTIONS
   ===================================================== */

function saveTransactions() {

  localStorage.setItem(
    TRANSACTIONS_KEY,
    JSON.stringify(transactions)
  );

}


/* =====================================================
   DATE / TIME INFORMATION
   ===================================================== */

function getDateInfo() {

  const now = new Date();

  const date =
    now.toISOString().split("T")[0];

  const time =
    now.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  const day =
    now.toLocaleDateString(
      "en-IN",
      {
        weekday: "long"
      }
    );

  const month =
    now.toLocaleDateString(
      "en-IN",
      {
        month: "long"
      }
    );

  const year =
    now.getFullYear();

  return {

    date: date,

    time: time,

    day: day,

    month: month,

    year: year,

    timestamp: now.getTime()

  };

}


/* =====================================================
   FORMAT MONEY
   ===================================================== */

function formatMoney(amount) {

  const number =
    Number(amount) || 0;

  return (
    "₹" +
    number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
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

  const amount =
    Number(amountInput.value);

  const type =
    typeInput.value;

  const note =
    noteInput.value.trim();


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "Please enter a valid income amount."
    );

    amountInput.focus();

    return;

  }


  const dateInfo =
    getDateInfo();


  const transaction = {

    id:
      "INC-" +
      Date.now(),

    type: "income",

    amount: amount,

    incomeType: type,

    category: "Income",

    merchantName: "",

    upiId: "",

    note: note,

    status: "completed",

    ...dateInfo

  };


  transactions.unshift(
    transaction
  );

  saveTransactions();

  amountInput.value = "";

  noteInput.value = "";

  renderAll();

  alert(
    "Income added successfully."
  );

}


/* =====================================================
   ADD MANUAL EXPENSE
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

  const amount =
    Number(amountInput.value);

  const category =
    categoryInput.value;

  const note =
    noteInput.value.trim();


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "Please enter a valid expense amount."
    );

    amountInput.focus();

    return;

  }


  const dateInfo =
    getDateInfo();


  const transaction = {

    id:
      "EXP-" +
      Date.now(),

    type: "expense",

    amount: amount,

    category: category,

    merchantName: "",

    upiId: "",

    note: note,

    status: "completed",

    ...dateInfo

  };


  transactions.unshift(
    transaction
  );

  saveTransactions();

  amountInput.value = "";

  noteInput.value = "";

  renderAll();

  alert(
    "Expense added successfully."
  );

}


/* =====================================================
   AUTOMATIC CATEGORY DETECTION
   ===================================================== */

function detectCategory(
  merchantName,
  upiId
) {

  const text =
    (
      String(merchantName || "") +
      " " +
      String(upiId || "")
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9@.\s]/g,
        " "
      );


  /* FOOD */

  if (
    /swiggy|zomato|restaurant|hotel|food|cafe|coffee|bakery|biryani|mess|dhaba|tiffin|sweets/.test(
      text
    )
  ) {

    return "Food";

  }


  /* TRAVEL */

  if (
    /uber|ola|rapido|cab|taxi|auto|fuel|petrol|diesel|transport|travels|bus|railway|irctc/.test(
      text
    )
  ) {

    return "Travel";

  }


  /* SHOPPING */

  if (
    /amazon|flipkart|myntra|meesho|shopping|mall|store|fashion|clothing|clothes|garments|electronics/.test(
      text
    )
  ) {

    return "Shopping";

  }


  /* BILLS */

  if (
    /electric|electricity|water|gas|bill|bescom|tsnpdcl|apcpdcl|tsspdcl|discom|lpg/.test(
      text
    )
  ) {

    return "Bills";

  }


  /* EDUCATION */

  if (
    /school|college|university|education|tuition|fees|academy|institute|education/.test(
      text
    )
  ) {

    return "Education";

  }


  /* MEDICAL */

  if (
    /hospital|apollo|pharmacy|medical|clinic|diagnostic|medplus|netmeds|doctor|health/.test(
      text
    )
  ) {

    return "Medical";

  }


  /* GROCERIES */

  if (
    /grocery|groceries|kirana|supermarket|dmart|d mart|reliance fresh|vegetables|vegetable|fruits|fresh/.test(
      text
    )
  ) {

    return "Groceries";

  }


  /* RECHARGE */

  if (
    /recharge|jio|airtel|vi |vodafone|idea|bsnl|mobile recharge|prepaid|postpaid/.test(
      text
    )
  ) {

    return "Recharge";

  }


  return "Other";

}


/* =====================================================
   START QR SCANNER
   ===================================================== */

async function startQRScanner() {

  if (scannerRunning) {

    return;

  }


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    alert(
      "QR scanner is still loading. Please wait a few seconds and try again."
    );

    return;

  }


  const reader =
    document.getElementById(
      "qr-reader"
    );


  reader.classList.remove(
    "hidden"
  );


  document
    .getElementById(
      "startScannerBtn"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "stopScannerBtn"
    )
    .classList.remove(
      "hidden"
    );


  try {

    qrScanner =
      new Html5Qrcode(
        "qr-reader"
      );


    await qrScanner.start(

      {
        facingMode: "environment"
      },

      {
        fps: 10,

        qrbox: {
          width: 250,
          height: 250
        }

      },

      function (decodedText) {

        handleQRResult(
          decodedText
        );

      },

      function () {

        /* QR not detected yet */

      }

    );


    scannerRunning = true;

  } catch (error) {

    console.error(
      "QR scanner error:",
      error
    );

    alert(
      "Camera open avvaledu. Camera permission allow cheyyandi."
    );

    resetScannerUI();

  }

}


/* =====================================================
   STOP QR SCANNER
   ===================================================== */

async function stopQRScanner() {

  if (
    qrScanner &&
    scannerRunning
  ) {

    try {

      await qrScanner.stop();

      await qrScanner.clear();

    } catch (error) {

      console.log(
        "Scanner stop:",
        error
      );

    }

  }


  qrScanner = null;

  scannerRunning = false;

  resetScannerUI();

}


/* =====================================================
   RESET SCANNER UI
   ===================================================== */

function resetScannerUI() {

  document
    .getElementById(
      "startScannerBtn"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "stopScannerBtn"
    )
    .classList.add(
      "hidden"
    );

}


/* =====================================================
   HANDLE QR RESULT
   ===================================================== */

async function handleQRResult(
  decodedText
) {

  console.log(
    "QR:",
    decodedText
  );


  await stopQRScanner();


  const paymentData =
    parseUPIQR(
      decodedText
    );


  if (!paymentData) {

    alert(
      "This QR is not a supported UPI payment QR."
    );

    return;

  }


  document
    .getElementById(
      "shopDetails"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "paymentForm"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "shopName"
    )
    .textContent =
      paymentData.name ||
      "Unknown Shop";


  document
    .getElementById(
      "shopUpi"
    )
    .textContent =
      paymentData.upiId ||
      "-";


  const category =
    detectCategory(
      paymentData.name,
      paymentData.upiId
    );


  document
    .getElementById(
      "detectedCategory"
    )
    .textContent =
      categoryEmoji[category] +
      " " +
      category;


  const categorySelect =
    document.getElementById(
      "expenseCategory"
    );


  categorySelect.value =
    "Auto";


  categorySelect.dataset.detected =
    category;


  const amountInput =
    document.getElementById(
      "expenseAmount"
    );


  if (
    paymentData.amount &&
    Number(paymentData.amount) > 0
  ) {

    amountInput.value =
      paymentData.amount;

  }


  window.currentShopPayment = {

    name:
      paymentData.name || "",

    upiId:
      paymentData.upiId || "",

    amount:
      paymentData.amount || "",

    category:
      category

  };

}


/* =====================================================
   PARSE UPI QR
   ===================================================== */

function parseUPIQR(
  qrText
) {

  try {

    if (
      !qrText ||
      !qrText.toLowerCase().startsWith(
        "upi://pay"
      )
    ) {

      return null;

    }


    const url =
      new URL(qrText);


    const params =
      url.searchParams;


    const upiId =
      params.get("pa") || "";


    const name =
      params.get("pn") || "";


    const amount =
      params.get("am") || "";


    if (!upiId) {

      return null;

    }


    return {

      upiId:
        decodeURIComponent(
          upiId
        ),

      name:
        safeDecode(
          name
        ),

      amount:
        amount

    };

  } catch (error) {

    console.error(
      "UPI QR parse error:",
      error
    );


    return null;

  }

}


/* =====================================================
   SAFE DECODE
   ===================================================== */

function safeDecode(value) {

  try {

    return decodeURIComponent(
      value || ""
    );

  } catch {

    return value || "";

  }

}


/* =====================================================
   GET SELECTED CATEGORY
   ===================================================== */

function getSelectedExpenseCategory() {

  const select =
    document.getElementById(
      "expenseCategory"
    );


  if (
    select.value === "Auto"
  ) {

    return (
      select.dataset.detected ||
      "Other"
    );

  }


  return select.value;

}


/* =====================================================
   PAY BY UPI
   ===================================================== */

function payByUPI(app) {

  const shop =
    window.currentShopPayment;


  if (
    !shop ||
    !shop.upiId
  ) {

    alert(
      "First scan the shop UPI QR."
    );

    return;

  }


  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value
    );


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "Please enter a valid amount."
    );

    return;

  }


  const category =
    getSelectedExpenseCategory();


  const note =
    document
      .getElementById(
        "paymentNote"
      )
      .value
      .trim();


  const params =
    new URLSearchParams();


  params.set(
    "pa",
    shop.upiId
  );


  params.set(
    "pn",
    shop.name ||
      "Merchant"
  );


  params.set(
    "am",
    amount.toFixed(2)
  );


  params.set(
    "cu",
    "INR"
  );


  if (note) {

    params.set(
      "tn",
      note
    );

  }


  const upiUrl =
    "upi://pay?" +
    params.toString();


  /*
    Payment is NOT immediately added
    to final expenses.

    It is stored as PENDING first.
    When the user comes back to the app,
    the app asks whether payment succeeded.
  */

  const pendingPayment = {

    id:
      "PENDING-" +
      Date.now(),

    type: "expense",

    amount:
      amount,

    category:
      category,

    merchantName:
      shop.name || "Merchant",

    upiId:
      shop.upiId,

    note:
      note,

    app:
      app,

    status:
      "pending",

    createdAt:
      Date.now(),

    ...getDateInfo()

  };


  localStorage.setItem(
    PENDING_PAYMENT_KEY,
    JSON.stringify(
      pendingPayment
    )
  );


  alert(
    "Payment app open avutundi. Payment complete chesi My Money app ki return avvandi."
  );


  /*
    Android will choose the available
    UPI application.
  */

  window.location.href =
    upiUrl;

}


/* =====================================================
   CHECK PENDING PAYMENT
   ===================================================== */

function checkPendingPayment() {

  const saved =
    localStorage.getItem(
      PENDING_PAYMENT_KEY
    );


  if (!saved) {

    return;

  }


  let pending;


  try {

    pending =
      JSON.parse(
        saved
      );

  } catch {

    localStorage.removeItem(
      PENDING_PAYMENT_KEY
    );

    return;

  }


  if (!pending) {

    return;

  }


  setTimeout(
    function () {

      const confirmPayment =
        confirm(
          "Payment complete ayyinda?\n\n" +
          pending.merchantName +
          "\n" +
          formatMoney(
            pending.amount
          )
        );


      if (
        confirmPayment
      ) {

        pending.status =
          "completed";


        pending.id =
          "EXP-" +
          Date.now();


        delete pending.createdAt;


        transactions.unshift(
          pending
        );


        saveTransactions();


        localStorage.removeItem(
          PENDING_PAYMENT_KEY
        );


        renderAll();


        alert(
          "Expense saved successfully."
        );

      } else {

        const keepPending =
          confirm(
            "Payment complete kaaledha?\n\n" +
            "Later verify cheyyadaniki pending payment ni keep cheyyala?"
          );


        if (!keepPending) {

          localStorage.removeItem(
            PENDING_PAYMENT_KEY
          );

        }

      }

    },
    1200
  );

}


/* =====================================================
   SAVE SHOP EXPENSE WITHOUT PAYMENT
   ===================================================== */

function saveShopExpenseWithoutPayment() {

  const shop =
    window.currentShopPayment;


  if (
    !shop ||
    !shop.upiId
  ) {

    alert(
      "First scan shop QR."
    );

    return;

  }


  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value
    );


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "Please enter a valid amount."
    );

    return;

  }


  const category =
    getSelectedExpenseCategory();


  const note =
    document
      .getElementById(
        "paymentNote"
      )
      .value
      .trim();


  const transaction = {

    id:
      "EXP-" +
      Date.now(),

    type:
      "expense",

    amount:
      amount,

    category:
      category,

    merchantName:
      shop.name || "Merchant",

    upiId:
      shop.upiId,

    note:
      note,

    status:
      "completed",

    ...getDateInfo()

  };


  transactions.unshift(
    transaction
  );


  saveTransactions();

  clearShopPaymentForm();

  renderAll();


  alert(
    "Expense saved."
  );

}


/* =====================================================
   CLEAR SHOP PAYMENT FORM
   ===================================================== */

function clearShopPaymentForm() {

  document
    .getElementById(
      "shopDetails"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "paymentForm"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "expenseAmount"
    )
    .value = "";


  document
    .getElementById(
      "paymentNote"
    )
    .value = "";


  window.currentShopPayment =
    null;

}


/* =====================================================
   CALCULATE TOTAL INCOME
   ===================================================== */

function getTotalIncome(
  list = transactions
) {

  return list
    .filter(
      transaction =>
        transaction.type ===
        "income"
    )
    .reduce(
      (total, transaction) =>
        total +
        Number(
          transaction.amount
        ),
      0
    );

}


/* =====================================================
   CALCULATE TOTAL EXPENSE
   ===================================================== */

function getTotalExpense(
  list = transactions
) {

    
