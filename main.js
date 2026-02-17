// main.js — расчёт ТОЛЬКО по кнопкам "Рассчитать"
document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // 0) ВЫБОР КАЛЬКУЛЯТОРА (показываем только выбранный)
  // ============================================================
  const calcSelect = document.getElementById('calcSelect');
  const calcItems = Array.from(document.querySelectorAll('section.calc-item[data-calc]'));

  function calcTitle(sec){
    const h2 = sec.querySelector('h2');
    return (h2 ? h2.textContent.trim() : sec.dataset.calc);
  }

  function hideAllCalcItems(){
    calcItems.forEach(sec => sec.classList.add('hidden'));
  }

  function showCalc(key){
    hideAllCalcItems();
    const sec = calcItems.find(s => s.dataset.calc === key);
    if (sec) sec.classList.remove('hidden');
  }

  // наполняем список
  if (calcSelect && calcItems.length){
    calcSelect.innerHTML = '<option value="">— выберите —</option>' +
      calcItems.map(sec => `<option value="${sec.dataset.calc}">${calcTitle(sec)}</option>`).join('');

    // старт: всё скрыто
    hideAllCalcItems();

    calcSelect.addEventListener('change', () => {
      if (!calcSelect.value){
        hideAllCalcItems();
      } else {
        showCalc(calcSelect.value);
      }
    });
  }
  

  
  // ============================================================
  // 2) КАЛЬКУЛЯТОР ЖАЛЮЗИЙНОГО ЗАБОРА (СЕКЦИИ + ТАБЛИЦА)
  // ============================================================
  const sectionsWrap = document.getElementById('sectionsWrap');
  const addSectionBtn = document.getElementById('addSectionBtn');
  const jCalcBtn = document.getElementById('j_calcBtn');
  const jErr = document.getElementById('j_err');
  const jTableWrap = document.getElementById('j_tableWrap');
const jPdfBtn = document.getElementById('j_pdfBtn');

// последнее рассчитанное (для PDF)
let lastSectionsData = null;
let lastFinalAgg = null;

  // Если второй калькулятор отсутствует на странице — просто выходим
  if (!sectionsWrap || !addSectionBtn || !jCalcBtn || !jErr || !jTableWrap) return;
if (!sectionsWrap || !addSectionBtn || !jCalcBtn || !jErr || !jTableWrap || !jPdfBtn) return;

  let sectionIndex = 0;

  const BOM_ITEMS = [
    { key: 'lamel', label: 'Ламель Хоста' },
    { key: 'stoyka', label: 'Стойка' },
    { key: 'krepezh', label: 'Крепежная планка' },
    { key: 'kryshka', label: 'Крышка' },
    { key: 'dekor', label: 'Декоративная\nнакладка' },
    { key: 'dekor_ugol', label: 'Декоративная\nнакладка угловая' },
    { key: 'finish', label: 'Планка завершающая' },
    { key: 'profftruba', label: 'Профтруба' },
    { key: 'screw_stoyka', label: 'Саморезы (для стойки)' },
    { key: 'screw_psh', label: 'Саморезы ПШ (для ламелей и добора)' }
  ];

  const jHeights = [
    0.48,0.58,0.67,0.77,0.86,0.96,1.05,1.15,1.24,1.34,
    1.43,1.53,1.62,1.72,1.81,1.91,2.00,2.10,2.19,2.29,
    2.38,2.48,2.57,2.67,2.76,2.86,2.95
  ];

  const jDepths = [];
  for (let d = 0.3; d <= 1.5001; d += 0.1) jDepths.push(d.toFixed(1));

  function optionsHTML(values, placeholder){
    let html = `<option value="">${placeholder}</option>`;
    values.forEach(v => {
      html += `<option value="${v}">${String(v).replace('.', ',')}</option>`;
    });
    return html;
  }

  function updateSectionTitles(){
    const sections = sectionsWrap.querySelectorAll('.section');
    sections.forEach((sec, idx) => {
      const title = sec.querySelector('.section-title');
      if (title) title.textContent = `Секция ${idx + 1} — исходные параметры`;

      const removeBtn = sec.querySelector('.remove-section');
      if (removeBtn) removeBtn.style.display = idx === 0 ? 'none' : 'inline-block';
    });
    sectionIndex = sections.length;
  }

  function createSection(){
    sectionIndex++;

    const div = document.createElement('div');
    div.className = 'section';

    div.innerHTML = `
      <div class="section-header">
        <h3 class="section-title">Секция ${sectionIndex} — исходные параметры</h3>
        <button type="button" class="remove-section">Удалить секцию</button>
      </div>

      <div class="grid3">
        <div class="col">
          <div class="field">
            <label>Наименование забора</label>
            <select class="j_name">
              <option value="">— выберите —</option>
              <option value="yukka">Юкка</option>
              <option value="hosta">Хоста</option>
            </select>
          </div>

          <div class="field">
            <label>Высота забора (м)</label>
            <select class="j_height" disabled>
              ${optionsHTML(jHeights, '— выберите высоту —')}
            </select>
          </div>

          <div class="field">
            <label>Количество секций</label>
            <input class="j_sections" type="number" min="1" step="1">
          </div>
        </div>

        <div class="col">
          <div class="field">
            <label>Расстояние между столбов (м) <span class="hint">(от 0,5 до 3 м)</span></label>
            <input class="j_span" type="number" min="0.5" max="3" step="0.01">
          </div>

          <div class="field">
            <label>Количество углов 90°</label>
            <input class="j_corners" type="number" min="0" step="1">
          </div>

          <div class="field">
            <label>Кирпичные/Бетонные столбы</label>
            <select class="j_brick">
              <option value="">— выберите —</option>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>
        </div>

        <div class="col">
          <div class="field">
            <label>Размер профтрубы</label>
            <select class="j_pipe">
              <option value="">— выберите —</option>
              <option value="none">нет</option>
              <option value="60x60">60×60</option>
              <option value="80x80">80×80</option>
            </select>
          </div>

          <div class="field">
            <label>Заглубление столба (м)</label>
            <select class="j_depth">
              ${optionsHTML(jDepths, '— выберите —')}
            </select>
          </div>
        </div>
      </div>
    `;

    sectionsWrap.appendChild(div);

    // высота доступна только после выбора наименования
    const nameSel = div.querySelector('.j_name');
    const heightSel = div.querySelector('.j_height');
    nameSel.addEventListener('change', () => {
      heightSel.disabled = !nameSel.value;
      if (!nameSel.value) heightSel.value = '';
      jResetOutput();
    });

    // удаление секции
    const removeBtn = div.querySelector('.remove-section');
    removeBtn.addEventListener('click', () => {
      div.remove();
      updateSectionTitles();
      jResetOutput();
    });

    // очистка результата при изменениях
    div.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', jResetOutput);
      el.addEventListener('change', jResetOutput);
    });


    // --- UI rules ---
    const brickSel = div.querySelector('.j_brick');
    const pipeSel  = div.querySelector('.j_pipe');
    const depthSel = div.querySelector('.j_depth');
    const pipeField  = pipeSel ? pipeSel.closest('.field') : null;
    const depthField = depthSel ? depthSel.closest('.field') : null;

    function applyJaluziUiRules(){
      const brickYes = brickSel && brickSel.value === 'yes';

      // 1) Размер профтрубы: если кирп/бетон = да -> поле НЕ скрываем, а отключаем
      if (pipeField){
        pipeField.classList.toggle('disabled-field', brickYes);
      }
      if (pipeSel){
        pipeSel.disabled = !!brickYes;
      }
      if (brickYes && pipeSel){
        pipeSel.value = 'none';
      }

      // 2) Заглубление: активно только если профтруба выбрана (не "нет") и кирп/бетон = нет
      const allowDepth = (!brickYes) && pipeSel && (pipeSel.value !== 'none');
      if (depthField){
        depthField.classList.toggle('disabled-field', !allowDepth);
      }
      if (depthSel){
        depthSel.disabled = !allowDepth;
        if (!allowDepth) depthSel.value = '';
      }
    }
      if (brickYes && pipeSel){
        pipeSel.value = 'none';
      }

      // Depth shown only when pipe is selected (not "none") AND brick is not yes
      const showDepth = (!brickYes) && pipeSel && pipeSel.value !== 'none';
      if (depthField){
        depthField.classList.toggle('hidden', !showDepth);
        if (!showDepth && depthSel) depthSel.value = '';
      }
    }

    if (brickSel) brickSel.addEventListener('change', applyJaluziUiRules);
    if (pipeSel) pipeSel.addEventListener('change', applyJaluziUiRules);

    // apply on init
    applyJaluziUiRules();

    updateSectionTitles();
  }

  function jResetOutput(){
  jTableWrap.innerHTML = '';
  jErr.textContent = '';
  jPdfBtn.classList.add('hidden');
  lastSectionsData = null;
  lastFinalAgg = null;
}


  // первая секция при загрузке
  createSection();

  // кнопка "Добавить секцию"
  addSectionBtn.addEventListener('click', () => createSection());

  // ===== РЕНДЕР ТАБЛИЦЫ =====
  function esc(s){
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }
  function fmtSizeCell(v){
    if (v === null || v === undefined || v === '') return '—';
    return esc(String(v)).replaceAll('.', ',');
  }
  function fmtQtyCell(v){
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    if (!isFinite(n)) return '—';
    return String(Math.round(n));
  }

  function renderBOMTable(agg){
    const cols1 = BOM_ITEMS.map(it => {
      const title = esc(it.label).replaceAll('\n','<br>');
      return `<th colspan="2">${title}</th>`;
    }).join('');

    const cols2 = BOM_ITEMS.map(() =>
      `<th class="subhead">Размер, м</th><th class="subhead">Кол-во, шт</th>`
    ).join('');

    const maxRows = Math.max(1, ...BOM_ITEMS.map(it => (agg[it.key]?.length || 0)));

    let body = '';
    for (let r = 0; r < maxRows; r++){
      const tds = BOM_ITEMS.map(it => {
        const rec = agg[it.key]?.[r];
        const size = rec ? rec.size : '—';
        const qty  = rec ? rec.qty  : '—';
        return `<td>${fmtSizeCell(size)}</td><td>${fmtQtyCell(qty)}</td>`;
      }).join('');
      body += `<tr>${tds}</tr>`;
    }

    jTableWrap.innerHTML = `
      <div class="table-wrap">
        <table class="bom">
          <thead>
            <tr>${cols1}</tr>
            <tr>${cols2}</tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  // ===== ДАННЫЕ СЕКЦИЙ =====
  function getAllSectionsData(){
    const sections = Array.from(sectionsWrap.querySelectorAll('.section'));
    return sections.map(sec => {
      const name = sec.querySelector('.j_name')?.value || '';
      const height = Number((sec.querySelector('.j_height')?.value || '').replace(',', '.'));
      const span = Number(sec.querySelector('.j_span')?.value);
      const sectionsQty = Number(sec.querySelector('.j_sections')?.value);
      const corners = Number(sec.querySelector('.j_corners')?.value);
      const brick = sec.querySelector('.j_brick')?.value || '';
      const pipe = sec.querySelector('.j_pipe')?.value || ''; // none / 60x60 / 80x80
      const depth = Number((sec.querySelector('.j_depth')?.value || '').replace(',', '.'));
      return { name, height, span, sectionsQty, corners, brick, pipe, depth };
    });
  }

  function roundToCmMeters(x){ return Number(x.toFixed(2)); } // до 0,01 м

  function sizeByHeight(h){
    if (h <= 2) return 2;
    if (h <= 3) return 3;
    return Math.ceil(h);
  }

  // Для "Стойка" и "Крепежная планка":
  // - если Высота забора <= 2 м => 2 м
  // - если 2 < Высота забора <= 3 м => 3 м
  // - если Высота забора > 3 м => 2 м
  function sizeByHeightStoykaKrepezh(h){
    if (h <= 2) return 2;
    if (h <= 3) return 3;
    return 2;
  }

  
  // Для "Декоративная накладка" и "Декоративная накладка угловая":
  // - если Высота забора <= 2 м => 2 м
  // - если 2 < Высота забора <= 3 м => 3 м
  // - если Высота забора > 3 м => 2 м
  function sizeByHeightDekor(h){
    if (h <= 2) return 2;
    if (h <= 3) return 3;
    return 2;
  }

function sizeBySpan(span){
    if (span <= 2) return 2;
    if (span <= 3) return 3;
    return Math.ceil(span);
  }

  function addAgg(agg, key, size, qty){
    if (qty === 0 || qty === null || qty === undefined) return;
    const s = String(size);
    if (!agg[key]) agg[key] = new Map();
    const prev = agg[key].get(s) || 0;
    agg[key].set(s, prev + qty);
  }

  function finalizeAgg(agg){
    const out = {};
    BOM_ITEMS.forEach(it => {
      const map = agg[it.key] || new Map();
      const arr = Array.from(map.entries()).map(([size, qty]) => ({ size, qty }));

      arr.sort((a,b) => {
        const na = Number(String(a.size).replace(',', '.'));
        const nb = Number(String(b.size).replace(',', '.'));
        const aNum = isFinite(na);
        const bNum = isFinite(nb);
        if (aNum && bNum) return na - nb;
        if (aNum && !bNum) return -1;
        if (!aNum && bNum) return 1;
        return String(a.size).localeCompare(String(b.size), 'ru');
      });

      out[it.key] = arr;
    });
    return out;
  }

  // ===== РАСЧЁТ ПО ФОРМУЛАМ =====
  function jCalc(){
    jResetOutput();

    const data = getAllSectionsData();
    if (!data.length) {
      jErr.textContent = 'Нет секций для расчёта';
      return;
    }

    // валидация
    for (let i = 0; i < data.length; i++) {
      const s = data[i];
      const idx = i + 1;

      if (!s.name) { jErr.textContent = `Секция ${idx}: выберите наименование`; return; }
      if (!isFinite(s.height) || s.height <= 0) { jErr.textContent = `Секция ${idx}: выберите высоту`; return; }
      if (!isFinite(s.span) || s.span < 0.5 || s.span > 3) { jErr.textContent = `Секция ${idx}: расстояние между столбов 0,5–3 м`; return; }
      if (!Number.isInteger(s.sectionsQty) || s.sectionsQty <= 0) { jErr.textContent = `Секция ${idx}: количество секций — целое > 0`; return; }
      if (!Number.isInteger(s.corners) || s.corners < 0) { jErr.textContent = `Секция ${idx}: углы — целое ≥ 0`; return; }
      if (!s.brick) { jErr.textContent = `Секция ${idx}: выберите кирпичные/бетонные столбы`; return; }
      if (!s.pipe) { jErr.textContent = `Секция ${idx}: выберите размер профтрубы`; return; }
      if (!isFinite(s.depth) || s.depth < 0.3 || s.depth > 1.5) { jErr.textContent = `Секция ${idx}: заглубление 0,3–1,5 м`; return; }
    }

    const agg = {};

    data.forEach(s => {
      // Ламели
      const lamelSize = roundToCmMeters(s.span - 0.01);
      const lamelQty = Math.floor(s.height / 0.095 * s.sectionsQty);
      addAgg(agg, 'lamel', lamelSize, lamelQty);

      // Стойка
      const stoykaSize = sizeByHeightStoykaKrepezh(s.height);
      const stoykaQty = s.sectionsQty * 2;
      addAgg(agg, 'stoyka', stoykaSize, stoykaQty);

      // Крепежная планка
      const krepezhSize = sizeByHeightStoykaKrepezh(s.height);
      // формула: расстояние между столбов / 1 * кол-во секций (округляем вверх)
      const krepezhQty = Math.ceil((s.span / 1) * s.sectionsQty);
      addAgg(agg, 'krepezh', krepezhSize, krepezhQty);

      // Крышка
      const kryshkaSize = sizeBySpan(s.span);
      const kryshkaQty = s.sectionsQty;
      addAgg(agg, 'kryshka', kryshkaSize, kryshkaQty);

      // Декоративная накладка (если столбы НЕ кирп/бетон)
      if (s.brick === 'no' && s.pipe !== 'none') {
        const dekorSize = sizeByHeightDekor(s.height);
        const dekorQty = (s.sectionsQty + 1) * 2 - (s.corners * 2);
        addAgg(agg, 'dekor', dekorSize, dekorQty);
      }

      // Угловая декоративная накладка (если углы > 0)
      if (s.corners > 0 && s.pipe !== 'none') {
        const dekorUSize = sizeByHeightDekor(s.height);
        const dekorUQty = s.corners;
        addAgg(agg, 'dekor_ugol', dekorUSize, dekorUQty);
      }

      // Планка завершающая
      const finishSize = sizeBySpan(s.span);
      const finishQty = s.sectionsQty;
      addAgg(agg, 'finish', finishSize, finishQty);

      // Профтруба (если выбрано не "нет")
      let profftrubaQty = 0;
      if (s.pipe !== 'none') {
        profftrubaQty = Math.ceil((2 * (s.height + s.depth)) / 6);
        addAgg(agg, 'profftruba', 6, profftrubaQty);
      }

      // Саморезы для стойки (не считаем, если профтруба = нет)
      if (s.pipe !== 'none') {
        addAgg(agg, 'screw_stoyka', '5.5x19', stoykaQty * 5);
      }

      // Саморезы ПШ
      const screwPSHQty =
        (lamelQty * 4) +
        (krepezhQty * lamelQty) +
        (kryshkaQty * 4) +
        (finishQty * 2) +
        (finishQty * krepezhQty);

      addAgg(agg, 'screw_psh', '4.2x16', screwPSHQty);
    });

    const finalAgg = finalizeAgg(agg);
    renderBOMTable(finalAgg);
    lastSectionsData = data;
lastFinalAgg = finalAgg;
jPdfBtn.classList.remove('hidden');
  }
function buildBomRows(finalAgg){
  const maxRows = Math.max(1, ...BOM_ITEMS.map(it => (finalAgg[it.key]?.length || 0)));

  const rows = [];
  for (let r = 0; r < maxRows; r++){
    const row = [];
    BOM_ITEMS.forEach(it => {
      const rec = finalAgg[it.key]?.[r];
      row.push(rec ? String(rec.size).replace('.', ',') : '—');
      row.push(rec ? String(Math.round(rec.qty)) : '—');
    });
    rows.push(row);
  }
  return rows;
}

function downloadJaluziPdf(){
  if (!lastSectionsData || !lastFinalAgg) return;

  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    jErr.textContent = 'PDF не может быть создан: jsPDF не загружен';
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // подключаем Montserrat
  let fontB64 = window.__PDF_FONT_MONTSERRAT__;
  if (!fontB64) {
    jErr.textContent = 'Не найден шрифт Montserrat (fonts.js)';
    return;
  }
  fontB64 = fontB64.replace(/\s+/g, ''); // на всякий случай убираем переносы/пробелы

  doc.addFileToVFS('Montserrat-Regular.ttf', fontB64);
  doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');

  // базовые настройки + заголовок (ВАЖНО: НЕ переключаемся на helvetica)
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(12);
  doc.text('Расчёт жалюзийного забора', 14, 12);

  // ===== Таблица введённых данных по секциям =====
  const secHead = [[
    'Секция', 'Наименование', 'Высота, м', 'Расст. между, м', 'Секций, шт', 'Углы 90°, шт',
    'Кирп/бетон', 'Проф труба', 'Заглубление, м'
  ]];

  const secBody = lastSectionsData.map((s, i) => ([
    String(i + 1),
    s.name === 'yukka' ? 'Юкка' : (s.name === 'hosta' ? 'Хоста' : s.name),
    String(s.height).replace('.', ','),
    String(s.span).replace('.', ','),
    String(s.sectionsQty),
    String(s.corners),
    s.brick === 'yes' ? 'Да' : 'Нет',
    s.pipe === 'none' ? 'нет' : (s.pipe === '60x60' ? '60×60' : (s.pipe === '80x80' ? '80×80' : s.pipe)),
    String(s.depth).replace('.', ',')
  ]));

  doc.autoTable({
  head: secHead,          // или [head1, head2] во второй таблице
  body: secBody,          // или bomBody
  startY: 16,             // для второй таблицы используйте startY: y
  theme: 'grid',

  styles: {
    font: 'Montserrat',
    fontSize: 8,
    cellPadding: 2,
    halign: 'center',
    valign: 'middle',

    lineColor: [0, 0, 0],   // ← ЧЁРНЫЕ линии
    lineWidth: 0.2          // ← толщина линий
  },

  headStyles: {
    font: 'Montserrat',
    fillColor: [220, 220, 220], // светло-серый заголовок
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0],
    lineWidth: 0.3,
    fontSize: 8
  },

  alternateRowStyles: {
    fillColor: [245, 245, 245]  // ← чередование строк
  },

  margin: { left: 14, right: 14 }
});


  let y = doc.lastAutoTable.finalY + 8;

  // ===== Таблица расчёта (колонка-группами) =====
  const head1 = BOM_ITEMS.map(it => ({
    content: it.label.replace('\n', ' '),
    colSpan: 2,
    styles: { halign: 'center' }
  }));

  const head2 = [];
  BOM_ITEMS.forEach(() => {
    head2.push('Размер, м');
    head2.push('Кол-во, шт');
  });

  const bomBody = buildBomRows(lastFinalAgg);

  doc.autoTable({
  startY: y,
  head: [head1, head2],
  body: bomBody,
  theme: 'grid',

  styles: {
    font: 'Montserrat',
    fontSize: 7,
    cellPadding: 1.6,
    halign: 'center',
    valign: 'middle',

    lineColor: [0, 0, 0],
    lineWidth: 0.2
  },

  headStyles: {
    font: 'Montserrat',
    fillColor: [220, 220, 220],
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0],
    lineWidth: 0.3,
    fontSize: 7
  },

  alternateRowStyles: {
    fillColor: [245, 245, 245]
  },

  margin: { left: 14, right: 14 },
  tableWidth: 'auto'
});


  doc.save('raschet-zhalyuzi.pdf');
}


jPdfBtn.addEventListener('click', downloadJaluziPdf);

  jCalcBtn.addEventListener('click', jCalc);
});


// =====================
// 3) Арочный штакетник (БЕЗ СХЕМЫ ВООБЩЕ: ни на сайте, ни в PDF)
// =====================
const aSpan = document.getElementById('a_span');
const aEdgeH = document.getElementById('a_edge_h');
const aCenterH = document.getElementById('a_center_h');
const aPlankW = document.getElementById('a_plank_w');
const aGap = document.getElementById('a_gap');
const aChess = document.getElementById('a_chess');

const aCalcBtn = document.getElementById('a_calcBtn');
const aPdfBtn  = document.getElementById('a_pdfBtn');

const aQtyEl = document.getElementById('a_qty');
const aMinEl = document.getElementById('a_min');
const aMaxEl = document.getElementById('a_max');
const aErrEl = document.getElementById('a_err');
const aTableWrap = document.getElementById('a_tableWrap');
const aSummaryWrap = document.getElementById('a_summaryWrap');

let aLastInput = null;
let aLastRow1 = null;
let aLastRow2 = null;
let aLastSummaryRows = null; // [{h, qty}]

function aReset(){
  if (aQtyEl) aQtyEl.textContent = '—';
  if (aMinEl) aMinEl.textContent = '—';
  if (aMaxEl) aMaxEl.textContent = '—';
  if (aErrEl) aErrEl.textContent = '';
  if (aTableWrap) aTableWrap.innerHTML = '';
  if (aSummaryWrap) aSummaryWrap.innerHTML = '';
  if (aPdfBtn) aPdfBtn.classList.add('hidden');

  aLastInput = null;
  aLastRow1 = null;
  aLastRow2 = null;
  aLastSummaryRows = null;
}

function roundToCm(mm){
  return Math.round(mm / 10) * 10; // 1 см
}

// ====== ВЫСОТА ПО ФОРМУЛАМ EXCEL (r, d) ======
function arcHeightAtX(span, edgeH, centerH, x){
  const f = centerH - edgeH;
  const a = span / 2;

  if (!isFinite(f) || Math.abs(f) < 1e-9) return edgeH;

  const r = (span * span) / (8 * f) + (f / 2);
  const d = Math.sqrt(Math.max(0, r * r - a * a));

  const under = r * r - x * x;
  if (under <= 0) return edgeH;

  return edgeH + (Math.sqrt(under) - d);
}

// ====== РЯД (float -> сглаживание -> -10 -> центр -> округление) ======
function buildPickersExcelSmooth(span, edgeH, centerH, plankW, gap, offset){
  const list = [];
  const P = plankW + gap;
  if (!isFinite(P) || P <= 0) return list;

  // Excel: N = floor((span + gap) / (plankW + gap))
  const Nraw = (span + gap) / (plankW + gap);
  const N = Math.floor(Nraw);
  if (N <= 0) return list;

  const a = span / 2;

  // 1) сырые высоты
  const raw = [];
  for (let i = 0; i < N; i++){
    const pos = (plankW / 2) + i * P + offset;
    const x = pos - a;
    let h = arcHeightAtX(span, edgeH, centerH, x);
    if (i === 0 || i === N - 1) h = edgeH;
    raw.push(h);
  }

  // 2) сглаживание (2 прохода)
  let smooth = raw.slice();
  for (let pass = 0; pass < 2; pass++){
    const tmp = smooth.slice();
    for (let i = 1; i < N - 1; i++){
      tmp[i] = (smooth[i - 1] + smooth[i] + smooth[i + 1]) / 3;
    }
    tmp[0] = edgeH;
    tmp[N - 1] = edgeH;
    smooth = tmp;
  }

  // 3) -10 мм всем кроме первой/последней
  for (let i = 1; i < N - 1; i++){
    smooth[i] -= 10;
  }

  // 4) центр(а) = высоте по центру
  const mid1 = Math.floor((N - 1) / 2);
  const mid2 = Math.ceil((N - 1) / 2);
  if (mid1 !== 0 && mid1 !== N - 1) smooth[mid1] = centerH;
  if (mid2 !== 0 && mid2 !== N - 1) smooth[mid2] = centerH;

  // 5) не выше центра + округление
  const centerRounded = roundToCm(centerH);
  const edgeRounded = roundToCm(edgeH);

  for (let i = 0; i < N; i++){
    let h = smooth[i];
    if (h > centerH) h = centerH;
    if (h < 0) h = 0;

    h = roundToCm(h);

    if (i === 0 || i === N - 1) h = edgeRounded;
    if (i === mid1 || i === mid2) h = centerRounded;

    list.push(h);
  }

  return list;
}

function renderArchedTable(rowA, rowB){
  if (!aTableWrap) return;

  let html = `
    <table class="small-table">
      <thead>
        <tr>
          <th>№</th>
          <th>Высота (ряд 1), мм</th>
          <th>Высота (ряд 2), мм</th>
        </tr>
      </thead>
      <tbody>
  `;

  const maxN = Math.max(rowA.length, rowB.length, 1);
  for (let i = 0; i < maxN; i++){
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${rowA[i] ?? '—'}</td>
        <td>${rowB[i] ?? '—'}</td>
      </tr>
    `;
  }

  html += `</tbody></table>`;
  aTableWrap.innerHTML = html;
}

// ====== СВОДКА (объединяем одинаковые размеры) ======
function renderArchedSummaryGrouped(row1, row2, chess){
  if (!aSummaryWrap) return [];

  const N = row1.length;
  const map = new Map();

  for (let i = 0; i < N; i++){
    const h = row1[i];
    if (h == null) continue;

    let qty = chess ? (row2[i] != null ? 2 : 1) : 1;

    // нечётное N -> последняя = 1
    if (chess && (N % 2 === 1) && i === N - 1) qty = 1;

    map.set(h, (map.get(h) || 0) + qty);
  }

  const rows = Array.from(map.entries())
    .map(([h, qty]) => ({ h: Number(h), qty }))
    .sort((a,b) => a.h - b.h);

  const body = rows.map(r => `
    <tr>
      <td>${r.h}</td>
      <td>${r.qty}</td>
    </tr>
  `).join('');

  aSummaryWrap.innerHTML = `
    <table class="small-table" style="max-width:520px;">
      <thead>
        <tr>
          <th>Высота H(x), мм</th>
          <th>${chess ? 'Кол-во (шахматка), шт' : 'Кол-во, шт'}</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;

  return rows;
}

function aCalc(){
  aReset();

  const span = Number(aSpan?.value);
  const edgeH = Number(aEdgeH?.value);
  const centerH = Number(aCenterH?.value);
  const plankW = Number(aPlankW?.value);
  const gap = Number(aGap?.value);
  const chess = aChess?.value === 'yes';

  if (!isFinite(span) || span <= 0) { if(aErrEl) aErrEl.textContent = 'Введите ширину пролёта (мм) > 0'; return; }
  if (!isFinite(edgeH) || edgeH <= 0) { if(aErrEl) aErrEl.textContent = 'Введите высоту у стоек (мм) > 0'; return; }
  if (!isFinite(centerH) || centerH <= 0) { if(aErrEl) aErrEl.textContent = 'Введите высоту по центру (мм) > 0'; return; }
  if (!isFinite(plankW) || plankW <= 0) { if(aErrEl) aErrEl.textContent = 'Выберите ширину планки'; return; }
  if (!isFinite(gap) || gap < 0) { if(aErrEl) aErrEl.textContent = 'Зазор не может быть отрицательным'; return; }

  const P = plankW + gap;
  if (P <= 0) { if(aErrEl) aErrEl.textContent = 'Ширина планки + зазор должны быть > 0'; return; }

  const row1 = buildPickersExcelSmooth(span, edgeH, centerH, plankW, gap, 0);
  let row2 = chess ? buildPickersExcelSmooth(span, edgeH, centerH, plankW, gap, P / 2) : [];

  // для шахматки: если получилось столько же, а N нечётное — последнюю во 2 ряду убираем
  if (chess && (row1.length % 2 === 1) && row2.length === row1.length) row2.pop();

  const all = row1.concat(row2);
  const qty = chess ? (row1.length + row2.length) : row1.length;

  const minH = all.length ? Math.min(...all) : 0;
  const maxH = all.length ? Math.max(...all) : 0;

  if (aQtyEl) aQtyEl.textContent = String(qty);
  if (aMinEl) aMinEl.textContent = String(minH);
  if (aMaxEl) aMaxEl.textContent = String(maxH);

  renderArchedTable(row1, row2);
  const summaryRows = renderArchedSummaryGrouped(row1, row2, chess);

  aLastInput = { span, edgeH, centerH, plankW, gap, chess };
  aLastRow1 = row1.slice();
  aLastRow2 = row2.slice();
  aLastSummaryRows = summaryRows;

  if (aPdfBtn) aPdfBtn.classList.remove('hidden');
}

// ===== PDF (БЕЗ СХЕМЫ) =====
function downloadArchedPdf(){
  if (!aLastInput || !aLastSummaryRows) return;

  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    if (aErrEl) aErrEl.textContent = 'PDF не может быть создан: jsPDF не загружен';
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Montserrat (если есть fonts.js)
  const fontB64 = window.__PDF_FONT_MONTSERRAT__;
  const hasMontserrat = !!fontB64;
  if (hasMontserrat) {
    try {
      doc.addFileToVFS('Montserrat-Regular.ttf', fontB64);
      doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
      doc.setFont('Montserrat', 'normal');
    } catch(e) {}
  }

  doc.setFontSize(14);
  doc.text('Расчёт арочного штакетника', 14, 12);

  const { span, edgeH, centerH, plankW, gap, chess } = aLastInput;

  const info = [
    ['Ширина пролёта, мм', String(span)],
    ['Высота у стоек, мм', String(edgeH)],
    ['Высота по центру, мм', String(centerH)],
    ['Ширина планки, мм', String(plankW)],
    ['Зазор, мм', String(gap)],
    ['Режим', chess ? 'Шахматка' : 'Один ряд'],
  ];

  let yAfter = 16;

  if (doc.autoTable) {
    doc.autoTable({
      head: [['Параметр', 'Значение']],
      body: info,
      startY: 16,
      theme: 'grid',
      styles: {
        font: hasMontserrat ? 'Montserrat' : undefined,
        fontSize: 9,
        cellPadding: 2,
        valign: 'middle',
        lineWidth: 0.2,
        lineColor: [0,0,0]
      },
      headStyles: { fillColor: [240,240,240], textColor: 0, lineWidth: 0.2, lineColor: [0,0,0] },
      alternateRowStyles: { fillColor: [250,250,250] },
      margin: { left: 14, right: 14 }
    });

    yAfter = doc.lastAutoTable.finalY + 8;

    const sumBody = aLastSummaryRows.map(r => [String(r.h), String(r.qty)]);
    doc.autoTable({
      head: [['Высота H(x), мм', 'Кол-во, шт']],
      body: sumBody,
      startY: yAfter,
      theme: 'grid',
      styles: {
        font: hasMontserrat ? 'Montserrat' : undefined,
        fontSize: 9,
        cellPadding: 2,
        halign: 'center',
        lineWidth: 0.2,
        lineColor: [0,0,0]
      },
      headStyles: { fillColor: [240,240,240], textColor: 0, lineWidth: 0.2, lineColor: [0,0,0] },
      alternateRowStyles: { fillColor: [250,250,250] },
      margin: { left: 14, right: 14 },
      tableWidth: 110
    });

    yAfter = doc.lastAutoTable.finalY + 8;

    const maxN = Math.max(aLastRow1?.length || 0, aLastRow2?.length || 0, 1);
    const rowsBody = [];
    for (let i = 0; i < maxN; i++){
      rowsBody.push([
        String(i + 1),
        aLastRow1?.[i] != null ? String(aLastRow1[i]) : '—',
        aLastRow2?.[i] != null ? String(aLastRow2[i]) : '—'
      ]);
    }

    doc.autoTable({
      head: [['№', 'Высота (ряд 1), мм', 'Высота (ряд 2), мм']],
      body: rowsBody,
      startY: yAfter,
      theme: 'grid',
      styles: {
        font: hasMontserrat ? 'Montserrat' : undefined,
        fontSize: 8.5,
        cellPadding: 2,
        halign: 'center',
        lineWidth: 0.2,
        lineColor: [0,0,0]
      },
      headStyles: { fillColor: [240,240,240], textColor: 0, lineWidth: 0.2, lineColor: [0,0,0] },
      alternateRowStyles: { fillColor: [250,250,250] },
      margin: { left: 14, right: 14 }
    });
  }

  doc.save('raschet-arochnyi-shtaketnik.pdf');
}

// события
[aSpan, aEdgeH, aCenterH, aGap].forEach(el => el && el.addEventListener('input', aReset));
if (aPlankW) aPlankW.addEventListener('change', aReset);
if (aChess) aChess.addEventListener('change', aReset);

if (aCalcBtn) aCalcBtn.addEventListener('click', aCalc);
if (aPdfBtn) aPdfBtn.addEventListener('click', downloadArchedPdf);



// ============================================================
// 4) ПОДСИСТЕМА НА ФАСАД (СТЕНЫ + ТАБЛИЦА + PDF)
// ============================================================
const fWallsWrap = document.getElementById('f_wallsWrap');
const fAddWallBtn = document.getElementById('f_addWallBtn');
const fCalcBtn = document.getElementById('f_calcBtn');
const fPdfBtn = document.getElementById('f_pdfBtn');
const fTableWrap = document.getElementById('f_tableWrap');
const fErr = document.getElementById('f_err');

let lastWallsData = null;
let lastWallsResult = null; // { profiles: number[], fixings: number[] }

if (fWallsWrap && fAddWallBtn && fCalcBtn && fPdfBtn && fTableWrap && fErr) {
  let wallIndex = 0;

  function updateWallTitles(){
    const walls = Array.from(fWallsWrap.querySelectorAll('.wall'));
    walls.forEach((w, i) => {
      const title = w.querySelector('.section-title');
      if (title) title.textContent = `Стена ${i + 1}`;
    });
  }

  function fReset(){
    fTableWrap.innerHTML = '';
    fErr.textContent = '';
    fPdfBtn.classList.add('hidden');
    lastWallsData = null;
    lastWallsResult = null;
  }

  function createWall(){
    wallIndex += 1;
    const div = document.createElement('div');
    div.className = 'wall';
    div.innerHTML = `
      <div class="section-header">
        <h3 class="section-title">Стена ${wallIndex}</h3>
        <button type="button" class="remove-section">Удалить</button>
      </div>

      <div class="grid3">
        <div class="field">
          <label>Вид обрешетки</label>
          <select class="f_kind">
            <option value="vertical">Вертикальный</option>
            <option value="horizontal">Горизонтальный</option>
          </select>
          <div class="hint">для вертикального сайдинга - горизонтальный; для горизонтального сайдинга - вертикальный</div>
        </div>

        <div class="field">
          <label>Высота стены (м)</label>
          <input class="f_h" type="number" value="0" min="0" step="0.01">
        </div>

        <div class="field">
          <label>Длина стены (м)</label>
          <input class="f_l" type="number" value="0" min="0" step="0.01">
        </div>
      </div>

      <div class="grid3">
        <div class="field">
          <label>Шаг между профилями (м)</label>
          <select class="f_stepProf">
            <option value="0.6">0,6</option>
            <option value="0.7">0,7</option>
            <option value="0.8">0,8</option>
          </select>
        </div>

        <div class="field">
          <label>Шаг между крепежами (м)</label>
          <select class="f_stepFix">
            <option value="0.8">0,8</option>
            <option value="0.9">0,9</option>
            <option value="1.0">1,0</option>
            <option value="1.1">1,1</option>
            <option value="1.2">1,2</option>
          </select>
        </div>

        <div></div>
      </div>
    `;

    // remove
    div.querySelector('.remove-section')?.addEventListener('click', () => {
      div.remove();
      updateWallTitles();
      fReset();
    });

    // reset output on changes
    div.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', fReset);
      el.addEventListener('change', fReset);
    });

    fWallsWrap.appendChild(div);
    updateWallTitles();
  }

  function getAllWallsData(){
    const walls = Array.from(fWallsWrap.querySelectorAll('.wall'));
    return walls.map(w => {
      const kind = w.querySelector('.f_kind')?.value || '';
      const h = Number((w.querySelector('.f_h')?.value || '').replace(',', '.'));
      const l = Number((w.querySelector('.f_l')?.value || '').replace(',', '.'));
      const stepProf = Number((w.querySelector('.f_stepProf')?.value || '').replace(',', '.'));
      const stepFix = Number((w.querySelector('.f_stepFix')?.value || '').replace(',', '.'));
      return { kind, h, l, stepProf, stepFix };
    });
  }

  function calcProfilesQty(w){
    // ВАЖНО: формулы — как в задаче. Округляем вверх до целых шт.
    const { kind, h, l, stepProf } = w;
    if (kind === 'vertical') {
      return Math.ceil((l / stepProf) * (h / 3));
    }
    // horizontal
    return Math.ceil((h / stepProf) * (l / 3));
  }

  function calcFixQty(w){
    // Принято: крепежи = (кол-во линий профиля) × (длина профиля / шаг крепежа)
    // Округляем вверх.
    const { kind, h, l, stepProf, stepFix } = w;
    const lines = (kind === 'vertical') ? (l / stepProf) : (h / stepProf);
    const profLen = (kind === 'vertical') ? h : l;
    return Math.ceil(lines * (profLen / stepFix));
  }

  function renderResultTable(res){
    const wallsCount = res.profiles.length;
    const head = ['Показатель'];
    for (let i = 0; i < wallsCount; i++) head.push(`Стена ${i + 1}`);

    const rowProfiles = ['Количество профилей (Г/П), 3м (шт)'];
    const rowFix = ['Количество крепежей (подвесы/КК), (шт)'];
    for (let i = 0; i < wallsCount; i++){
      rowProfiles.push(String(res.profiles[i] ?? '—'));
      rowFix.push(String(res.fixings[i] ?? '—'));
    }

    const body = [rowProfiles, rowFix];

    const thead = `<thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;

    fTableWrap.innerHTML = `
      <div class="table-wrap">
        <table class="small-table" style="min-width:${Math.max(520, 160 + wallsCount * 110)}px;">
          ${thead}
          ${tbody}
        </table>
      </div>
    `;
  }

  function fCalc(){
    fReset();
    const data = getAllWallsData();
    if (!data.length){
      fErr.textContent = 'Добавьте минимум одну стену';
      return;
    }

    for (let i = 0; i < data.length; i++){
      const w = data[i];
      if (!w.kind){ fErr.textContent = `Стена ${i + 1}: выберите вид обрешетки`; return; }
      if (!isFinite(w.h) || w.h <= 0){ fErr.textContent = `Стена ${i + 1}: высота должна быть > 0`; return; }
      if (!isFinite(w.l) || w.l <= 0){ fErr.textContent = `Стена ${i + 1}: длина должна быть > 0`; return; }
      if (!isFinite(w.stepProf) || w.stepProf <= 0){ fErr.textContent = `Стена ${i + 1}: шаг между профилями должен быть > 0`; return; }
      if (!isFinite(w.stepFix) || w.stepFix <= 0){ fErr.textContent = `Стена ${i + 1}: шаг между крепежами должен быть > 0`; return; }
    }

    const profiles = data.map(calcProfilesQty);
    const fixings = data.map(calcFixQty);
    const res = { profiles, fixings };

    renderResultTable(res);
    lastWallsData = data;
    lastWallsResult = res;
    fPdfBtn.classList.remove('hidden');
  }

  function downloadFacadeSubsysPdf(){
    if (!lastWallsData || !lastWallsResult) return;

    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) {
      fErr.textContent = 'PDF не может быть создан: jsPDF не загружен';
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // подключаем Montserrat
    let fontB64 = window.__PDF_FONT_MONTSERRAT__;
    if (!fontB64) {
      fErr.textContent = 'Не найден шрифт Montserrat (fonts.js)';
      return;
    }
    fontB64 = fontB64.replace(/\s+/g, '');
    doc.addFileToVFS('Montserrat-Regular.ttf', fontB64);
    doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
    doc.setFont('Montserrat', 'normal');
    doc.setFontSize(12);
    doc.text('Расчёт подсистемы на фасад', 14, 12);

    // ===== Вводные данные =====
    const inputHead = [[
      'Стена', 'Вид обрешетки', 'Высота, м', 'Длина, м', 'Шаг профилей, м', 'Шаг крепежей, м'
    ]];
    const inputBody = lastWallsData.map((w, i) => ([
      `Стена ${i + 1}`,
      w.kind === 'vertical' ? 'Вертикальный' : 'Горизонтальный',
      String(w.h).replace('.', ','),
      String(w.l).replace('.', ','),
      String(w.stepProf).replace('.', ','),
      String(w.stepFix).replace('.', ',')
    ]));

    doc.autoTable({
      head: inputHead,
      body: inputBody,
      startY: 16,
      theme: 'grid',
      styles: {
        font: 'Montserrat',
        fontSize: 8,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.2
      },
      headStyles: {
        font: 'Montserrat',
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        fontSize: 8
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 }
    });

    let y = doc.lastAutoTable.finalY + 8;

    // ===== Таблица расчёта =====
    const calcHead = [['Показатель', ...lastWallsResult.profiles.map((_, i) => `Стена ${i + 1}`)]];
    const calcBody = [
      ['Количество профилей (Г/П), 3м (шт)', ...lastWallsResult.profiles.map(x => String(x))],
      ['Количество крепежей (подвесы/КК), (шт)', ...lastWallsResult.fixings.map(x => String(x))]
    ];

    doc.autoTable({
      head: calcHead,
      body: calcBody,
      startY: y,
      theme: 'grid',
      styles: {
        font: 'Montserrat',
        fontSize: 8,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.2
      },
      headStyles: {
        font: 'Montserrat',
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        fontSize: 8
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;

    // ===== Спецификация (итого) =====
    const totalProfiles = lastWallsResult.profiles.reduce((a,b) => a + (Number(b) || 0), 0);
    const totalFix = lastWallsResult.fixings.reduce((a,b) => a + (Number(b) || 0), 0);
    const specHead = [['Позиция', 'Ед. изм.', 'Кол-во']];
    const specBody = [
      ['Профиль (Г/П), 3м', 'шт', String(totalProfiles)],
      ['Крепежи (подвесы/КК)', 'шт', String(totalFix)]
    ];

    doc.autoTable({
      head: specHead,
      body: specBody,
      startY: y,
      theme: 'grid',
      styles: {
        font: 'Montserrat',
        fontSize: 9,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.2
      },
      headStyles: {
        font: 'Montserrat',
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        fontSize: 9
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 14, right: 14 },
      tableWidth: 150
    });

    doc.save('raschet-podsistema-fasad.pdf');
  }

  // первая стена при загрузке
  createWall();

  // события
  fAddWallBtn.addEventListener('click', () => createWall());
  fCalcBtn.addEventListener('click', fCalc);
  fPdfBtn.addEventListener('click', downloadFacadeSubsysPdf);
}

// ============================================================
// 5) КАЛЬКУЛЯТОР ВОДОСТОЧНОЙ СИСТЕМЫ
// ============================================================
const g = (id) => document.getElementById(id);

const gType = g('g_type');
const gMetalWrap = g('g_metal_brand_wrap');
const gPlasticWrap = g('g_plastic_brand_wrap');

const gMetalBrand = g('g_metal_brand');
const gPlasticBrand = g('g_plastic_brand');

const gRoofMounted = g('g_roof_mounted');
const gHeight = g('g_height');
const gLength = g('g_length');
const gOverhang = g('g_overhang');

const gRoofTypeInput = g('g_roof_type');
const gRoofPicks = g('g_roof_picks');
const gOtherWrap = g('g_other_wrap');

const gContour = g('g_contour');
const gOpenWrap = g('g_open_wrap');
const gOpenEnds = g('g_open_ends');

const gExtAngles = g('g_ext_angles');
const gIntAngles = g('g_int_angles');

const gCalcBtn = g('g_calcBtn');
const gTableWrap = g('g_tableWrap');
const gErr = g('g_err');

function gCeil(x){
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.ceil(n);
}

function gRound2(x){
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function gRenderType(){
  if (!gType || !gMetalWrap || !gPlasticWrap) return;
  const isMetal = gType.value === 'metal';
  gMetalWrap.classList.toggle('hidden', !isMetal);
  gPlasticWrap.classList.toggle('hidden', isMetal);
}

function gSetActiveRoof(value){
  if (!gRoofTypeInput || !gRoofPicks || !gOtherWrap) return;
  gRoofTypeInput.value = value;

  const btns = gRoofPicks.querySelectorAll('.roof-btn');
  btns.forEach(b => b.classList.toggle('active', b.dataset.value === value));

  const isOther = value === 'other';
  gOtherWrap.classList.toggle('hidden', !isOther);
  if (isOther && gContour && gOpenWrap){
    gOpenWrap.classList.toggle('hidden', gContour.value !== 'no');
  }
}

function gRoofDefaults(){
  const t = gRoofTypeInput?.value || 'single';
  if (t === 'single') return { open: 2, ext: 0, intr: 0 };
  if (t === 'double') return { open: 4, ext: 0, intr: 0 };
  if (t === 'mansard') return { open: 4, ext: 0, intr: 0 };
  if (t === 'hip') return { open: 0, ext: 4, intr: 0 };
  if (t === 'tent') return { open: 0, ext: 4, intr: 0 };
  return { open: 0, ext: 0, intr: 0 };
}

function gGetAnglesAndEnds(){
  const t = gRoofTypeInput?.value || 'single';
  const def = gRoofDefaults();

  let openEnds = def.open;
  let ext = def.ext;
  let intr = def.intr;

  if (t === 'other'){
    const contourNo = (gContour?.value === 'no');
    if (contourNo){
      const v = Number(gOpenEnds?.value);
      if (isFinite(v) && v > 0) openEnds = v;
      else openEnds = 0;
    } else {
      openEnds = 0;
    }

    const ev = Number(gExtAngles?.value);
    if (isFinite(ev) && ev > 0) ext = ev;

    const iv = Number(gIntAngles?.value);
    if (isFinite(iv) && iv > 0) intr = iv;
  }

  return { openEnds, ext, intr };
}

function gRenderTable(rows){
  if (!gTableWrap) return;
  const html = `
    <div class="table-wrap">
      <table class="small-table">
        <thead><tr><th>Элемент</th><th>Кол-во</th></tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
  gTableWrap.innerHTML = html;
}

function gCalc(){
  if (!gErr || !gLength || !gHeight || !gType) return;

  gErr.textContent = '';
  if (gTableWrap) gTableWrap.innerHTML = '';

  const L = Number(gLength.value);
  const H = Number(gHeight.value);

  if (!isFinite(L) || L <= 0){
    gErr.textContent = 'Введите длину по карнизу (м) больше 0';
    return;
  }
  if (!isFinite(H) || H <= 0){
    gErr.textContent = 'Введите высоту от земли до карниза (м) больше 0';
    return;
  }

  // свес пока не используется в формулах, но валидируем
  const O = Number(gOverhang?.value || 0);
  if (!isFinite(O) || O < 0){
    gErr.textContent = 'Длина карнизного свеса должна быть >= 0';
    return;
  }

  const gutters = gCeil(L / 3) + 1;
  const holders = gCeil(L / 0.6);
  const funnels = gCeil(L / 8);

  const { openEnds, ext, intr } = gGetAnglesAndEnds();

  const roofMountedYes = (gRoofMounted?.value === 'yes');

  const isMetal = gType.value === 'metal';
  const metalBrand = gMetalBrand?.value || 'nika';
  const plasticBrand = gPlasticBrand?.value || 'docke_premium';

  const rows = [];

  // helpers
  const push = (name, qty) => {
    const q = Number(qty);
    if (!isFinite(q)) return;
    if (q <= 0) return;
    rows.push([name, q]);
  };

  if (isMetal){
    if (metalBrand === 'nika'){
      push('Желоб прямоугольный 3м', gutters);
      push('Держатель желоба', holders);
      if (roofMountedYes) push('Держатель желоба короткий', holders);

      // заглушки по открытым концам (левая/правая — суммарно = openEnds)
      push('Заглушка желоба (левая/правая)', openEnds);

      if (ext > 0) push('Угол желоба (внешний) 90°', ext);
      if (intr > 0) push('Угол желоба (внутренний) 90°', intr);

      push('Воронка выпускная', funnels);
      push('Колено трубы', funnels * 2);
      push('Колено трубы боковое', funnels * 2);

      // трубы по Excel-логике (как в ТЗ) — реализуем через интервалы
      const B20 = funnels;

      // Труба 3м
      let pipe3 = null;
      if (H > 3 && H <= 4) pipe3 = 1 * B20;
      else if (H > 4 && H <= 6) pipe3 = 1 * B20;
      else if (H > 6 && H <= 7) pipe3 = 2 * B20;
      else if (H > 7 && H <= 8) pipe3 = 1 * B20;
      else if (H > 8 && H <= 9) pipe3 = 2 * B20;
      else if (H > 9 && H <= 10) pipe3 = 3 * B20;

      // Труба 2м
      let pipe2 = null;
      if (H > 3 && H <= 5) pipe2 = 1 * B20;
      else if (H > 7 && H <= 8) pipe2 = 1 * B20;

      // Труба 1м (соединение)
      const pipe1 = B20;

      // труба с коленом 3м
      let pipeKnee3 = null;
      if (H > 4 && H <= 5) pipeKnee3 = 1 * B20;
      else if (H > 5 && H <= 6) pipeKnee3 = 1 * B20;
      else if (H > 7 && H <= 8) pipeKnee3 = 1 * B20;
      else if (H > 8 && H <= 9) pipeKnee3 = 1 * B20;

      // труба с коленом 1м
      let pipeKnee1 = null;
      if (H > 3 && H <= 4) pipeKnee1 = 1 * B20;
      else if (H > 6 && H <= 7) pipeKnee1 = 1 * B20;
      else if (H > 9 && H <= 10) pipeKnee1 = 1 * B20;

      if (pipe3) push('Труба водосточная 3 м', pipe3);
      if (pipe2) push('Труба водосточная 2 м', pipe2);
      push('Труба водосточная 1 м (соединение м/д колен)', pipe1);
      if (pipeKnee3) push('Труба водосточная с коленом 3м', pipeKnee3);
      if (pipeKnee1) push('Труба водосточная с коленом 1м', pipeKnee1);

      // держатели трубы: 3 шт на каждые 3 метра (округляем вверх по общей высоте)
      const holdersPipe = gCeil(H / 3) * 3 * B20;
      push('Держатель трубы', holdersPipe);
    } else {
      // Grand Line Optima
      push('Желоб полукруглый 3м', gutters);
      push('Соединитель желоба', Math.max(0, gutters - 1));
      if (roofMountedYes) push('Крюк короткий', holders);
      push('Крюк длинный', holders);

      push('Заглушка торцевая универсальная', openEnds);

      if (intr > 0) push('Угол желоба внутренний 90°', intr);
      if (ext > 0) push('Угол желоба внешний 90°', ext);

      push('Воронка', funnels);
      push('Колено 60°', funnels * 2);

      // трубы: funnels * H/3
      push('Труба круглая 3 м', gCeil((H * funnels) / 3));
      const pipes = gCeil((H * funnels) / 3);
      push('Кронштейн трубы на кирпич', pipes * 2);
      push('Труба круглая соединительная', funnels);
      push('Колено стока', funnels);
    }
  } else {
    // plastic: Docke Premium / Docke Lux (same) / Bryza
    if (plasticBrand === 'docke_premium' || plasticBrand === 'docke_lux'){
      push('Желоб водосточный 3м', gutters);
      push('Соединитель желобов', Math.max(0, gutters - 1));
      if (roofMountedYes) push('Кронштейн желоба', holders);
      push('Кронштейн желоба металлический', holders);
      push('Заглушка желоба', openEnds);
      if (ext > 0) push('Элемент угловой 90°', ext);

      push('Воронка/приемник воды', funnels);
      push('Колено 45°/72°', funnels * 2);

      const pipes = gCeil((H * funnels) / 3);
      push('Труба водосточная 3 м', pipes);

      push('Хомут универсальный', pipes * 2);
      push('Шпилька специальная с гайкой ZN', pipes * 2);

      push('Труба водосточная 1 м', funnels);

      // Муфта соединительная: Excel-логика
      let mufta = null;
      if (H <= 1) mufta = funnels;
      else if (H > 3 && H < 7) mufta = funnels;
      else if (H >= 7) mufta = funnels * 2;
      if (mufta) push('Муфта соединительная', mufta);

      push('Наконечник', funnels);
    } else {
      // BRYZA
      push('Желоб 3м', gutters);
      push('Муфта желоба (соединитель)', Math.max(0, gutters - 1));
      if (roofMountedYes) push('Держатель желоба', holders);
      push('Держатель желоба металл', holders);

      // заглушки: правая/левая
      // для типовых крыш: 1/2/2; для other: openEnds/2
      const t = gRoofTypeInput?.value || 'single';
      let half = 0;
      if (t === 'single') half = 1;
      else if (t === 'double' || t === 'mansard') half = 2;
      else if (t === 'other') half = gCeil(openEnds / 2);

      if (half > 0){
        push('Заглушка желоба правая', half);
        push('Заглушка желоба левая', half);
      }

      if (intr > 0) push('Угловой элемент внутренний', intr);
      if (ext > 0) push('Угловой элемент внешний', ext);

      push('Сливная воронка', funnels);
      push('Колено 67,5°', funnels * 2);

      const pipes = gCeil((H * funnels) / 3);
      push('Водосточная труба 3м', pipes);

      // Соединитель трубы (Excel-логика как Docke)
      let conn = null;
      if (H <= 1) conn = funnels;
      else if (H > 3 && H < 7) conn = funnels;
      else if (H >= 7) conn = funnels * 2;
      if (conn) push('Соединитель водосточной трубы', conn);

      push('Хомут', pipes * 2);
      push('Крюк хомута (металл)', pipes * 2);
    }
  }

  if (!rows.length){
    gErr.textContent = 'Нет элементов для вывода (проверьте вводные данные)';
    return;
  }

  gRenderTable(rows);
}

// events
gType?.addEventListener('change', () => { gRenderType(); if (gErr) gErr.textContent=''; });
gMetalBrand?.addEventListener('change', () => { if (gErr) gErr.textContent=''; });
gPlasticBrand?.addEventListener('change', () => { if (gErr) gErr.textContent=''; });

gContour?.addEventListener('change', () => {
  if (gRoofTypeInput?.value === 'other'){
    gOpenWrap?.classList.toggle('hidden', gContour.value !== 'no');
  }
  if (gErr) gErr.textContent = '';
});

gRoofPicks?.addEventListener('click', (e) => {
  const btn = e.target.closest('.roof-btn');
  if (!btn) return;
  gSetActiveRoof(btn.dataset.value);
  if (gErr) gErr.textContent = '';
});

[gRoofMounted, gHeight, gLength, gOverhang, gOpenEnds, gExtAngles, gIntAngles].forEach(el => {
  el?.addEventListener('input', () => { if (gErr) gErr.textContent=''; });
  el?.addEventListener('change', () => { if (gErr) gErr.textContent=''; });
});

gCalcBtn?.addEventListener('click', gCalc);

// init
gRenderType();
gSetActiveRoof(gRoofTypeInput?.value || 'single');


// =====================
// 6) Калькулятор софитов
// =====================
const sMaterial = document.getElementById('s_material');
const sOverhang = document.getElementById('s_overhang');
const sLength = document.getElementById('s_length');

const sTrimP = document.getElementById('s_trim_p');
const sTrimJ = document.getElementById('s_trim_j');
const sTrimFacia = document.getElementById('s_trim_facia');
const sTrimCorner = document.getElementById('s_trim_corner');

const sCalcBtn = document.getElementById('s_calc');
const sPdfBtn = document.getElementById('s_pdf');
const sRes = document.getElementById('s_result');
const sErr = document.getElementById('s_err');

let sLast = null;

const SOFFIT_WIDTHS_MM = {
  c8: { overall: 1200, work: 1150 },
  soffit_lb_perfor: { overall: 264, work: 241 },
  lb: { overall: 264, work: 240 },
  evrobrus: { overall: 359, work: 340 }
};

function sReset(){
  if (sErr) sErr.textContent = '';
  if (sRes) sRes.innerHTML = '';
  sLast = null;
  sPdfBtn?.classList.add('hidden');
}

function sFmt(n, digits = 2){
  if (!isFinite(n)) return '—';
  return Number(n.toFixed(digits)).toString().replace('.', ',');
}

function sMaterialName(key){
  if (key === 'c8') return 'Профнастил С8';
  if (key === 'soffit_lb_perfor') return 'Софит Л-брус перфорированный';
  if (key === 'lb') return 'Л-брус';
  if (key === 'evrobrus') return 'Евробрус';
  return key;
}

function sCalc(){
  sReset();

  const mat = sMaterial?.value || '';
  const overhang = Number((sOverhang?.value || '').toString().replace(',', '.'));
  const length = Number((sLength?.value || '').toString().replace(',', '.'));

  if (!mat || !SOFFIT_WIDTHS_MM[mat]) { if (sErr) sErr.textContent = 'Выберите материал'; return; }
  if (!isFinite(overhang) || overhang <= 0) { if (sErr) sErr.textContent = 'Введите длину карнизного свеса (м) > 0'; return; }
  if (!isFinite(length) || length <= 0) { if (sErr) sErr.textContent = 'Введите длину по карнизу (м) > 0'; return; }

  const w = SOFFIT_WIDTHS_MM[mat];
  const workWm = w.work / 1000;

  const sheetsQtyRaw = length / workWm;
  const sheetsQty = Math.ceil(sheetsQtyRaw);

  const selectedTrims = [];
  if (sTrimP?.checked) selectedTrims.push('П‑планка завершающая');
  if (sTrimJ?.checked) selectedTrims.push('J‑планка');
  if (sTrimFacia?.checked) selectedTrims.push('Лобовая планка');
  if (sTrimCorner?.checked) selectedTrims.push('Планка угла внешнего сложная');

  const TRIM_LEN = 2;
  const trimQtyRaw = length / (TRIM_LEN - 0.1);
  const trimQty = Math.ceil(trimQtyRaw);

  const rows = [];
  const matName = sMaterialName(mat);
  rows.push([matName, `${sheetsQty} шт`, `${sFmt(overhang)} м`]);
  selectedTrims.forEach(name => rows.push([name, `${trimQty} шт`, '2 м']));

  const table = `
    <table class="mp-table">
      <thead><tr><th>Материал</th><th>Кол-во</th><th>Длина, м</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
  if (sRes) sRes.innerHTML = table;

  sLast = {
    inputs: { material: mat, overhang, length, trims: selectedTrims },
    widths: w,
    sheetsQty,
    trimQty
  };
  sPdfBtn?.classList.remove('hidden');
}

function downloadSoffitPdf(){
  if (!sLast) return;
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) { if (sErr) sErr.textContent = 'PDF не может быть создан: jsPDF не загружен'; return; }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Montserrat (если есть fonts.js)
  const fontB64 = window.__PDF_FONT_MONTSERRAT__;
  const hasMontserrat = !!fontB64;
  if (hasMontserrat) {
    try {
      const clean = String(fontB64).replace(/\s+/g, '');
      doc.addFileToVFS('Montserrat-Regular.ttf', clean);
      doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
      doc.setFont('Montserrat', 'normal');
    } catch(e) {}
  }

  doc.setFontSize(14);
  doc.text('Расчёт софитов', 14, 14);

  const inp = sLast.inputs;
  const info = [
    ['Материал', sMaterialName(inp.material)],
    ['Длина карнизного свеса, м', sFmt(inp.overhang)],
    ['Длина по карнизу, м', sFmt(inp.length)],
    ['Доборные элементы', inp.trims.length ? inp.trims.join(', ') : '—']
  ];

  let y = 18;
  if (doc.autoTable) {
    doc.autoTable({
      head: [['Параметр', 'Значение']],
      body: info,
      startY: y,
      theme: 'grid',
      styles: {
        font: hasMontserrat ? 'Montserrat' : undefined,
        fontSize: 9,
        cellPadding: 2,
        lineWidth: 0.2,
        lineColor: [0,0,0]
      },
      headStyles: { fillColor: [240,240,240], textColor: 0, lineWidth: 0.2, lineColor: [0,0,0] },
      alternateRowStyles: { fillColor: [250,250,250] },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;

    const w = sLast.widths;
    const matName = sMaterialName(inp.material);
    const resRows = [
      [matName, `${sLast.sheetsQty} шт`, `${sFmt(inp.overhang)} м`],
      ...inp.trims.map(t => [t, `${sLast.trimQty} шт`, '2 м' ])
    ];

    doc.autoTable({
      head: [['Материал', 'Кол-во', 'Длина, м']],
      body: resRows,
      startY: y,
      theme: 'grid',
      styles: {
        font: hasMontserrat ? 'Montserrat' : undefined,
        fontSize: 9,
        cellPadding: 2,
        lineWidth: 0.2,
        lineColor: [0,0,0]
      },
      headStyles: { fillColor: [240,240,240], textColor: 0, lineWidth: 0.2, lineColor: [0,0,0] },
      alternateRowStyles: { fillColor: [250,250,250] },
      margin: { left: 14, right: 14 }
    });
  }

  doc.save('raschet-sofitov.pdf');
}

[sMaterial, sOverhang, sLength, sTrimP, sTrimJ, sTrimFacia, sTrimCorner].forEach(el => {
  el?.addEventListener('input', sReset);
  el?.addEventListener('change', sReset);


  // ============================================================
  // 7) ОСНОВНОЙ КАЛЬКУЛЯТОР ПРОДУКЦИИ (Кровля/Забор/Фасад)
  // ============================================================
  const mpType = document.getElementById('mp_type');
  const mpRoof = document.getElementById('mp_roof');
  const mpFence = document.getElementById('mp_fence');
  const mpFacade = document.getElementById('mp_facade');

  // --- справочники ширины (мм) ---
  const WIDTH_WORK_MM = {
    // Профнастил (кровля/забор/фасад)
    'С8': 1150,
    'НС16': 1100,
    'С20': 1100,
    'К20': 1130,
    'С21': 1000,
    'НС35': 1000,
    'Н60': 845,
    'Н75': 750,

    // Фальц
    'Двойной стоячий': 550,

    // Металлочерепица (по вашим размерам)
    'Супермонтеррей/Феникс': 1100,
    'Геркулес/Орион': 1150,
    'Каскад/Пегас': 1130,
    // Дюна/Лира: рабочая ширина часто 1040 мм (см. тех.описания профиля «Дюна»)
    'Дюна/Лира': 1040,

    // Сайдинг
    'Корабельная доска': 236,
    'Евробрус': 340,
    'Блок-хаус': 355,
    'Л-брус': 240,
    'ЛайнПро': 176,

    // Штакетник (ширина планки)
    'Европланка': 126,
    'Евротрапеция': 117,
    'Европланка Престиж': 131,
    'М-образный Престиж': 118,
  };

  // --- общая (полная) ширина (мм) ---
  const WIDTH_TOTAL_MM = {
    // Профнастил
    'С8': 1200,
    'НС16': 1150,
    'С20': 1150,
    'К20': 1195,
    'С21': 1051,
    'НС35': 1060,
    'Н60': 902,
    'Н75': 800,

    // Фальц
    'Двойной стоячий': 562,

    // Металлочерепица
    'Супермонтеррей/Феникс': 1180,
    'Геркулес/Орион': 1200,
    'Каскад/Пегас': 1195,
    'Дюна/Лира': 1180,

    // Сайдинг
    'Корабельная доска': 267,
    'Евробрус': 359,
    'Блок-хаус': 383,
    'Л-брус': 264,
    'ЛайнПро': 200,

    // Штакетник
    'Европланка': 126,
    'Евротрапеция': 117,
    'Европланка Престиж': 131,
    'М-образный Престиж': 118,
  };


  const ROOF_PROFILES = {
    profnastil: ['К20','С20','С21','НС35','Н60','Н75'],
    tile: ['Супермонтеррей/Феникс','Геркулес/Орион','Каскад/Пегас','Дюна/Лира'],
    falz: ['Двойной стоячий'],
  };

  const FENCE_PROFILES = {
    profnastil: ['С8','НС16','К20','С20','С21'],
    shtaketnik: ['Европланка','Евротрапеция','Европланка Престиж','М-образный Престиж'],
  };

  const FACADE_PROFILES = {
    profnastil: ['С8','НС16'],
    siding: ['Корабельная доска','Евробрус','Блок-хаус','Л-брус','ЛайнПро'],
  };

  function n(v){
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  function ceil(v){ return Math.ceil(v - 1e-9); }
  function fmt(v, d=2){
    const x = Number(v);
    if (!Number.isFinite(x)) return '—';
    return x.toFixed(d).replace('.', ',');
  }
  function fmtInt(v){
    const x = Number(v);
    if (!Number.isFinite(x)) return '—';
    return String(Math.round(x));
  }
  function workWidthM(key){
    const mm = WIDTH_WORK_MM[key];
    return mm ? (mm/1000) : 0;
  }
  function totalWidthM(key){
    const mm = WIDTH_TOTAL_MM[key];
    return mm ? (mm/1000) : 0;
  }

  // --- переключение типа расчёта ---
  function mpShowBlock(){
    const t = mpType?.value || '';
    mpRoof?.classList.toggle('hidden', t !== 'roof');
    mpFence?.classList.toggle('hidden', t !== 'fence');
    mpFacade?.classList.toggle('hidden', t !== 'facade');
  }
  mpType?.addEventListener('change', mpShowBlock);
  mpShowBlock();

  // ===================== КРОВЛЯ =====================
  const rRidge = document.getElementById('r_ridge');
  const rSlopeLen = document.getElementById('r_slopeLen');
  const rSlopes = document.getElementById('r_slopes');
  const rMaterial = document.getElementById('r_material');
  const rProfileWrap = document.getElementById('r_profile_wrap');
  const rProfile = document.getElementById('r_profile');
  const rPrice = document.getElementById('r_price');
  const rAddTrims = document.getElementById('r_addTrims');
  const rTrims = document.getElementById('r_trims');
  const rTrimLen = document.getElementById('r_trimLen');
  const rCalcBtn = document.getElementById('r_calc');
  const rSplitBtn = document.getElementById('r_split');
  const rPdfBtn = document.getElementById('r_pdf');
  const rResult = document.getElementById('r_result');
  const rErr = document.getElementById('r_err');

  let roofLast = null;
  let roofSplit = false;

  function fillSelect(sel, items, placeholder='— выберите —'){
    if (!sel) return;
    sel.innerHTML = `<option value="">${placeholder}</option>` + items.map(x=>`<option value="${x}">${x}</option>`).join('');
  }

  function roofRenderProfile(){
    const mat = rMaterial?.value;
    const list = ROOF_PROFILES[mat] || [];
    rProfileWrap?.classList.toggle('hidden', !mat);
    fillSelect(rProfile, list);
  }
  rMaterial?.addEventListener('change', () => {
    roofRenderProfile();
    rErr.textContent='';
    roofSplit = false;
    rSplitBtn?.classList.add('hidden');
    rPdfBtn?.classList.add('hidden');
    rResult.innerHTML='';
  });
  roofRenderProfile();

  rAddTrims?.addEventListener('click', () => {
    rTrims?.classList.toggle('hidden');
  });

  function roofCompute(){
    const ridge = n(rRidge?.value);
    const slope = n(rSlopeLen?.value);
    const slopes = n(rSlopes?.value || 1);
    const mat = rMaterial?.value || '';
    const prof = rProfile?.value || '';
    const price = n(rPrice?.value);
    const w = workWidthM(prof);

    if (!(ridge>0) || !(slope>0) || !(slopes===1 || slopes===2)) return {err:'Заполните длину по коньку, длину ската и количество скатов.'};
    if (!mat || !prof) return {err:'Выберите материал и профиль.'};
    if (!(w>0)) return {err:'Не найдена рабочая ширина для выбранного профиля.'};

    const sheetsPerSlope = ceil(ridge / w);
    const sheets = sheetsPerSlope * slopes;
    const area = ridge * slope * slopes;
    const tw = totalWidthM(prof);
    // стоимость: кол-во листов * общая ширина * длина листа * цена (₽/м²)
    const sum = (price>0 && tw>0) ? (sheets * tw * slope * price) : null;

    // доборы
    const trimsOn = rTrims && !rTrims.classList.contains('hidden');
    let trims = null;
    if (trimsOn){
      const L = n(rTrimLen?.value);
      const eff = Math.max(0.1, L - 0.1);
      const ridgeQty = ceil(ridge / eff);
      const endFactor = slopes===1 ? 2 : 4;
      const eaveFactor = slopes===1 ? 1 : 2;
      const gableQty = ceil((slope * endFactor) / eff);
      const eaveQty = ceil((ridge * eaveFactor) / eff);
      trims = {
        len: L,
        eff,
        items: [
          {name:'Конёк', qty: ridgeQty, len: L},
          {name:'Торцевая планка', qty: gableQty, len: L},
          {name:'Карнизная планка', qty: eaveQty, len: L},
        ]
      };
    }

    return {ridge,slope,slopes,mat,prof,w,sheetsPerSlope,sheets,area,sum,trims};
  }

  function roofRender(data){
    if (!rResult) return;
    const lines = [];
    lines.push(`<div class="mp-summary"><b>Профиль:</b> ${data.prof} (раб. ширина ${fmt(data.w,3)} м)</div>`);
    // Кол-во листов
    if (!roofSplit){
      lines.push(`<div class="mp-summary"><b>Количество листов:</b> ${fmtInt(data.sheets)} шт</div>`);
    } else {
      lines.push(`<div class="mp-summary"><b>Количество листов (верхний ряд):</b> ${fmtInt(data.sheets)} шт</div>`);
      lines.push(`<div class="mp-summary"><b>Количество листов (нижний ряд):</b> ${fmtInt(data.sheets)} шт</div>`);
    }

    if (!roofSplit){
      lines.push(`<div class="mp-summary"><b>Длина листов:</b> ${fmt(data.slope)} м</div>`);
    } else {
      const half = data.slope/2;
      const top = half + 0.15;
      const bottom = half;
      lines.push(`<div class="mp-summary"><b>Длина листов (разделение с нахлёстом 15 см):</b> верхний ${fmt(top)} м, нижний ${fmt(bottom)} м</div>`);
    }

    lines.push(`<div class="mp-summary"><b>Площадь:</b> ${fmt(data.area)} м²</div>`);
    if (data.sum!==null) lines.push(`<div class="mp-summary"><b>Стоимость:</b> ${fmt(data.sum,0)} ₽</div>`);

    if (data.trims){
      const rows = data.trims.items.map(it => `<tr><td>${it.name}</td><td>${fmtInt(it.qty)} шт</td><td>${fmt(it.len,0)} м</td></tr>`).join('');
      lines.push(`
        <div style="margin-top:10px;"><b>Доборные элементы</b></div>
        <table class="mp-table">
          <thead><tr><th>Элемент</th><th>Кол-во</th><th>Длина</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `);
    }

    rResult.innerHTML = lines.join('<br>');
  }

  function roofCalc(){
    rErr.textContent='';
    const data = roofCompute();
    if (data.err){ rErr.textContent=data.err; return; }
    roofLast = data;
    roofSplit = false;
    roofRender(data);
    rSplitBtn?.classList.remove('hidden');
    rPdfBtn?.classList.remove('hidden');
  }
  rCalcBtn?.addEventListener('click', roofCalc);

  rSplitBtn?.addEventListener('click', () => {
    if (!roofLast) return;
    roofSplit = true;
    roofRender(roofLast);
  });

  function pdfDoc(){
    const jsPDF = window.jspdf?.jsPDF;
    return jsPDF ? new jsPDF({orientation:'portrait', unit:'mm', format:'a4'}) : null;
  }

  function pdfSetFont(doc){
    // Используем тот же шрифт, что и в других калькуляторах, если доступен
    try{
      let fontB64 = window.__PDF_FONT_MONTSERRAT__;
      if (fontB64){
        fontB64 = fontB64.replace(/\s+/g,'');
        doc.addFileToVFS('Montserrat-Regular.ttf', fontB64);
        doc.addFont('Montserrat-Regular.ttf','Montserrat','normal');
        doc.setFont('Montserrat','normal');
      }
    }catch(e){}
  }

  function downloadRoofPdf(){
    if (!roofLast) return;
    const doc = pdfDoc();
    if (!doc){ rErr.textContent='PDF не может быть создан: jsPDF не загружен'; return; }
    pdfSetFont(doc);
    doc.setFontSize(14);
    doc.text('Расчёт кровли', 14, 14);
    doc.setFontSize(11);

    const y0 = 24;
    let y = y0;
    const add = (label, value) => { doc.text(`${label}: ${value}`, 14, y); y += 7; };

    add('Профиль', `${roofLast.prof} (раб. ширина ${fmt(roofLast.w,3)} м)`);
    add('Длина по коньку', `${fmt(roofLast.ridge)} м`);
    add('Длина ската', `${fmt(roofLast.slope)} м`);
    add('Количество скатов', `${roofLast.slopes}`);
    add('Материал', roofLast.mat==='profnastil' ? 'Профнастил' : (roofLast.mat==='tile' ? 'Металлочерепица' : 'Фальц'));
    if (roofLast.sum!==null) add('Цена', `${fmt(n(document.getElementById('r_price')?.value),0)} ₽/м²`);
    if (!roofSplit){
      add('Количество листов', `${fmtInt(roofLast.sheets)} шт`);
    } else {
      add('Количество листов (верх)', `${fmtInt(roofLast.sheets)} шт`);
      add('Количество листов (низ)', `${fmtInt(roofLast.sheets)} шт`);
    }
    add('Площадь', `${fmt(roofLast.area)} м²`);
    if (roofLast.sum!==null) add('Стоимость', `${fmt(roofLast.sum,0)} ₽`);

    if (roofSplit){
      const half = roofLast.slope/2;
      add('Разделение ската', `верх ${fmt(half+0.15)} м, низ ${fmt(half)} м (нахлёст 0,15 м)`);
    }

    if (roofLast.trims && doc.autoTable){
      y += 2;
      doc.autoTable({
        startY: y,
        head: [['Доборный элемент','Кол-во, шт','Длина, м']],
        body: roofLast.trims.items.map(it=>[it.name, String(it.qty), String(it.len)]),
        theme: 'grid',
        styles: {font: (doc.getFont().fontName || 'helvetica'), fontSize: 9, cellPadding: 2},
        headStyles: {fillColor: [230,230,230]}
      });
    }

    doc.save('roof_calc.pdf');
  }
  rPdfBtn?.addEventListener('click', downloadRoofPdf);

  // ===================== ЗАБОР =====================
  const fLenWrap = document.getElementById('f_len_wrap');
  const fAreaWrap = document.getElementById('f_area_wrap');
  const fLength = document.getElementById('f_length');
  const fArea = document.getElementById('f_area');
  const fHeight = document.getElementById('f_height');
  const fMaterial = document.getElementById('f_material');
  const fProfileWrap = document.getElementById('f_profile_wrap');
  const fProfile = document.getElementById('f_profile');
  const fPriceM2Wrap = document.getElementById('f_price_m2_wrap');
  const fPriceM2 = document.getElementById('f_price_m2');
  const fGapWrap = document.getElementById('f_gap_wrap');
  const fGap = document.getElementById('f_gap');
  const fPriceLmWrap = document.getElementById('f_price_lm_wrap');
  const fPriceLm = document.getElementById('f_price_lm');
  const fUseArea = document.getElementById('f_useArea');
  const fPipes = document.getElementById('f_pipes');
  const fPipesBlock = document.getElementById('f_pipes_block');
  const fDepth = document.getElementById('f_depth');
  const fStep = document.getElementById('f_step');
  const fLags = document.getElementById('f_lags');
  const fPipeSize = document.getElementById('f_pipeSize');
  const fCaps = document.getElementById('f_caps');
  const fScrews = document.getElementById('f_screws');
  const fCalcBtn = document.getElementById('f_calc');
  const fPdfBtn = document.getElementById('f_pdf');
  const fResult = document.getElementById('f_result');
  const fErr = document.getElementById('f_err');

  let fenceLast = null;

  function fenceRenderFields(){
    const mat = fMaterial?.value || '';
    fProfileWrap?.classList.toggle('hidden', !mat);
    fillSelect(fProfile, (FENCE_PROFILES[mat]||[]));

    const isProf = mat==='profnastil';
    const isSht = mat==='shtaketnik';
    fPriceM2Wrap?.classList.toggle('hidden', !isProf);
    fGapWrap?.classList.toggle('hidden', !isSht);
    fPriceLmWrap?.classList.toggle('hidden', !isSht);
  }
  fMaterial?.addEventListener('change', () => { fenceRenderFields(); fErr.textContent=''; fResult.innerHTML=''; fPdfBtn.classList.add('hidden'); });
  fenceRenderFields();

  function fenceToggleLengthMode(){
    const useArea = !!fUseArea?.checked;
    fLenWrap?.classList.toggle('hidden', useArea);
    fAreaWrap?.classList.toggle('hidden', !useArea);
  }
  fUseArea?.addEventListener('change', fenceToggleLengthMode);
  fenceToggleLengthMode();

  fPipes?.addEventListener('change', () => {
    fPipesBlock?.classList.toggle('hidden', !fPipes.checked);
  });

  function fenceCompute(){
    const useArea = !!fUseArea?.checked;
    let length = useArea ? 0 : n(fLength?.value);
    const areaSot = useArea ? n(fArea?.value) : 0;
    const height = n(fHeight?.value);
    const mat = fMaterial?.value || '';
    const prof = fProfile?.value || '';

    if (useArea){
      if (!(areaSot>0)) return {err:'Укажите площадь участка (сот).'};
      length = 4 * Math.sqrt(areaSot * 100);
    }

    if (!(length>0) || !(height>0)) return {err:'Укажите длину и высоту забора.'};
    if (!mat || !prof) return {err:'Выберите материал и профиль.'};

    let sheets = 0;
    let unitCost = null;
    let sum = null;

    if (mat==='profnastil'){
      const w = workWidthM(prof);
      const tw = totalWidthM(prof);
      if (!(w>0)) return {err:'Не найдена рабочая ширина для профнастила.'};
      if (!(tw>0)) return {err:'Не найдена общая ширина для профнастила.'};
      sheets = ceil(length / w);
      unitCost = {type:'m2', price:n(fPriceM2?.value)};
      sum = (unitCost.price>0) ? (sheets * tw * height * unitCost.price) : null;
    } else {
      const plankW = (WIDTH_WORK_MM[prof]||0)/1000;
      const gapM = n(fGap?.value)/100;
      if (!(plankW>0)) return {err:'Не найдена ширина планки штакетника.'};
      sheets = ceil(length / (plankW + gapM));
      unitCost = {type:'lm', price:n(fPriceLm?.value)};
      sum = unitCost.price>0 ? (height * unitCost.price * sheets) : null;
    }

    const pipesOn = !!fPipes?.checked;
    let pipes = null;
    if (pipesOn){
      const depth = n(fDepth?.value);
      const step = n(fStep?.value);
      const lags = n(fLags?.value);
      const pipeSize = fPipeSize?.value || '';
      const posts = ceil(length/step) + 1;
      const postMeters = posts * (height + depth);
      const postPcs6 = ceil(postMeters / 6);
      const lagMeters = length * lags;
      const lagPcs6 = ceil(lagMeters / 6);
      const caps = fCaps?.checked ? posts : 0;

      let screws = 0;
      if (fScrews?.checked){
        if (mat==='profnastil') screws = 12 * sheets;
        else screws = (prof==='М-образный Престиж') ? (2*sheets) : (4*sheets);
      }

      pipes = {depth, step, lags, pipeSize, posts, postPcs6, lagPcs6, caps, screws};
    }

    return {useArea, areaSot, length, height, mat, prof, sheets, unitCost, sum, pipes};
  }

  function fenceRender(data){
    const lines=[];
    if (data.useArea){
      lines.push(`<div class="mp-summary"><b>Расчётная длина забора:</b> ${fmt(data.length)} м</div>`);
    }
    lines.push(`<div class="mp-summary"><b>Профиль:</b> ${data.prof}</div>`);
    lines.push(`<div class="mp-summary"><b>Количество листов/планок:</b> ${fmtInt(data.sheets)} шт</div>`);
    lines.push(`<div class="mp-summary"><b>Длина элементов:</b> ${fmt(data.height)} м</div>`);
    if (data.sum!==null) lines.push(`<div class="mp-summary"><b>Стоимость:</b> ${fmt(data.sum,0)} ₽</div>`);

    if (data.pipes){
      const p=data.pipes;
      const rows=[
        ['Проф труба на столбы', `${p.pipeSize} (6 м)`, `${fmtInt(p.postPcs6)} шт`],
        ['Проф труба на лаги', `6 м`, `${fmtInt(p.lagPcs6)} шт`],
        ['Столбы (точки)', '—', `${fmtInt(p.posts)} шт`],
      ];
      if (p.caps) rows.push(['Заглушки', '—', `${fmtInt(p.caps)} шт`]);
      if (p.screws) rows.push(['Саморезы', '—', `${fmtInt(p.screws)} шт`]);
      lines.push(`
        <div style="margin-top:10px;"><b>Проф трубы и комплектующие</b></div>
        <table class="mp-table">
          <thead><tr><th>Позиция</th><th>Размер/длина</th><th>Кол-во</th></tr></thead>
          <tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>
        </table>
      `);
    }

    fResult.innerHTML = lines.join('<br>');
  }

  function fenceCalc(){
    fErr.textContent='';
    const data = fenceCompute();
    if (data.err){ fErr.textContent=data.err; return; }
    fenceLast = data;
    fenceRender(data);
    fPdfBtn?.classList.remove('hidden');
  }
  fCalcBtn?.addEventListener('click', fenceCalc);

  function downloadFencePdf(){
    if (!fenceLast) return;
    const doc = pdfDoc();
    if (!doc){ fErr.textContent='PDF не может быть создан: jsPDF не загружен'; return; }
    pdfSetFont(doc);
    doc.setFontSize(14);
    doc.text('Расчёт забора', 14, 14);
    doc.setFontSize(11);
    let y=24;
    const add=(l,v)=>{ doc.text(`${l}: ${v}`,14,y); y+=7; };

    // Вводные данные
    add('Материал', fenceLast.mat==='profnastil' ? 'Профнастил' : 'Штакетник');
    if (fenceLast.useArea) add('Площадь участка', `${fmt(fenceLast.areaSot)} сот`);
    add('Длина забора', `${fmt(fenceLast.length)} м`);
    add('Высота забора', `${fmt(fenceLast.height)} м`);
    add('Профиль', fenceLast.prof);

    if (fenceLast.mat==='profnastil'){
      const ww = workWidthM(fenceLast.prof);
      const tw = totalWidthM(fenceLast.prof);
      if (ww>0) add('Рабочая ширина листа', `${fmt(ww,3)} м`);
      if (tw>0) add('Общая ширина листа', `${fmt(tw,3)} м`);
      if (fenceLast.unitCost?.price>0) add('Стоимость', `${fmt(fenceLast.unitCost.price,0)} ₽/м²`);
    } else {
      const plankW = (WIDTH_WORK_MM[fenceLast.prof]||0)/1000;
      const gapM = n(document.getElementById('f_gap')?.value)/100; // текущее значение в форме
      if (plankW>0) add('Ширина планки', `${fmt(plankW,3)} м`);
      if (gapM>0) add('Зазор', `${fmt(gapM*100,0)} см`);
      if (fenceLast.unitCost?.price>0) add('Стоимость', `${fmt(fenceLast.unitCost.price,0)} ₽/пог.м`);
    }

    y += 2;
    add('Кол-во листов/планок', `${fmtInt(fenceLast.sheets)} шт`);
    add('Длина листа/планки', `${fmt(fenceLast.height)} м`);
    if (fenceLast.sum!==null) add('Итого стоимость', `${fmt(fenceLast.sum,0)} ₽`);

    // Проф трубы (если выбрано)
    if (fenceLast.pipes){
      y += 4;
      add('Посчитать профтрубы', 'Да');
      add('Заглубление', `${fmt(fenceLast.pipes.depth)} м`);
      add('Шаг столбов', `${fmt(fenceLast.pipes.step)} м`);
      add('Кол-во лаг', `${fmtInt(fenceLast.pipes.lags)}`);
      add('Труба на столб', fenceLast.pipes.pipeSize);

      if (doc.autoTable){
        y += 2;
        const p=fenceLast.pipes;
        const body=[
          ['Проф труба на столбы', `${p.pipeSize} (6 м)`, String(p.postPcs6)],
          ['Проф труба на лаги', `6 м`, String(p.lagPcs6)],
          ['Заглушки на столбы', `шт`, String(p.caps||0)],
          ['Саморезы', `шт`, String(p.screws||0)],
        ];
        doc.autoTable({
          startY: y,
          head: [['Позиция','Размер/длина','Кол-во']],
          body,
          theme: 'grid',
          styles: {font: (doc.getFont().fontName || 'helvetica'), fontSize: 9, cellPadding: 2},
          headStyles: {fillColor: [245,245,245], textColor: 20},
          margin: {left: 14, right: 14}
        });
      }
    } else {
      add('Посчитать профтрубы', 'Нет');
    }

    doc.save('raschet-zabora.pdf');
  }
  fPdfBtn?.addEventListener('click', downloadFencePdf);

  // ===================== ФАСАД =====================
  const faWalls = document.getElementById('fa_walls');
  const faAddWall = document.getElementById('fa_addWall');
  const faCalcBtn = document.getElementById('fa_calc');
  const faPdfBtn = document.getElementById('fa_pdf');
  const faResult = document.getElementById('fa_result');
  const faErr = document.getElementById('fa_err');

  let facadeLast = null;

  function wallTemplate(i){
    return `
    <div class="mp-wall" data-wall="${i}">
      <div class="mp-wall__head">
        <div><b>Стена ${i+1}</b></div>
        <div class="mp-wall__btns">
          ${i===0?'':'<button type="button" class="mp-wall-del">Удалить</button>'}
        </div>
      </div>

      <div class="grid">
        <div>
          <label>Высота стены (м)</label>
          <input type="number" class="fa_h" min="0" step="0.01" value="0">
        </div>
        <div>
          <label>Длина стены (м) <span class="hint-inline">0,4–6 м</span></label>
          <input type="number" class="fa_l" min="0.4" max="6" step="0.01" value="0.4">
        </div>
        <div>
          <label>Стоимость (₽/м²)</label>
          <input type="number" class="fa_price" min="0" step="1" value="0">
        </div>
        <div>
          <label>Материал</label>
          <select class="fa_mat">
            <option value="">— выберите —</option>
            <option value="profnastil">Профнастил</option>
            <option value="siding">Сайдинг</option>
          </select>
        </div>
        <div class="fa_prof_wrap hidden">
          <label>Профиль</label>
          <select class="fa_prof"></select>
        </div>
        <div class="fa_layout_wrap hidden">
          <label>Раскладка сайдинга</label>
          <select class="fa_layout">
            <option value="h">Горизонтально</option>
            <option value="v">Вертикально</option>
          </select>
        </div>
      </div>

      <button type="button" class="fa_addTrims">Добавить доборные элементы</button>
      <div class="mp-subblock fa_trims hidden">
        <div class="grid">
          <div>
            <label>Длина доборных элементов</label>
            <select class="fa_trimLen">
              <option value="2">2 м</option>
              <option value="3">3 м</option>
            </select>
          </div>
          <div>
            <label>Количество внешних углов</label>
            <input type="number" class="fa_outCorners" min="0" step="1" value="0">
          </div>
          <div>
            <label>Количество внутренних углов</label>
            <input type="number" class="fa_inCorners" min="0" step="1" value="0">
          </div>
          <div></div>
        </div>
      </div>
    </div>`;
  }

  function facadeBindWall(wrap){
    const matSel = wrap.querySelector('.fa_mat');
    const profWrap = wrap.querySelector('.fa_prof_wrap');
    const profSel = wrap.querySelector('.fa_prof');
    const layoutWrap = wrap.querySelector('.fa_layout_wrap');

    function render(){
      const mat = matSel.value;
      profWrap.classList.toggle('hidden', !mat);
      const list = FACADE_PROFILES[mat] || [];
      profSel.innerHTML = '<option value="">— выберите —</option>' + list.map(x=>`<option value="${x}">${x}</option>`).join('');
      layoutWrap.classList.toggle('hidden', mat !== 'siding');
    }
    matSel.addEventListener('change', render);
    render();

    wrap.querySelector('.fa_addTrims').addEventListener('click', () => {
      wrap.querySelector('.fa_trims').classList.toggle('hidden');
    });
  }

  function facadeRenderWalls(){
    const walls = Array.from(faWalls.querySelectorAll('.mp-wall'));
    walls.forEach((w, i) => {
      w.querySelector('b').textContent = `Стена ${i+1}`;
      const btns = w.querySelector('.mp-wall__btns');
      const del = w.querySelector('.mp-wall-del');
      if (i===0){
        if (del) del.remove();
      } else {
        if (!del && btns){
          btns.insertAdjacentHTML('beforeend', '<button type="button" class="mp-wall-del">Удалить</button>');
          const newDel = btns.querySelector('.mp-wall-del');
          newDel.addEventListener('click', () => { w.remove(); facadeRenderWalls(); });
        }
      }
    });
  }

  function facadeAddWall(){
    const i = faWalls.querySelectorAll('.mp-wall').length;
    faWalls.insertAdjacentHTML('beforeend', wallTemplate(i));
    const wrap = faWalls.querySelectorAll('.mp-wall')[i];
    facadeBindWall(wrap);
    const delBtn = wrap.querySelector('.mp-wall-del');
    if (delBtn){
      delBtn.addEventListener('click', () => {
        wrap.remove();
        facadeRenderWalls();
      });
    }
    facadeRenderWalls();
  }

  if (faAddWall) faAddWall.onclick = facadeAddWall;
  // init walls
  if (faWalls && faWalls.children.length===0) facadeAddWall();

  function facadeCompute(){
    const walls = Array.from(faWalls.querySelectorAll('.mp-wall'));
    if (!walls.length) return {err:'Нет стен для расчёта.'};

    const out = [];
    let totalSum = 0;
    let totalArea = 0;

    for (const w of walls){
      const h = n(w.querySelector('.fa_h').value);
      const L = n(w.querySelector('.fa_l').value);
      const price = n(w.querySelector('.fa_price').value);
      const mat = w.querySelector('.fa_mat').value;
      const prof = w.querySelector('.fa_prof').value;
      const layout = (w.querySelector('.fa_layout')?.value || 'h');

      if (!(h>0) || !(L>=0.4 && L<=6)) return {err:'Проверьте высоту и длину (0,4–6 м) у каждой стены.'};
      if (!mat || !prof) return {err:'Выберите материал и профиль у каждой стены.'};

      const ww = workWidthM(prof);
      if (!(ww>0)) return {err:`Не найдена рабочая ширина для профиля: ${prof}`};

      let sheets = 0;
      let sheetLen = 0;
      if (mat==='profnastil'){
        sheets = ceil(L / ww);
        sheetLen = h;
      } else {
        if (layout==='h'){
          sheets = ceil(h / ww);
          sheetLen = L;
        } else {
          sheets = ceil(L / ww);
          sheetLen = h;
        }
      }

      const area = h * L;
      const tw = totalWidthM(prof);
      const sum = (price>0 && tw>0) ? (sheets * tw * sheetLen * price) : 0;
      totalSum += sum;
      totalArea += area;

      const trimsOn = !w.querySelector('.fa_trims').classList.contains('hidden');
      let trims = null;
      if (trimsOn){
        const tl = n(w.querySelector('.fa_trimLen').value);
        const outCorners = n(w.querySelector('.fa_outCorners').value);
        const inCorners = n(w.querySelector('.fa_inCorners').value);
        const startQty = ceil(L / tl);
        const finishQty = ceil(L / tl);
        const outQty = ceil((h / tl) * outCorners);
        const inQty = ceil((h / tl) * inCorners);
        trims = {
          len: tl,
          items: [
            {name:'Начальная планка', qty:startQty, len:tl},
            {name:'Завершающая планка', qty:finishQty, len:tl},
            {name:'Угловая планка внешняя', qty:outQty, len:tl},
            {name:'Угловая планка внутренняя', qty:inQty, len:tl},
          ]
        };
      }

      out.push({h,L,price,mat,prof,layout,ww,sheets,sheetLen,area,sum,trims});
    }

    return {walls: out, totalArea, totalSum};
  }

  function facadeRender(data){
    const blocks = [];
    data.walls.forEach((w, i) => {
      const rows = w.trims ? w.trims.items.map(it=>`<tr><td>${it.name}</td><td>${fmtInt(it.qty)} шт</td><td>${fmt(it.len,0)} м</td></tr>`).join('') : '';
      blocks.push(`
        <div class="mp-wall-res">
          <div><b>Стена ${i+1}</b></div>
          <div class="mp-summary">Профиль: ${w.prof} (раб. ширина ${fmt(w.ww,3)} м)</div>
          <div class="mp-summary">Кол-во листов: ${fmtInt(w.sheets)} шт</div>
          <div class="mp-summary">Длина листов: ${fmt(w.sheetLen)} м</div>
          <div class="mp-summary">Площадь: ${fmt(w.area)} м²</div>
          ${w.sum?`<div class="mp-summary">Стоимость: ${fmt(w.sum,0)} ₽</div>`:''}
          ${w.trims?(
            `<div style="margin-top:10px;"><b>Доборные элементы</b></div>
             <table class="mp-table"><thead><tr><th>Элемент</th><th>Кол-во</th><th>Длина</th></tr></thead><tbody>${rows}</tbody></table>`
          ):''}
        </div>
      `);
    });

    blocks.push(`<div class="mp-total"><b>Итого площадь:</b> ${fmt(data.totalArea)} м² ${data.totalSum?`&nbsp;&nbsp; <b>Итого стоимость:</b> ${fmt(data.totalSum,0)} ₽`:''}</div>`);
    faResult.innerHTML = blocks.join('<br>');
  }

  function facadeCalc(){
    faErr.textContent='';
    const data = facadeCompute();
    if (data.err){ faErr.textContent=data.err; return; }
    facadeLast = data;
    facadeRender(data);
    faPdfBtn?.classList.remove('hidden');
  }
  if (faCalcBtn) faCalcBtn.onclick = facadeCalc;

  function downloadFacadePdf(){
    if (!facadeLast) return;
    const doc = pdfDoc();
    if (!doc){ faErr.textContent='PDF не может быть создан: jsPDF не загружен'; return; }
    pdfSetFont(doc);
    doc.setFontSize(14);
    doc.text('Расчёт фасада', 14, 14);
    doc.setFontSize(11);
    let y=24;

    // Итоги
    doc.text(`Итого площадь: ${fmt(facadeLast.totalArea)} м²`, 14, y); y+=7;
    doc.text(`Итого стоимость: ${fmt(facadeLast.totalSum||0,0)} ₽`, 14, y); y+=9;

    // Вводные данные по стенам
    if (doc.autoTable){
      const body = [];
      facadeLast.walls.forEach((w,i)=>{
        const matName = w.mat==='profnastil' ? 'Профнастил' : 'Сайдинг';
        const layoutName = (w.mat==='siding') ? (w.layout==='h' ? 'Горизонтально' : 'Вертикально') : '—';
        body.push([
          `Стена ${i+1}`,
          matName,
          w.prof,
          layoutName,
          fmt(w.h),
          fmt(w.L),
          w.price>0 ? fmt(w.price,0) : '—',
          fmtInt(w.sheets),
          fmt(w.sheetLen),
          fmt(w.area),
          w.sum>0 ? fmt(w.sum,0) : '—'
        ]);
      });

      doc.autoTable({
        startY: y,
        head: [['Стена','Материал','Профиль','Раскладка','Высота, м','Длина, м','Цена','Листов, шт','Длина листа, м','Площадь, м²','Сумма, ₽']],
        body,
        theme: 'grid',
        styles: {font: (doc.getFont().fontName || 'helvetica'), fontSize: 8, cellPadding: 2},
        headStyles: {fillColor: [245,245,245], textColor: 20},
        margin: {left: 14, right: 14}
      });

      y = doc.lastAutoTable.finalY + 8;

      // Доборные элементы (если есть)
      const trimsRows = [];
      facadeLast.walls.forEach((w,i)=>{
        if (!w.trims) return;
        w.trims.items.forEach(it=>{
          trimsRows.push([`Стена ${i+1}`, it.name, fmtInt(it.qty), fmt(it.len,0)]);
        });
      });

      if (trimsRows.length){
        doc.text('Доборные элементы', 14, y); y+=6;
        doc.autoTable({
          startY: y,
          head: [['Стена','Элемент','Кол-во, шт','Длина, м']],
          body: trimsRows,
          theme: 'grid',
          styles: {font: (doc.getFont().fontName || 'helvetica'), fontSize: 8, cellPadding: 2},
          headStyles: {fillColor: [245,245,245], textColor: 20},
          margin: {left: 14, right: 14}
        });
      }
    } else {
      // fallback без таблиц
      facadeLast.walls.forEach((w,i)=>{
        doc.text(`Стена ${i+1}: H=${fmt(w.h)} м, L=${fmt(w.L)} м, профиль ${w.prof}, листов ${fmtInt(w.sheets)} шт`, 14, y);
        y += 7;
      });
    }

    doc.save('raschet-fasada.pdf');
  }
  if (faPdfBtn) faPdfBtn.onclick = downloadFacadePdf;

});
sCalcBtn?.addEventListener('click', sCalc);
sPdfBtn?.addEventListener('click', downloadSoffitPdf);
