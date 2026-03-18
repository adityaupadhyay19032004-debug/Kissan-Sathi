/* ===============================
   KISAAN AI – SCRIPT FILE
================================ */

/* ---------- DARK MODE ---------- */
const darkBtn = document.getElementById("darkBtn");
if (darkBtn) {
  darkBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}

/* ---------- SIDEBAR ACTIVE ---------- */
document.querySelectorAll(".sidebar li").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".sidebar li")
      .forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

/* ---------- SIDEBAR LINK ACTIVE (MULTI PAGE) ---------- */
document.querySelectorAll(".nav-link").forEach(link => {
  if (link.href === window.location.href) {
    link.classList.add("active");
  }
});

/* ---------- LIVE TIME ---------- */
const liveTime = document.getElementById("liveTime");
if (liveTime) {
  setInterval(() => {
    liveTime.innerText = new Date().toLocaleString();
  }, 1000);
}

/* ---------- IMAGE PREVIEW ---------- */
const fileInput = document.querySelector('input[type="file"]');
if (fileInput) {
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    const img = document.getElementById("imagePreview");
    if (!file || !img) return;
    img.src = URL.createObjectURL(file);
    img.style.display = "block";
  });
}

/* ---------- ANALYZE BUTTON ---------- */
const analyzeBtn = document.querySelector(".btn");
if (analyzeBtn) {
  analyzeBtn.addEventListener("click", () => {
    alert("Crop image sent for AI analysis 🌾🤖");
  });
}

/* ---------- CHART (SAFE LOAD) ---------- */
const chartCanvas = document.getElementById("priceChart");
if (chartCanvas && window.Chart) {
  new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      datasets: [{
        label: "Wheat Price (₹/qtl)",
        data: [2100, 2150, 2130, 2180, 2200],
        borderWidth: 3,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      }
    }
  });
}

/* ---------- PAGE NAVIGATION ---------- */
function goTo(page) {
  window.location.href = page;
}

/* ---------- BACK BUTTON ---------- */
function goBack() {
  window.history.back();
}

/* ---------- PAGE LOADER ---------- */
window.addEventListener("load", () => {
  const loader = document.getElementById("pageLoader");
  if (loader) loader.style.display = "none";
});
