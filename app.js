let transactions =
  JSON.parse(localStorage.getItem("transactions") || "[]");

let currentQR = null;
let scanner = null;


/* =========================
   SAVE
========================= */

function saveData(){

  localStorage.setItem(
    "transactions",
    JSON.stringify(transactions)
  );

}


/* =========================
   DATE / TIME
========================= */

function getDateInfo(){

  const d = new Date();

  return {

    date:d.toLocaleDateString("en-IN"),

    time:d.toLocaleTimeString("en-IN",{
      hour:"2-digit",
      minute:"2-digit"
    }),

    day:d.toLocaleDateString("en-IN",{
      weekday:"long"
    }),

    month:d.toLocaleDateString("en-IN",{
      month:"long"
    }),

    year:d.getFullYear(),

    timestamp:d.getTime()

  };

}


/* =========================
   ADD INCOME
========================= */

function addIncome(){

  const amount =
    Number(document.getElementById("incomeAmount").value);

  const type =
    document.getElementById("incomeType").value;

  const note =
    document.getElementById("incomeNote").value.trim();

  if(!amount || amount <= 0){

    alert("Enter valid amount");

    return;

  }

  const d = getDateInfo();

  transactions.unshift({

    id:Date.now(),

    type:"income",

    incomeMode:type,

    category:"Income",

    amount:amount,

    note:note || "Income",

    date:d.date,

    time:d.time,

    day:d.day,

    month:d.month,

    year:d.year,

    timestamp:d.timestamp

  });

  saveData();

  document.getElementById("incomeAmount").value="";
  document.getElementById("incomeNote").value="";

  updateAll();

}


/* =========================
   MANUAL EXPENSE
========================= */

function addManualExpense(){

  const amount =
    Number(
      document.getElementById(
        "manualExpenseAmount"
      ).value
    );

  const category =
    document.getElementById(
      "manualCategory"
    ).value;

  const note =
    document.getElementById(
      "manualExpenseNote"
    ).value.trim();

  if(!amount || amount <= 0){

    alert("Enter valid amount");

    return;

  }

  addExpense(

    amount,

    category,

    note || category,

    "Manual"

  );

}


/* =========================
   ADD EXPENSE
========================= */

function addExpense(
  amount,
  category,
  note,
  paymentMode
){

  const d = getDateInfo();

  transactions.unshift({

    id:Date.now(),

    type:"expense",

    paymentMode:paymentMode,

    category:category,

    amount:amount,

    note:note,

    date:d.date,

    time:d.time,

    day:d.day,

    month:d.month,

    year:d.year,

    timestamp:d.timestamp

  });

  saveData();

  document.getElementById(
    "manualExpenseAmount"
  ).value="";

  document.getElementById(
    "manualExpenseNote"
  ).value="";

  updateAll();

}


/* =========================
   START QR SCANNER
========================= */

function startScanner(){

  document.getElementById("reader").innerHTML="";

  scanner =
    new Html5Qrcode("reader");

  scanner.start(

    {
      facingMode:"environment"
    },

    {
      fps:10,

      qrbox:{
        width:250,
        height:250
      }

    },

    function(decodedText){

      readShopQR(decodedText);

    },

    function(){

      /* scanning */
    }

  ).catch(function(){

    alert(
      "Camera permission allow cheyyandi."
    );

  });

}


/* =========================
   READ SHOP QR
========================= */

function readShopQR(text){

  if(
    !text.toLowerCase()
    .startsWith("upi://pay")
  ){

    alert(
      "Idi valid UPI Shop QR kaadu."
    );

    return;

  }

  try{

    const url =
      new URL(text);

    const pa =
      url.searchParams.get("pa");

    const pn =
      url.searchParams.get("pn") ||
      "Shop";

    const am =
      url.searchParams.get("am");

    if(!pa){

      alert("UPI ID dorakaledu.");

      return;

    }

    currentQR = {

      pa:pa,

      pn:pn,

      am:am || ""

    };


    document.getElementById(
      "shopName"
    ).innerText = pn;


    document.getElementById(
      "shopUPI"
    ).innerText = pa;


    if(am){

      document.getElementById(
        "expenseAmount"
      ).value = am;

    }


    document.getElementById(
      "shopBox"
    ).classList.remove("hidden");


    stopScanner();

  }

  catch(e){

    alert(
      "UPI QR read cheyyadam lo problem."
    );

  }

}


/* =========================
   STOP SCANNER
========================= */

function stopScanner(){

  if(scanner){

    scanner.stop()
      .then(function(){

        scanner.clear();

      })
      .catch(function(){});

  }

}


/* =========================
   CLOSE SHOP
========================= */

function closeShop(){

  stopScanner();

  currentQR=null;

  document.getElementById(
    "shopBox"
  ).classList.add("hidden");

  document.getElementById(
    "reader"
  ).innerHTML="";

}


/* =========================
   PAY WITH UPI
========================= */

function payByUPI(app){

  if(!currentQR){

    alert("First scan shop QR.");

    return;

  }

  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value
    );

  const category =
    document.getElementById(
      "expenseCategory"
    ).value;

  if(!amount || amount <= 0){

    alert("Amount enter cheyyandi.");

    return;

  }


  /*
    Standard UPI URI.
    Android will hand this
    to an installed UPI app.
  */

  const params =
    new URLSearchParams();

  params.set(
    "pa",
    currentQR.pa
  );

  params.set(
    "pn",
    currentQR.pn
  );

  params.set(
    "am",
    amount.toFixed(2)
  );

  params.set(
    "cu",
    "INR"
  );


  const upiURL =
    "upi://pay?" +
    params.toString();


  /*
    Record the expense locally
    when user starts payment.
  */

  addExpense(

    amount,

    category,

    currentQR.pn,

    app === "paytm"
      ? "Paytm"
      : "PhonePe"

  );


  /*
    Open UPI application.
  */

  window.location.href =
    upiURL;

}


/* =========================
   DASHBOARD
========================= */

function updateDashboard(){

  let income=0;

  let expense=0;


  transactions.forEach(t=>{

    if(t.type==="income"){

      income +=
        Number(t.amount);

    }

    else{

      expense +=
        Number(t.amount);

    }

  });


  document.getElementById(
    "totalIncome"
  ).innerText =
    income.toLocaleString("en-IN");


  document.getElementById(
    "totalExpense"
  ).innerText =
    expense.toLocaleString("en-IN");


  document.getElementById(
    "totalBalance"
  ).innerText =
    (income-expense)
      .toLocaleString("en-IN");

}


/* =========================
   CATEGORY TOTALS
========================= */

function updateCategories(){

  const categories = {

    Food:0,

    Travel:0,

    Shopping:0,

    Bills:0,

    Education:0,

    Medical:0,

    Groceries:0,

    Other:0

  };


  transactions.forEach(t=>{

    if(
      t.type==="expense" &&
      categories[t.category] !== undefined
    ){

      categories[t.category] +=
        Number(t.amount);

    }

  });


  Object.keys(categories)
    .forEach(category=>{

      const id =
        "cat" + category;

      const element =
        document.getElementById(id);

      if(element){

        element.innerText =
          categories[category]
            .toLocaleString("en-IN");

      }

    });

}


/* =========================
   REPORT
========================= */

function generateReport(){

  const period =
    document.getElementById(
      "reportPeriod"
    ).value;


  const now =
    new Date();


  let list =
    transactions.filter(t=>{

      const d =
        new Date(t.timestamp);


      if(period==="today"){

        return (
          d.toDateString() ===
          now.toDateString()
        );

      }


      if(period==="month"){

        return (
          d.getMonth() ===
          now.getMonth() &&
          d.getFullYear() ===
          now.getFullYear()
        );

      }


      if(period==="year"){

        return (
          d.getFullYear() ===
          now.getFullYear()
        );

      }


      return true;

    });


  let income=0;

  let expense=0;


  list.forEach(t=>{

    if(t.type==="income"){

      income +=
        Number(t.amount);

    }

    else{

      expense +=
        Number(t.amount);

    }

  });


  document.getElementById(
    "report"
  ).innerHTML = `

    <div class="reportRow">
      <span>Total Income</span>
      <b class="incomeAmount">
        ₹${income.toLocaleString("en-IN")}
      </b>
    </div>

    <div class="reportRow">
      <span>Total Expense</span>
      <b class="expenseAmount">
        ₹${expense.toLocaleString("en-IN")}
      </b>
    </div>

    <div class="reportRow">
      <span>Balance</span>
      <b>
        ₹${(income-expense)
          .toLocaleString("en-IN")}
      </b>
    </div>

    <div class="reportRow">
      <span>Transactions</span>
      <b>${list.length}</b>
    </div>

  `;

}


/* =========================
   HISTORY
========================= */

function updateHistory(){

  const box =
    document.getElementById(
      "history"
    );


  if(transactions.length===0){

    box.innerHTML =
      "<p>No transactions yet.</p>";

    return;

  }


  box.innerHTML =
    transactions
      .slice(0,100)
      .map(t=>{

        const sign =
          t.type==="income"
            ? "+"
            : "-";

        const cls =
          t.type==="income"
            ? "incomeAmount"
            : "expenseAmount";


        return `

          <div class="transaction">

            <b>${escapeHTML(t.note)}</b>

            <span class="amount ${cls}">
              ${sign}
              ₹${Number(t.amount)
                .toLocaleString("en-IN")}
            </span>

            <span class="date">

              ${t.category}

              • ${t.date}

              • ${t.time}

              • ${t.day}

              • ${t.month}

              ${t.year}

            </span>

          </div>

        `;

      })
      .join("");

}


/* =========================
   SECURITY
========================= */

function escapeHTML(text){

  return String(text)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


/* =========================
   ALL UPDATE
========================= */

function updateAll(){

  updateDashboard();

  updateCategories();

  generateReport();

  updateHistory();

}


/* =========================
   QR DISPLAY
========================= */

function showReceiveQR(){

  window.scrollTo({

    top:0,

    behavior:"smooth"

  });

}


/* =========================
   LANGUAGE
========================= */

function toggleLanguage(){

  const button =
    document.getElementById(
      "languageBtn"
    );


  if(button.innerText==="తెలుగు"){

    button.innerText="English";

    document.getElementById(
      "balanceLabel"
    ).innerText="మొత్తం బ్యాలెన్స్";

    document.getElementById(
      "incomeLabel"
    ).innerText="ఆదాయం";

    document.getElementById(
      "expenseLabel"
    ).innerText="ఖర్చులు";

    document.getElementById(
      "receiveTitle"
    ).innerText="డబ్బు పొందండి";

    document.getElementById(
      "incomeTitle"
    ).innerText="ఆదాయం జోడించండి";

    document.getElementById(
      "paymentTitle"
    ).innerText="షాప్ పేమెంట్";

  }

  else{

    button.innerText="తెలుగు";

    document.getElementById(
      "balanceLabel"
    ).innerText="Total Balance";

    document.getElementById(
      "incomeLabel"
    ).innerText="Income";

    document.getElementById(
      "expenseLabel"
    ).innerText="Expenses";

    document.getElementById(
      "receiveTitle"
    ).innerText="Receive Money";

    document.getElementById(
      "incomeTitle"
    ).innerText="Add Income";

    document.getElementById(
      "paymentTitle"
    ).innerText="Pay Shop";

  }

}


/* =========================
   INITIAL LOAD
========================= */

updateAll();


/* =========================
   PWA
========================= */

if("serviceWorker" in navigator){

  window.addEventListener(
    "load",
    function(){

      navigator.serviceWorker
        .register("sw.js")
        .catch(function(){});

    }
  );

    }
