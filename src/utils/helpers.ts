import { InteractiveElement, LineConnection, WorksheetData } from '../types';

/**
 * Normalizes text for forgiving educational grading:
 * - strips accents if ignoreAccents is true (á -> a, ñ -> ñ)
 * - trims extra spaces
 * - lowers case if caseSensitive is false
 */
export function normalizeAnswer(text: string, caseSensitive = false, ignoreAccents = true): string {
  let res = text.trim();
  if (!caseSensitive) {
    res = res.toLowerCase();
  }
  if (ignoreAccents) {
    res = res
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
  // normalize multiple whitespaces
  return res.replace(/\s+/g, ' ');
}

export function checkAnswer(
  userVal: string,
  element: InteractiveElement
): boolean {
  if (element.type === 'hotspot_choice') {
    if (element.choiceMode === 'true_false') {
      const normVal = (userVal || '').trim().toUpperCase();
      const normCorrect = (element.correctAnswer || 'V').trim().toUpperCase();
      return normVal === normCorrect;
    } else {
      // Checkbox mode:
      // If correctAnswer is 'false', it should NOT be checked (i.e. user left it unchecked/false).
      const isChecked = userVal === 'true';
      const shouldBeChecked = element.correctAnswer !== 'false';
      return isChecked === shouldBeChecked;
    }
  }

  if (!userVal) return false;
  const userNorm = normalizeAnswer(userVal, element.caseSensitive, element.ignoreAccents ?? true);
  
  // Multiple acceptable answers separated by "|" or ","
  const acceptable = element.correctAnswer
    .split(/[|,]/)
    .map(ans => normalizeAnswer(ans, element.caseSensitive, element.ignoreAccents ?? true))
    .filter(Boolean);
    
  return acceptable.includes(userNorm);
}

/**
 * Check if a connection between two dots matches the teacher's configured pairs.
 */
export function checkConnection(
  conn: LineConnection,
  elements: InteractiveElement[]
): boolean {
  const fromEl = elements.find(e => e.id === conn.fromId);
  const toEl = elements.find(e => e.id === conn.toId);
  if (!fromEl || !toEl) return false;

  // Direct ID match
  if (fromEl.correctAnswer === toEl.id || toEl.correctAnswer === fromEl.id) {
    return true;
  }
  // Pair ID match
  if (fromEl.pairId && toEl.pairId && fromEl.pairId === toEl.pairId) {
    return true;
  }
  return false;
}

/**
 * Generates a self-contained single HTML file for the worksheet.
 * Can be saved and hosted directly on Cloudflare Pages or run locally by teachers and students!
 */
export function generateStandaloneHTML(worksheet: WorksheetData): string {
  const serialized = JSON.stringify(worksheet);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${worksheet.title} · EduFicha Interactiva</title>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js"></script>
  <style>
    :root {
      --primary: #392a79;
      --secondary: #52b68e;
      --coral: #eb6281;
      --sunshine: #ffcf23;
      --bg: #f8fafc;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      font-weight: 700;
      font-size: 1.15rem;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .sheet-title {
      font-size: 0.95rem;
      color: #64748b;
    }
    .stage-container {
      display: flex;
      justify-content: center;
      padding: 1.5rem;
      flex: 1;
    }
    .stage-wrapper {
      position: relative;
      background: white;
      box-shadow: 0 4px 20px -2px rgba(57, 42, 121, 0.1);
      border-radius: 6px;
      overflow: hidden;
      max-width: 900px;
      width: 100%;
    }
    .stage-image {
      display: block;
      width: 100%;
      height: auto;
      user-select: none;
      -webkit-user-drag: none;
    }
    .interactive-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .cell-input {
      position: absolute;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid var(--primary);
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      text-align: center;
      color: var(--primary);
      outline: none;
      transition: all 0.15s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }
    .cell-input:focus {
      border-color: var(--secondary);
      box-shadow: 0 0 0 3px rgba(82, 182, 142, 0.3);
      background: #ffffff;
    }
    .cell-select {
      position: absolute;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid var(--primary);
      border-radius: 4px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary);
      outline: none;
      padding: 0 0.5rem;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }
    .dot-node {
      position: absolute;
      border-radius: 50%;
      background: var(--primary);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      cursor: pointer;
      transform: translate(-50%, -50%);
      transition: transform 0.15s, background-color 0.15s;
      z-index: 20;
    }
    .dot-node:hover {
      transform: translate(-50%, -50%) scale(1.3);
      background: var(--secondary);
    }
    .dot-node.active {
      background: var(--secondary);
      box-shadow: 0 0 0 4px rgba(82, 182, 142, 0.4);
    }
    svg.connections-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }
    .btn {
      background: var(--secondary);
      color: #0d3824;
      font-weight: 700;
      padding: 0.65rem 1.4rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.15s ease;
    }
    .btn:hover {
      filter: brightness(1.05);
      transform: translateY(-1px);
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .score-banner {
      background: #f0fdf4;
      border: 1px solid #86efac;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      text-align: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: #166534;
      display: none;
    }
    .correct-cell {
      border-color: #22c55e !important;
      background: #ecfdf5 !important;
      color: #15803d !important;
    }
    .wrong-cell {
      border-color: #ef4444 !important;
      background: #fef2f2 !important;
      color: #b91c1c !important;
    }
  </style>
</head>
<body>
  <header>
    <div style="display:flex; align-items:center; gap:0.75rem;">
      <svg viewBox="0 0 308.9 142.3" style="height:34px; width:auto;">
        <path fill="#EB6281" d="M67.3,42.1V19c0-3.4,3.7-6.1,7.6-6.1s7.8,2,7.7,6.1v37.1c0,1.8,1.5,3.3,3.3,3.3l0,0h4.1c1.8,0,3.3-1.5,3.3-3.3c0,0,0,0,0,0V19c0-10.4-7.6-18.8-18.5-18.8S56.3,8.6,56.3,19v23.1c0,1.8,1.5,3.3,3.3,3.3H64C65.8,45.4,67.3,43.9,67.3,42.1L67.3,42.1"/>
        <path fill="#EB6281" d="M114.6,45.3c10.7,0,18.2-8.3,18.2-18.4V9.3c0-0.6-0.5-1.2-1.1-1.2c0,0,0,0,0,0h-8.4c-0.6,0-1.2,0.5-1.2,1.1v0v17.5c0,3.3-3.6,6-7.4,6s-7.6-1.9-7.5-6V1.2c0-0.6-0.5-1.2-1.2-1.2h-8.3c-0.6,0-1.2,0.5-1.2,1.2c0,0,0,0,0,0v25.7C96.5,37,104,45.3,114.6,45.3"/>
        <path fill="#392A79" d="M106.2,52.8H101c-1.6,0-2.9,1.3-2.9,2.9V78c-3.3-2-7.1-3-11-3c-11.1,0-20,8.3-20,18.5s9,18.5,20,18.5c3.9,0,7.7-1,11-3v0.1c0,1.6,1.3,2.9,2.9,2.9h0h5.2c1.6,0,2.9-1.3,2.9-2.9v0V55.7C109.2,54.1,107.9,52.8,106.2,52.8C106.2,52.8,106.2,52.8,106.2,52.8 M87.1,101.4c-4.8,0-8.7-3.6-8.7-8s3.9-8,8.7-8s8.7,3.6,8.7,8S91.9,101.4,87.1,101.4"/>
        <path fill="#392A79" d="M61,77.2h-5.2c-1.6,0-2.9,1.3-2.9,2.9l0,0v15.1c0,3-2.8,5.4-6.2,5.4s-6.2-2.4-6.2-5.4V55.7c0-1.6-1.3-2.9-2.9-2.9c0,0,0,0,0,0h-5.2c-1.6,0-2.9,1.3-2.9,2.9c0,0,0,0,0,0v21.4c-2.9-1.4-6.2-2.2-9.4-2.2C9,74.9,0,83.2,0,93.4s9,18.5,20,18.5c5.2,0,10.3-1.9,14.1-5.4c3.3,3.3,7.8,5.2,12.5,5.2c9.5,0,17.2-7.4,17.2-16.4V80.1C63.9,78.5,62.6,77.2,61,77.2 M20,101.4c-4.8,0-8.7-3.6-8.7-8s3.9-8,8.7-8s8.7,3.6,8.7,8S24.8,101.4,20,101.4"/>
        <path fill="#FFCF23" d="M264.7,102.3l-3.1-2.4c-1.1-0.8-2.6-0.8-3.6,0.1c-1.8,1.5-4.1,2.4-6.5,2.6c-5.9,0.3-11.1-4.7-11.4-10.9c-0.3-6,4.3-11.4,10.2-11.7c2.3-0.1,4.6,0.6,6.6,1.8c1.1,0.7,2.6,0.6,3.6-0.3l2.9-2.8c1.2-1.1,1.2-3,0.1-4.1c-0.1-0.1-0.3-0.3-0.5-0.4c-3.8-2.7-8.5-4-13.1-3.7c-11.7,0.6-21.2,10.5-20.6,21.8s10.9,20.3,22.6,19.6c4.9-0.2,9.5-2.1,13.1-5.3c1.2-1.1,1.3-2.9,0.2-4.1C265,102.5,264.9,102.4,264.7,102.3"/>
        <path fill="#FFCF23" d="M173.3,80c2.3-0.1,4.6,0.6,6.6,1.8c1.1,0.7,2.6,0.6,3.6-0.3l2.9-2.8c1.2-1.1,1.2-2.9,0.1-4.1c-0.1-0.1-0.3-0.3-0.5-0.4c-3.8-2.7-8.5-4-13.1-3.7c-11.7,0.6-21.2,10.5-20.6,21.8s10.9,20.3,22.6,19.7c4.9-0.2,9.5-2.1,13.1-5.3c1.2-1.1,1.3-2.9,0.2-4.1c-0.1-0.1-0.2-0.2-0.4-0.4l-3.1-2.4c-1.1-0.8-2.6-0.8-3.6,0.1c-1.8,1.5-4.1,2.4-6.5,2.6c-5.9,0.3-11.1-4.7-11.4-10.9C162.8,85.7,167.4,80.3,173.3,80"/>
        <path fill="#52B68E" d="M225.3,14.6c1.4-0.7,2.9-1.3,4.4-1.6c6.3-1.4,9.5,1.6,10.4,5.6l0.2,0.7c-3.4-0.5-6.8-0.5-10.1,0.2c-8.8,2-14.7,8.6-13,16.2c1.6,7.3,8.9,10.8,17,9c4.2-0.9,7.9-3.5,10.1-7.2l1.3,5.7c0.3,1.3,1.4,2.2,2.8,2.2h6.9c0.6,0,1.1-0.5,1.1-1.1c0-0.1,0-0.2,0-0.2l-5.9-27.8c-2.2-9.9-10.4-14.7-20.3-12.5c-2.2,0.5-4.4,1.2-6.4,2.2c-1.9,0.9-3.3,2.5-3.7,4.6c0,0,0,0.1,0,0.1c-0.3,2,1,3.9,3,4.3C223.8,15,224.6,14.9,225.3,14.6 M241.6,29.4c0.1,3.7-2.5,6.4-6.6,7.3c-3.7,0.8-6.8-0.5-7.5-3.6s1.9-6.1,5.8-6.9c2.8-0.6,5.7-0.8,8.5-0.4L241.6,29.4z"/>
        <path fill="#52B68E" d="M166.4,43.2c4.3-2,8-5.2,10.7-9.2c0.9-1.4,0.5-3.3-0.9-4.2c-0.2-0.1-0.4-0.2-0.6-0.3l-4.1-1.6c-1.3-0.5-2.8,0-3.6,1.1c-1.5,2.1-3.5,3.9-5.8,5c-4.1,1.9-8.9,0.8-11.8-2.7l25.3-11.6c0.6-0.3,0.9-1,0.6-1.6c0,0,0,0,0,0c-6.4-13-16.9-18.2-28-13.1c-10.7,4.9-15.2,16.7-10.1,27.7C143.4,44,155.6,48.1,166.4,43.2 M152.9,14c3.6-1.9,8.1-0.9,10.6,2.4l-16.4,7.5C146.7,19.7,149,15.7,152.9,14"/>
        <path fill="#52B68E" d="M191.3,43.4c0.4,1.1,1.5,1.8,2.7,1.8h6.6c1.2,0,2.2-0.7,2.7-1.8l16.6-41.5c0.3-0.6,0-1.3-0.7-1.6c-0.1-0.1-0.3-0.1-0.4-0.1h-7.9c-1.2,0-2.3,0.8-2.7,1.9l-10.8,29.5l-8.1-21.5c-0.4-1.1-1.5-1.9-2.7-1.9h-7.9c-0.7,0-1.2,0.6-1.2,1.3c0,0.2,0,0.3,0.1,0.4L191.3,43.4z"/>
        <polygon fill="#5F5E5D" points="3.3,132.4 9.9,132.4 9.9,129.9 3.3,129.9 3.3,126.8 10.7,126.8 10.7,124.2 0,124.2 0,138.4 11,138.4 11,135.7 3.3,135.7"/>
        <path fill="#5F5E5D" d="M21.3,128.6c-0.8-0.9-2-1.4-3.3-1.3c-3.1,0.1-5.5,2.8-5.4,5.9c0.1,2.9,2.5,5.3,5.4,5.4c1.3,0.1,2.6-0.4,3.4-1.4v1.3h3v-15.1h-3.1V128.6z M18.6,135.9c-1.7,0.1-3.1-1.1-3.2-2.8s1.1-3.1,2.8-3.2c1.7-0.1,3.1,1.1,3.2,2.8c0,0.1,0,0.1,0,0.2c0.1,1.5-1,2.9-2.5,3C18.7,135.9,18.6,135.9,18.6,135.9"/>
      </svg>
      <div class="sheet-title">${worksheet.title}</div>
    </div>
    <div style="display:flex; gap:0.75rem;">
      <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
      <button class="btn" id="checkBtn" onclick="evaluateWorksheet()">Comprobar Respuestas</button>
      <button class="btn" id="retryBtn" style="display:none; background:#e2e8f0; color:#334155;" onclick="retryWorksheet()">Reintentar</button>
    </div>
  </header>

  <div class="stage-container">
    <div style="width: 100%; max-width: 900px;">
      <div id="scoreBanner" class="score-banner"></div>
      <div class="stage-wrapper" id="stageWrapper">
        <img class="stage-image" id="sheetImg" src="${worksheet.imageUrl}" alt="${worksheet.title}" />
        <svg class="connections-svg" id="connSvg"></svg>
        <div class="interactive-layer" id="interactiveLayer"></div>
      </div>
    </div>
  </div>

  <script>
    const data = ${serialized};
    let userAnswers = {};
    let userConnections = [];
    let selectedDotId = null;

    function init() {
      const layer = document.getElementById('interactiveLayer');
      layer.innerHTML = '';
      userConnections = [];

      data.elements.forEach(el => {
        if (el.type === 'text_input') {
          const input = document.createElement('input');
          input.className = 'cell-input';
          input.id = 'cell-' + el.id;
          input.placeholder = el.placeholder || '...';
          input.style.left = el.x + '%';
          input.style.top = el.y + '%';
          input.style.width = el.width + '%';
          input.style.height = el.height + '%';
          if (el.fontSize) input.style.fontSize = el.fontSize + 'px';
          input.oninput = (e) => { userAnswers[el.id] = e.target.value; };
          layer.appendChild(input);
        } else if (el.type === 'select_dropdown') {
          const select = document.createElement('select');
          select.className = 'cell-select';
          select.id = 'cell-' + el.id;
          select.style.left = el.x + '%';
          select.style.top = el.y + '%';
          select.style.width = el.width + '%';
          select.style.height = el.height + '%';
          const defaultOpt = document.createElement('option');
          defaultOpt.value = '';
          defaultOpt.textContent = el.placeholder || '-- Elegir --';
          select.appendChild(defaultOpt);
          (el.options || []).forEach(opt => {
            const optEl = document.createElement('option');
            optEl.value = opt;
            optEl.textContent = opt;
            select.appendChild(optEl);
          });
          select.onchange = (e) => { userAnswers[el.id] = e.target.value; };
          layer.appendChild(select);
        } else if (el.type === 'connect_dot') {
          const dot = document.createElement('div');
          dot.className = 'dot-node';
          dot.id = 'dot-' + el.id;
          dot.style.left = (el.x + el.width / 2) + '%';
          dot.style.top = (el.y + el.height / 2) + '%';
          dot.style.width = '20px';
          dot.style.height = '20px';
          dot.style.background = el.dotColor || (el.dotRole === 'start' ? '#eb6281' : '#52b68e');
          dot.onclick = () => handleDotClick(el.id);
          layer.appendChild(dot);
        } else if (el.type === 'hotspot_choice') {
          if (el.choiceMode === 'true_false') {
            const container = document.createElement('div');
            container.id = 'cell-' + el.id;
            container.style.position = 'absolute';
            container.style.left = el.x + '%';
            container.style.top = el.y + '%';
            container.style.width = el.width + '%';
            container.style.height = el.height + '%';
            container.style.display = 'flex';
            container.style.gap = '3px';
            container.style.padding = '2px';
            container.style.background = 'rgba(255,255,255,0.95)';
            container.style.borderRadius = '4px';
            container.style.border = '1px solid rgba(57,42,121,0.3)';

            const btnV = document.createElement('button');
            btnV.textContent = 'V';
            btnV.style.flex = '1';
            btnV.style.fontWeight = 'bold';
            btnV.style.fontSize = '12px';
            btnV.style.border = '1px solid #cbd5e1';
            btnV.style.borderRadius = '3px';
            btnV.style.background = '#f8fafc';
            btnV.style.cursor = 'pointer';

            const btnF = document.createElement('button');
            btnF.textContent = 'F';
            btnF.style.flex = '1';
            btnF.style.fontWeight = 'bold';
            btnF.style.fontSize = '12px';
            btnF.style.border = '1px solid #cbd5e1';
            btnF.style.borderRadius = '3px';
            btnF.style.background = '#f8fafc';
            btnF.style.cursor = 'pointer';

            btnV.onclick = () => {
              userAnswers[el.id] = 'V';
              btnV.style.background = '#10b981';
              btnV.style.color = '#ffffff';
              btnF.style.background = '#f8fafc';
              btnF.style.color = '#000000';
            };
            btnF.onclick = () => {
              userAnswers[el.id] = 'F';
              btnF.style.background = '#eb6281';
              btnF.style.color = '#ffffff';
              btnV.style.background = '#f8fafc';
              btnV.style.color = '#000000';
            };

            container.appendChild(btnV);
            container.appendChild(btnF);
            layer.appendChild(container);
          } else {
            const btn = document.createElement('button');
            btn.id = 'cell-' + el.id;
            btn.style.position = 'absolute';
            btn.style.left = el.x + '%';
            btn.style.top = el.y + '%';
            btn.style.width = el.width + '%';
            btn.style.height = el.height + '%';
            btn.style.border = '2px solid rgba(57,42,121,0.5)';
            btn.style.borderRadius = '4px';
            btn.style.background = 'rgba(255,255,255,0.9)';
            btn.style.fontSize = '14px';
            btn.style.fontWeight = 'bold';
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
              const cur = userAnswers[el.id] === 'true' ? 'false' : 'true';
              userAnswers[el.id] = cur;
              btn.textContent = cur === 'true' ? '✓' : '';
              btn.style.background = cur === 'true' ? 'rgba(82, 182, 142, 0.25)' : 'rgba(255,255,255,0.9)';
              btn.style.borderColor = cur === 'true' ? '#52b68e' : 'rgba(57,42,121,0.5)';
              btn.style.color = '#15803d';
            };
            layer.appendChild(btn);
          }
        }
      });
      renderConnections();
    }

    function handleDotClick(dotId) {
      if (!selectedDotId) {
        selectedDotId = dotId;
        document.getElementById('dot-' + dotId)?.classList.add('active');
      } else {
        if (selectedDotId !== dotId) {
          userConnections = userConnections.filter(c => !(c.fromId === selectedDotId || c.toId === selectedDotId || c.fromId === dotId || c.toId === dotId));
          userConnections.push({ id: 'c-' + Date.now(), fromId: selectedDotId, toId: dotId });
          renderConnections();
        }
        document.getElementById('dot-' + selectedDotId)?.classList.remove('active');
        selectedDotId = null;
      }
    }

    function renderConnections() {
      const svg = document.getElementById('connSvg');
      svg.innerHTML = '';
      userConnections.forEach(c => {
        const fromEl = data.elements.find(e => e.id === c.fromId);
        const toEl = data.elements.find(e => e.id === c.toId);
        if (fromEl && toEl) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', (fromEl.x + fromEl.width / 2) + '%');
          line.setAttribute('y1', (fromEl.y + fromEl.height / 2) + '%');
          line.setAttribute('x2', (toEl.x + toEl.width / 2) + '%');
          line.setAttribute('y2', (toEl.y + toEl.height / 2) + '%');
          line.setAttribute('stroke', '#392a79');
          line.setAttribute('stroke-width', '4');
          line.setAttribute('stroke-linecap', 'round');
          line.setAttribute('id', 'line-' + c.id);
          svg.appendChild(line);
        }
      });
    }

    function evaluateWorksheet() {
      let earned = 0;
      let total = 0;

      data.elements.forEach(el => {
        if (el.type === 'text_input' || el.type === 'select_dropdown') {
          total += (el.points || 1);
          const cell = document.getElementById('cell-' + el.id);
          const val = (userAnswers[el.id] || '').trim().toLowerCase();
          const correct = el.correctAnswer.toLowerCase().split(/[|,]/).map(s => s.trim());
          if (correct.includes(val)) {
            earned += (el.points || 1);
            cell?.classList.add('correct-cell');
            cell?.classList.remove('wrong-cell');
          } else {
            cell?.classList.add('wrong-cell');
            cell?.classList.remove('correct-cell');
          }
        } else if (el.type === 'hotspot_choice') {
          total += (el.points || 1);
          const cell = document.getElementById('cell-' + el.id);
          const val = userAnswers[el.id] || '';
          let isOk = false;
          if (el.choiceMode === 'true_false') {
            isOk = val.trim().toUpperCase() === (el.correctAnswer || 'V').trim().toUpperCase();
          } else {
            const isChecked = val === 'true';
            const shouldBeChecked = el.correctAnswer !== 'false';
            isOk = isChecked === shouldBeChecked;
          }
          if (isOk) {
            earned += (el.points || 1);
            cell?.classList.add('correct-cell');
            cell?.classList.remove('wrong-cell');
          } else {
            cell?.classList.add('wrong-cell');
            cell?.classList.remove('correct-cell');
          }
        }
      });

      // Grade connections
      const checkedPairs = new Set();
      userConnections.forEach(conn => {
        const fromEl = data.elements.find(e => e.id === conn.fromId);
        const toEl = data.elements.find(e => e.id === conn.toId);
        const line = document.getElementById('line-' + conn.id);
        if (fromEl && toEl) {
          const isCorrect = (fromEl.correctAnswer === toEl.id) || (toEl.correctAnswer === fromEl.id) || (fromEl.pairId && fromEl.pairId === toEl.pairId);
          if (isCorrect) {
            earned += 1;
            total += 1;
            line?.setAttribute('stroke', '#22c55e');
          } else {
            total += 1;
            line?.setAttribute('stroke', '#ef4444');
          }
        }
      });

      const banner = document.getElementById('scoreBanner');
      banner.style.display = 'block';
      const pct = total > 0 ? Math.round((earned / total) * 100) : 100;
      banner.innerHTML = 'Puntuación: ' + earned + ' / ' + total + ' puntos (' + pct + '%) ' + (pct >= 80 ? '🎉 ¡Fantástico trabajo!' : '💪 ¡Sigue practicando!');
      if (pct >= 80 && window.confetti) {
        window.confetti({ particleCount: 130, spread: 80, origin: { y: 0.6 }, colors: ['#392a79', '#52b68e', '#eb6281', '#ffcf23'] });
      }
      document.getElementById('retryBtn').style.display = 'inline-block';
    }

    function retryWorksheet() {
      userAnswers = {};
      userConnections = [];
      document.getElementById('scoreBanner').style.display = 'none';
      document.getElementById('retryBtn').style.display = 'none';
      init();
    }

    window.onload = init;
  </script>
</body>
</html>`;
}
