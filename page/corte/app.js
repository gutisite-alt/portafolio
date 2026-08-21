"use strict";

const $ = (selector) => document.querySelector(selector);
const formatNumber = (value) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 }).format(value);
const formatDate = (value) => new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

let records = [];
let damaged = [];

function pliegosCount() {
  const val = parseInt($("#sheetCount").value, 10);
  return isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
}

function extraHojasCount() {
  const val = parseInt($("#extraSheets").value, 10);
  return isNaN(val) ? 0 : Math.max(0, Math.min(7, val));
}

function totalHojasCount() {
  const total = pliegosCount() * 8 + extraHojasCount();
  return Math.max(1, total);
}

async function loadRecords() {
  try {
    const response = await fetch("api.php");
    if (!response.ok) throw new Error("Error al obtener los registros del servidor");
    records = await response.json();
    renderHistory();
  } catch (err) {
    console.error(err);
  }
}

// Parsea lo que escribe el usuario en el campo de texto
function parseDamagedInput() {
  const value = $("#damagedInput").value;
  const totalHojas = totalHojasCount();
  
  // Dividir por comas, limpiar espacios, convertir a números enteros válidos
  const indices = value.split(",")
    .map((item) => parseInt(item.trim(), 10))
    .filter((num) => !isNaN(num) && num >= 1 && num <= totalHojas)
    .map((num) => num - 1); // Guardar en base 0
    
  damaged = [...new Set(indices)]; // Eliminar duplicados
  updateResult();
}

// Filtra las hojas inválidas y actualiza el campo de texto cuando cambian los pliegos
function syncDamagedInput() {
  const totalHojas = totalHojasCount();
  
  // Mantener solo las que estén dentro del nuevo total de hojas
  damaged = damaged.filter((index) => index < totalHojas);
  
  // Si el usuario no está escribiendo activamente, actualizamos el input
  // Convertir a base 1, ordenar de menor a mayor y unir con comas
  const activeEl = document.activeElement;
  if (activeEl !== $("#damagedInput")) {
    $("#damagedInput").value = damaged.map((idx) => idx + 1).sort((a, b) => a - b).join(", ");
  }
  
  updateResult();
}

function updateResult() {
  const totalHojas = totalHojasCount();
  const good = totalHojas - damaged.length;
  const processed = totalHojas * 40;
  const discarded = damaged.length * 40;
  const waste = totalHojas ? (damaged.length / totalHojas) * 100 : 0;
  
  $("#damagedCounter").textContent = `${damaged.length} descartada${damaged.length === 1 ? "" : "s"}`;
  $("#usable").textContent = formatNumber(good * 40);
  $("#goodSections").textContent = `${good} hojas buenas × 40`;
  $("#processed").textContent = formatNumber(processed);
  $("#discarded").textContent = `−${formatNumber(discarded)}`;
  $("#processedSections").textContent = totalHojas;
  $("#waste").textContent = `${waste.toFixed(1).replace(".", ",")}%`;
  $("#wasteBar").style.width = `${Math.min(waste, 100)}%`;
  $("#resultNote").textContent = damaged.length ? `${damaged.length} hoja${damaged.length === 1 ? "" : "s"} completa${damaged.length === 1 ? "" : "s"} fuera de producción.` : "Todas las hojas están aprovechables.";
}

function renderHistory() {
  const filter = $("#filterDate").value;
  $("#clearFilter").hidden = !filter;
  const visible = records.filter((record) => !filter || record.date === filter).sort((a, b) => b.date.localeCompare(a.date));
  const totals = visible.reduce((sum, record) => ({ sheets: sum.sheets + Number(record.sheets), damaged: sum.damaged + record.damaged.length }), { sheets: 0, damaged: 0 });
  
  $("#totalSheets").textContent = formatNumber(totals.sheets);
  $("#totalProcessed").textContent = formatNumber(totals.sheets * 320);
  $("#totalDiscarded").textContent = formatNumber(totals.damaged * 40);
  $("#totalUsable").textContent = formatNumber((totals.sheets * 8 - totals.damaged) * 40);
  const body = $("#historyBody");
  body.innerHTML = "";

  if (!visible.length) {
    body.innerHTML = '<tr><td class="empty" colspan="8">No hay registros para mostrar.</td></tr>';
    return;
  }

  visible.forEach((record) => {
    const row = document.createElement("tr");
    const pliegos = Number(record.sheets);
    const totalHojas = Math.round(pliegos * 8);
    const pliegosEnteros = Math.floor(pliegos);
    const hojasExtras = totalHojas % 8;
    const pliegosStr = hojasExtras > 0 ? `${pliegosEnteros} pl. + ${hojasExtras} hj.` : `${pliegosEnteros}`;

    row.innerHTML = `<td><b>${formatDate(record.date)}</b>${record.note ? `<small>${escapeHtml(record.note)}</small>` : ""}</td><td>${pliegosStr}</td><td>${totalHojas}</td><td><span class="bad-pill">${record.damaged.length}</span></td><td>${formatNumber(record.damaged.length * 40)}</td><td><strong class="good-number">${formatNumber((totalHojas - record.damaged.length) * 40)}</strong></td><td>${escapeHtml(record.reason || "—")}</td><td><button class="delete" type="button" aria-label="Eliminar registro">×</button></td>`;
    row.querySelector(".delete").addEventListener("click", async () => {
      if (confirm("¿Eliminar este registro de corte?")) {
        try {
          const response = await fetch(`api.php?id=${encodeURIComponent(record.id)}`, { method: "DELETE" });
          if (!response.ok) throw new Error("Error al eliminar el registro");
          await loadRecords();
        } catch (err) {
          alert(err.message);
        }
      }
    });
    body.appendChild(row);
  });
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

async function saveRecord() {
  const date = $("#cutDate").value;
  if (!date) return;
  
  const totalHojas = totalHojasCount();
  const sheetsVal = totalHojas / 8;

  const newRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    date,
    sheets: sheetsVal,
    damaged: [...damaged],
    reason: $("#reason").value,
    note: $("#note").value.trim()
  };

  try {
    const response = await fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord)
    });
    if (!response.ok) throw new Error("Error al guardar el registro");

    $("#sheetCount").value = 1;
    $("#extraSheets").value = 0;
    $("#damagedInput").value = "";
    $("#reason").value = "";
    $("#note").value = "";
    damaged = [];
    syncDamagedInput();
    await loadRecords();
    
    // Ocultar modal al guardar exitosamente
    $("#registerModal").hidden = true;
    
    $("#toast").hidden = false;
    setTimeout(() => { $("#toast").hidden = true; }, 2600);
  } catch (err) {
    alert(err.message);
  }
}

// Inicialización de la fecha
$("#filterDate").value = "";

// Eventos de apertura y cierre de modal
$("#openModalBtn").addEventListener("click", () => {
  $("#cutDate").value = today();
  $("#sheetCount").value = 1;
  $("#extraSheets").value = 0;
  $("#damagedInput").value = "";
  $("#reason").value = "";
  $("#note").value = "";
  damaged = [];
  syncDamagedInput();
  $("#registerModal").hidden = false;
});

$("#closeModalBtn").addEventListener("click", () => {
  $("#registerModal").hidden = true;
});

$("#cancelRecord").addEventListener("click", () => {
  $("#registerModal").hidden = true;
});

// Eventos del formulario
$("#sheetCount").addEventListener("change", syncDamagedInput);
$("#sheetCount").addEventListener("input", syncDamagedInput);
$("#subtractSheet").addEventListener("click", () => { $("#sheetCount").value = Math.max(0, pliegosCount() - 1); syncDamagedInput(); });
$("#addSheet").addEventListener("click", () => { $("#sheetCount").value = Math.min(100, pliegosCount() + 1); syncDamagedInput(); });

$("#extraSheets").addEventListener("change", syncDamagedInput);
$("#extraSheets").addEventListener("input", syncDamagedInput);
$("#subtractExtra").addEventListener("click", () => { $("#extraSheets").value = Math.max(0, extraHojasCount() - 1); syncDamagedInput(); });
$("#addExtra").addEventListener("click", () => { $("#extraSheets").value = Math.min(7, extraHojasCount() + 1); syncDamagedInput(); });

$("#damagedInput").addEventListener("input", parseDamagedInput);

$("#saveRecord").addEventListener("click", saveRecord);
$("#filterDate").addEventListener("change", renderHistory);
$("#clearFilter").addEventListener("click", () => { $("#filterDate").value = ""; renderHistory(); });

// Carga inicial
syncDamagedInput();
loadRecords();
