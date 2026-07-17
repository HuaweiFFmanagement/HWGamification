/**
 * FF GAMES — Motor de gamificación de entrenamiento
 * ---------------------------------------------------
 * Lee un archivo de contenido (JSON) y renderiza un juego dentro de un
 * contenedor HTML. Soporta dos tipos de nivel, combinables en un mismo juego:
 *
 *  - "narrative": pregunta con opciones, cada una con su propio feedback
 *                 (estilo REALMEOW: diálogo de personaje que reacciona).
 *  - "mission":   pregunta que, al acertar, entrega un "fragmento" (letra o
 *                 número) que se acumula para armar una contraseña final
 *                 (estilo Breakout).
 *
 * No requiere build ni frameworks: se incluye con <script src="game-engine.js">.
 *
 * Uso básico:
 *   const engine = new FFGame({
 *     container: document.getElementById('app'),
 *     configUrl: '../content/demo-producto.json',
 *     resultsClient: new FFResults({ webAppUrl: '...' }),
 *     mode: 'async' | 'live',
 *     session: { code: 'AB12' } // solo si mode === 'live'
 *   });
 *   engine.start();
 */

class FFGame {
  constructor({ container, configUrl, config, resultsClient, mode = 'async', session = null }) {
    this.container = container;
    this.configUrl = configUrl;
    this.presetConfig = config || null;
    this.resultsClient = resultsClient || null;
    this.mode = mode;
    this.session = session;

    this.state = {
      player: null,
      levelIndex: -1,
      log: [],           // registro de cada respuesta: {levelId, questionIndex, correct, chosenText, timeMs}
      fragments: [],      // fragmentos ganados (modo misión)
      score: 0,
      totalQuestions: 0,
      startedAt: null,
      levelStartedAt: null,
    };
  }

  async start() {
    this.config = this.presetConfig || (await this._loadConfig());
    this._renderShell();
    this._renderIntro();
  }

  async _loadConfig() {
    const res = await fetch(this.configUrl);
    if (!res.ok) throw new Error('No se pudo cargar el archivo de contenido: ' + this.configUrl);
    return res.json();
  }

  _renderShell() {
    this.container.innerHTML = `
      <div class="ffg">
        <div class="ffg-hud">
          <div class="ffg-hud-brand">${this._esc(this.config.title || 'FF GAME')}</div>
          <div class="ffg-hud-mid">
            <div class="ffg-progress" id="ffg-progress"></div>
          </div>
          <div class="ffg-fragments" id="ffg-fragments"></div>
        </div>
        <div class="ffg-body" id="ffg-body"></div>
      </div>
    `;
    this.$body = this.container.querySelector('#ffg-body');
    this.$progress = this.container.querySelector('#ffg-progress');
    this.$fragments = this.container.querySelector('#ffg-fragments');
    this._renderProgress();
    this._renderFragmentTracker();
  }

  _renderProgress() {
    const levels = this.config.levels || [];
    this.$progress.innerHTML = levels.map((_, i) => {
      let cls = '';
      if (i < this.state.levelIndex) cls = 'done';
      else if (i === this.state.levelIndex) cls = 'current';
      return `<span class="${cls}"></span>`;
    }).join('');
  }

  _renderFragmentTracker() {
    const missionLevels = (this.config.levels || []).filter(l => l.type === 'mission');
    if (missionLevels.length === 0) { this.$fragments.innerHTML = ''; return; }
    this.$fragments.innerHTML = missionLevels.map(l => {
      const won = this.state.fragments.includes(l.fragment);
      return `<div class="ffg-frag-slot ${won ? 'won' : ''}">${won ? this._esc(l.fragment) : '?'}</div>`;
    }).join('');
  }

  // ---------------- INTRO / IDENTIFICACIÓN DEL JUGADOR ----------------

  _renderIntro() {
    const intro = this.config.intro || {};
    this.$body.innerHTML = `
      <div class="ffg-eyebrow">${this._esc(intro.eyebrow || 'ENTRENAMIENTO')}</div>
      <h1 class="ffg-title">${this._esc(this.config.title || '')}</h1>
      <p class="ffg-story">${this._esc(intro.story || '')}</p>
      <div class="ffg-field">
        <label>Nombre</label>
        <input type="text" id="ffg-name" placeholder="Ej: Tatiana Barragán" autocomplete="off" />
      </div>
      <div class="ffg-field">
        <label>Rol / Equipo</label>
        <input type="text" id="ffg-role" placeholder="Ej: Supervisor Cuenta Claro" autocomplete="off" />
      </div>
      ${this.mode === 'live' ? `<div class="ffg-field"><label>Código de sesión</label>
        <input type="text" id="ffg-code" value="${this._esc(this.session?.code || '')}" ${this.session?.code ? 'readonly' : ''} /></div>` : ''}
      <button class="ffg-btn" id="ffg-start-btn">${this._esc(intro.cta || 'Empezar juego')}</button>
    `;
    this.$body.querySelector('#ffg-start-btn').addEventListener('click', () => {
      const name = this.$body.querySelector('#ffg-name').value.trim();
      const role = this.$body.querySelector('#ffg-role').value.trim();
      const code = this.mode === 'live' ? this.$body.querySelector('#ffg-code').value.trim() : null;
      if (!name) { this._flash('Escribe tu nombre para continuar.'); return; }
      this.state.player = { name, role, code };
      this.state.startedAt = Date.now();
      this._nextLevel();
    });
  }

  _flash(msg) {
    let el = this.$body.querySelector('.ffg-flash');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ffg-flash ffg-dialogue bad';
      this.$body.prepend(el);
    }
    el.textContent = msg;
  }

  // ---------------- NAVEGACIÓN ENTRE NIVELES ----------------

  _nextLevel() {
    this.state.levelIndex++;
    this._renderProgress();
    const level = (this.config.levels || [])[this.state.levelIndex];
    if (!level) { this._renderEnding(); return; }
    this.state.levelStartedAt = Date.now();
    this._renderLevelIntro(level);
  }

  _renderLevelIntro(level) {
    this.$body.innerHTML = `
      <div class="ffg-eyebrow">NIVEL ${this.state.levelIndex + 1} DE ${this.config.levels.length}</div>
      <h2 class="ffg-title">${this._esc(level.name || '')}</h2>
      <p class="ffg-story">${this._esc(level.intro || '')}</p>
      <button class="ffg-btn" id="ffg-level-start">${this._esc(level.cta || 'Empezar nivel')}</button>
    `;
    this.$body.querySelector('#ffg-level-start').addEventListener('click', () => {
      this._renderQuestion(level, 0);
    });
  }

  _renderQuestion(level, qIndex) {
    const q = level.questions[qIndex];
    if (!q) { this._finishLevel(level); return; }

    const optionsHtml = q.options.map((opt, i) => `
      <button class="ffg-option" data-i="${i}">${this._esc(opt.text)}</button>
    `).join('');

    this.$body.innerHTML = `
      <div class="ffg-eyebrow">${this._esc(level.name || '')} · PREGUNTA ${qIndex + 1} DE ${level.questions.length}</div>
      <p class="ffg-question">${this._esc(q.prompt)}</p>
      <div class="ffg-options">${optionsHtml}</div>
      <div id="ffg-feedback-slot"></div>
    `;

    const buttons = [...this.$body.querySelectorAll('.ffg-option')];
    const qStart = Date.now();
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.disabled = true);
        const opt = q.options[Number(btn.dataset.i)];
        const isCorrect = !!opt.correct;
        btn.classList.add(isCorrect ? 'correct' : 'incorrect');

        this.state.totalQuestions++;
        if (isCorrect) this.state.score++;
        this.state.log.push({
          levelId: level.id || level.name,
          questionIndex: qIndex,
          correct: isCorrect,
          chosenText: opt.text,
          timeMs: Date.now() - qStart,
        });

        const fbSlot = this.$body.querySelector('#ffg-feedback-slot');
        fbSlot.innerHTML = `
          <div class="ffg-dialogue ${isCorrect ? 'ok' : 'bad'}">
            <div class="who">${isCorrect ? '✔ Correcto' : '✘ Intenta de nuevo la próxima'}</div>
            ${this._esc(opt.feedback || '')}
          </div>
          <button class="ffg-btn" id="ffg-continue">Continuar</button>
        `;
        fbSlot.querySelector('#ffg-continue').addEventListener('click', () => {
          this._renderQuestion(level, qIndex + 1);
        });
      });
    });
  }

  _finishLevel(level) {
    if (level.type === 'mission' && level.fragment) {
      this.state.fragments.push(level.fragment);
      this._renderFragmentTracker();
    }
    this.$body.innerHTML = `
      <div class="ffg-screen-center">
        <div class="ffg-eyebrow">NIVEL SUPERADO</div>
        <h2 class="ffg-title">${this._esc(level.outro || '¡Bien hecho!')}</h2>
        ${level.type === 'mission' && level.fragment ? `<div class="ffg-big-number">${this._esc(level.fragment)}</div><p class="ffg-story">Fragmento conseguido</p>` : ''}
        <button class="ffg-btn" id="ffg-to-next">Siguiente nivel</button>
      </div>
    `;
    this.$body.querySelector('#ffg-to-next').addEventListener('click', () => this._nextLevel());
  }

  // ---------------- CIERRE Y ENVÍO DE RESULTADOS ----------------

  async _renderEnding() {
    const ending = this.config.ending || {};
    const timeMs = Date.now() - this.state.startedAt;
    const pct = this.state.totalQuestions ? Math.round((this.state.score / this.state.totalQuestions) * 100) : 0;

    let passwordBlock = '';
    const missionLevels = (this.config.levels || []).filter(l => l.type === 'mission');
    if (missionLevels.length > 0) {
      const assembled = missionLevels.map(l => this.state.fragments.includes(l.fragment) ? l.fragment : '_').join('');
      passwordBlock = `<div class="ffg-big-number">${this._esc(assembled)}</div><p class="ffg-story">Código final ensamblado</p>`;
    }

    this.$body.innerHTML = `
      <div class="ffg-screen-center">
        <div class="ffg-eyebrow">${this._esc(ending.eyebrow || 'JUEGO TERMINADO')}</div>
        <h2 class="ffg-title">${this._esc(ending.title || '¡Felicidades!')}</h2>
        <p class="ffg-story">${this._esc(ending.story || '')}</p>
        ${passwordBlock}
        <div class="ffg-big-number">${pct}%</div>
        <p class="ffg-story">${this.state.score} de ${this.state.totalQuestions} respuestas correctas</p>
        <div id="ffg-submit-status" class="ffg-story"></div>
      </div>
    `;

    if (this.resultsClient) {
      const statusEl = this.$body.querySelector('#ffg-submit-status');
      statusEl.textContent = 'Guardando resultado...';
      try {
        await this.resultsClient.submit({
          gameId: this.config.id,
          gameTitle: this.config.title,
          sessionCode: this.state.player?.code || (this.session?.code || ''),
          playerName: this.state.player?.name,
          playerRole: this.state.player?.role,
          score: this.state.score,
          totalQuestions: this.state.totalQuestions,
          percent: pct,
          timeMs,
          mode: this.mode,
          log: this.state.log,
          submittedAt: new Date().toISOString(),
        });
        statusEl.textContent = 'Resultado guardado ✔';
      } catch (e) {
        statusEl.textContent = 'No se pudo guardar el resultado (revisa tu conexión).';
      }
    }
  }

  _esc(str) {
    if (str === undefined || str === null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }
}
