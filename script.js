// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- ELEMENT REFERENCES ---------- */
  const btnLearn = document.getElementById('btnLearn');
  const btnQuiz = document.getElementById('btnQuiz');
  const toHome = document.getElementById('toHome');
  const backHomeFromLearn = document.getElementById('backHomeFromLearn');
  const playAgain = document.getElementById('playAgain');
  // new Home button from Quiz
const homeFromQuiz = document.getElementById('homeFromQuiz');
homeFromQuiz && homeFromQuiz.addEventListener('click', () => {
  if(confirm('Exit the current quest and return home?')) {
    stopTimer();
    showPage('home');
  }
});


  // Learn
  const tabs = document.querySelectorAll('.learn-tabs .tab');
  const topics = ['AP','GP','HP','Algebra','Geometry'];
  const totalTopics = topics.length;
  document.getElementById('learnTotal').textContent = totalTopics;
  const learnCompletedEl = document.getElementById('learnCompleted');
  const resetProgressBtn = document.getElementById('resetProgress');

  // Calculator buttons & results (no inline onclicks)
  const calcAPBtn = document.getElementById('calcAP');
  const calcGPBtn = document.getElementById('calcGP');
  const calcHPBtn = document.getElementById('calcHP');
  const calcAlgBtn = document.getElementById('calcAlg');
  const calcGeoBtn = document.getElementById('calcGeo');

  // Quiz elements
  const gameTitle = document.getElementById('gameTitle');
  const levelNumEl = document.getElementById('levelNum');
  const levelNameEl = document.getElementById('levelName');
  const questionText = document.getElementById('questionText');
  const answerInput = document.getElementById('answerInput');
  const checkBtn = document.getElementById('checkBtn');
  const hintBtn = document.getElementById('hintBtn');
  const resultMsg = document.getElementById('resultMsg');
  const scoreEl = document.getElementById('score');
  const navMsg = document.getElementById('navMsg');
  const skipBtn = document.getElementById('skipBtn');
  const restartBtn = document.getElementById('restartBtn');
  const finalScoreEl = document.getElementById('finalScore');

  // probability UI
  const probabilityUI = document.getElementById('probabilityUI');
  const dice1 = document.getElementById('dice1');
  const dice2 = document.getElementById('dice2');
  const rollBtn = document.getElementById('rollBtn');
  const rollMsg = document.getElementById('rollMsg');
  const probTarget = document.getElementById('probTarget');

  const popupEl = document.getElementById('popup');
  const levelIntroEl = document.getElementById('levelIntro');

  // audio
  const sndCorrect = document.getElementById('snd-correct');
  const sndWrong = document.getElementById('snd-wrong');
  const sndTimesup = document.getElementById('snd-timesup');

  /* ---------- STATE ---------- */
  let completed = new Set();
  let level = 1;
  let score = 0;
  let currentAnswer = null; // number or object for probability
  let currentHint = '';
  let probTargetValue = 7;
  let timer = null;
  let timeLeft = 30;

  // helpers
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }
  function randNonZero(min,max){ let v=0; while(v===0) v=randInt(min,max); return v }

  function playSound(el){
    try{
      if(!el) return;
      el.currentTime = 0;
      el.play();
    }catch(e){ /* ignore if not available or autoplay blocked */ }
  }

  function showPopup(text, ms=1700){
    popupEl.textContent = text;
    popupEl.classList.remove('hidden');
    // trigger show class for transition
    popupEl.classList.add('show');
    setTimeout(()=> {
      popupEl.classList.remove('show');
      setTimeout(()=> popupEl.classList.add('hidden'), 350);
    }, ms);
  }

  function showLevelIntro(title, subtitle){
    levelIntroEl.innerHTML = `<strong>${title}</strong><div class="muted" style="margin-top:6px">${subtitle}</div>`;
    levelIntroEl.classList.add('show');
    setTimeout(()=> levelIntroEl.classList.remove('show'), 1400);
  }

  /* ---------- PERSISTENCE (localStorage) ---------- */
  const LS_KEY = 'mathquest_v1_progress';
  function saveProgress(){
    const data = {completed: Array.from(completed)};
    try{ localStorage.setItem(LS_KEY, JSON.stringify(data)); }catch(e){}
  }
  function loadProgress(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return;
      const obj = JSON.parse(raw);
      if(Array.isArray(obj.completed)){
        completed = new Set(obj.completed);
      }
    }catch(e){}
  }
  function resetProgress(){
    completed = new Set();
    saveProgress();
    updateLearnProgressUI();
    // enable all mark buttons
    document.querySelectorAll('.markComplete').forEach(b => {
      b.disabled = false;
      b.textContent = 'Mark Complete ✅';
    });
    showPopup('Progress reset');
  }

  /* ---------- LEARN - UI / events ---------- */
  function showTopic(topic){
    document.querySelectorAll('.topic').forEach(el => el.classList.add('hidden'));
    const panel = document.getElementById('topic-' + topic);
    if(panel) panel.classList.remove('hidden');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.topic === topic));
  }
  tabs.forEach(t => t.addEventListener('click', ()=> showTopic(t.dataset.topic)));
  showTopic('AP');

  // wire markComplete buttons
  document.querySelectorAll('.markComplete').forEach(btn => {
    btn.addEventListener('click', () => {
      const topic = btn.dataset.topic;
      if(!topic) return;
      completed.add(topic);
      btn.disabled = true;
      btn.textContent = 'Completed ✓';
      saveProgress();
      updateLearnProgressUI();
      showPopup(`🎉 ${topic} mastered!`);
      // visual unlock if all done
      if(completed.size === totalTopics){
        showPopup('All topics studied — Quiz unlocked!');
      }
    });
  });

  // reset progress
  resetProgressBtn && resetProgressBtn.addEventListener('click', ()=> {
    if(confirm('Reset saved learning progress?')) resetProgress();
  });

  function updateLearnProgressUI(){
    learnCompletedEl.textContent = completed.size;
    if(completed.size === totalTopics){
      btnQuiz.disabled = false;
      btnQuiz.textContent = '🧩 Quiz Mode (unlocked)';
    } else {
      btnQuiz.disabled = true;
      btnQuiz.textContent = '🧩 Quiz Mode (locked)';
    }
    // reflect completed buttons
    document.querySelectorAll('.markComplete').forEach(b => {
      const t = b.dataset.topic;
      if(completed.has(t)){
        b.disabled = true;
        b.textContent = 'Completed ✓';
      }
    });
  }

  // calculators (avoid inline onclick)
  function formatFixed(v){ return Number.isFinite(v) ? Number(v).toFixed(4) : 'NaN' }

  calcAPBtn && calcAPBtn.addEventListener('click', () => {
    const a = parseFloat(document.getElementById('ap_a').value);
    const d = parseFloat(document.getElementById('ap_d').value);
    const n = parseInt(document.getElementById('ap_n').value);
    const out = document.getElementById('ap_result');
    if(isNaN(a)||isNaN(d)||isNaN(n)){ out.textContent = '⚠️ Fill fields correctly'; return; }
    const val = a + (n-1)*d;
    out.textContent = `T${n} = ${formatFixed(val)}`;
  });

  calcGPBtn && calcGPBtn.addEventListener('click', () => {
    const a = parseFloat(document.getElementById('gp_a').value);
    const r = parseFloat(document.getElementById('gp_r').value);
    const n = parseInt(document.getElementById('gp_n').value);
    const out = document.getElementById('gp_result');
    if(isNaN(a)||isNaN(r)||isNaN(n)){ out.textContent = '⚠️ Fill fields correctly'; return; }
    const val = a * Math.pow(r, n-1);
    out.textContent = `T${n} = ${formatFixed(val)}`;
  });

  calcHPBtn && calcHPBtn.addEventListener('click', () => {
    const a = parseFloat(document.getElementById('hp_a').value);
    const d = parseFloat(document.getElementById('hp_d').value);
    const n = parseInt(document.getElementById('hp_n').value);
    const out = document.getElementById('hp_result');
    if(isNaN(a)||isNaN(d)||isNaN(n)){ out.textContent = '⚠️ Fill fields correctly'; return; }
    const denom = a + (n-1)*d;
    const val = denom === 0 ? NaN : 1/denom;
    out.textContent = `T${n} = ${formatFixed(val)}`;
  });

  calcAlgBtn && calcAlgBtn.addEventListener('click', () => {
    const a = parseFloat(document.getElementById('alg_a').value);
    const b = parseFloat(document.getElementById('alg_b').value);
    const c = parseFloat(document.getElementById('alg_c').value);
    const out = document.getElementById('alg_result');
    if(isNaN(a)||isNaN(b)||isNaN(c)){ out.textContent='⚠️ Fill fields'; return; }
    if(a===0){ out.textContent='a cannot be 0'; return; }
    const x = (c - b)/a;
    out.textContent = `x = ${formatFixed(x)}`;
  });

  calcGeoBtn && calcGeoBtn.addEventListener('click', () => {
    const A = parseFloat(document.getElementById('geo_A').value);
    const B = parseFloat(document.getElementById('geo_B').value);
    const out = document.getElementById('geo_result');
    if(isNaN(A)||isNaN(B)){ out.textContent='⚠️ Fill angles'; return; }
    const C = 180 - A - B;
    out.textContent = `Missing angle = ${C}°`;
  });

  /* ---------- HOME / NAV ---------- */
  function showPage(id){
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(id);
    if(el) el.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  btnLearn.addEventListener('click', ()=> showPage('learn'));
  btnQuiz.addEventListener('click', ()=> { if(!btnQuiz.disabled) startQuiz(); });
  backHomeFromLearn.addEventListener('click', ()=> showPage('home'));
  toHome && toHome.addEventListener('click', ()=> showPage('home'));
  playAgain && playAgain.addEventListener('click', ()=> startQuiz());

  /* ---------- QUIZ logic (enhanced) ---------- */
  function probabilityOfSum(target){
    let fav=0;
    for(let i=1;i<=6;i++) for(let j=1;j<=6;j++) if(i+j===target) fav++;
    const gcd = (a,b)=> b?gcd(b,a%b):Math.abs(a);
    const g = gcd(fav,36);
    return {fav, frac:`${fav/g}/${36/g}`, dec:(fav/36).toFixed(6)};
  }

  function setLevelData(){
    levelNumEl.textContent = level;
    resultMsg.textContent = '';
    answerInput.value = '';
    probabilityUI && probabilityUI.classList.add('hidden');

    // Introductions for each level
    if(level===1){
      levelNameEl.textContent = 'Arithmetic Progression (AP)';
      const a = randInt(1,8);
      const d = randInt(1,6);
      const n = randInt(4,7);
      const missingIndex = randInt(1,n);
      let seq=[];
      for(let i=1;i<=n;i++) seq.push(a+(i-1)*d);
      let display = seq.map((v,i)=>(i+1===missingIndex? '___' : v)).join(', ');
      questionText.innerHTML = `A sequence of ${n} terms is: <strong>${display}</strong>. The sequence is an AP. Find the missing term.`;
      currentAnswer = seq[missingIndex-1];
      currentHint = `Use aₙ = a + (n−1)d.`;
      showLevelIntro(`Gate 1 — Arithmetic Progression`, `Find the missing term in the sequence.`);
    }

    else if(level===2){
      levelNameEl.textContent = 'Algebra (Solve for x)';
      const a = randNonZero(-9,9);
      const x = randInt(-10,10);
      const b = randInt(-12,12);
      const c = a*x + b;
      const lhs = `${a}x ${b>=0?'+':'-'} ${Math.abs(b)}`;
      questionText.innerHTML = `Solve for <strong>x</strong>: <code>${lhs} = ${c}</code>.`;
      currentAnswer = x;
      currentHint = `Isolate x: x = (c − b) / a.`;
      showLevelIntro(`Gate 2 — Algebra`, `Isolate x and compute.`);
    }

    else if(level===3){
      levelNameEl.textContent = 'Geometry (Triangle angles)';
      const A = randInt(30,70);
      const B = randInt(20,80);
      const C = 180 - A - B;
      if(C <= 10) return setLevelData(); // ensure decent angle
      const missing = ['A','B','C'][randInt(0,2)];
      if(missing==='A'){ questionText.innerHTML = `In triangle ABC, ∠B = ${B}°, ∠C = ${C}°. Find ∠A.`; currentAnswer = A; }
      else if(missing==='B'){ questionText.innerHTML = `In triangle ABC, ∠A = ${A}°, ∠C = ${C}°. Find ∠B.`; currentAnswer = B; }
      else { questionText.innerHTML = `In triangle ABC, ∠A = ${A}°, ∠B = ${B}°. Find ∠C.`; currentAnswer = C; }
      currentHint = `Sum of angles in triangle is 180°.`;
      showLevelIntro(`Gate 3 — Geometry`, `Use angle sum property.`);
    }

    else if(level===4){
      levelNameEl.textContent = 'Probability (Dice)';
      probTargetValue = randInt(3,11);
      probTarget.textContent = probTargetValue;
      questionText.innerHTML = `What is the probability that the sum of two fair dice equals <strong>${probTargetValue}</strong>? (Answer as fraction like 1/6 or decimal)`;
      currentAnswer = probabilityOfSum(probTargetValue);
      currentHint = `Count favourable pairs with i+j = target. Probability = favourable/36.`;
      probabilityUI && probabilityUI.classList.remove('hidden');
      showLevelIntro(`Gate 4 — Probability`, `Try rolling the dice or compute analytically.`);
    }

    navMsg.textContent = `Gate ${level} awaits...`;
    startTimer();
  }

  /* ---------- TIMER ---------- */
  function startTimer(){
    clearInterval(timer);
    timeLeft = 15;
    const timerEl = document.getElementById('timer');
    if(timerEl) timerEl.textContent = timeLeft;
    const timerWrap = timerEl && timerEl.parentElement;
    timerWrap && timerWrap.classList.add('pulse');
    timer = setInterval(()=>{
      timeLeft--;
      if(timerEl) timerEl.textContent = timeLeft;
      if(timeLeft <= 0){
        clearInterval(timer);
        timerWrap && timerWrap.classList.remove('pulse');
        handleTimeout();
      }
    },1000);
  }

  function stopTimer(){
    clearInterval(timer);
    const timerEl = document.getElementById('timer');
    const timerWrap = timerEl && timerEl.parentElement;
    timerWrap && timerWrap.classList.remove('pulse');
  }

  function handleTimeout(){
    resultMsg.innerHTML = `<div class="fail">⏰ Time's up!</div>`;
    playSound(sndTimesup);
    score = Math.max(0, score - 5);
    scoreEl.textContent = score;
    setTimeout(()=> {
      level++;
      if(level>4) finishQuest(); else setLevelData();
    },900);
  }

  /* ---------- ANSWER PARSING & CHECK ---------- */
  function normalizeNumber(s){
    s = (s||'').toString().trim();
    if(s.includes('/')){
      const parts = s.split('/').map(t=>t.trim());
      if(parts.length===2){
        const n = parseFloat(parts[0]), d = parseFloat(parts[1]);
        if(!isNaN(n) && !isNaN(d) && d!==0) return n/d;
      }
    }
    const v = parseFloat(s);
    return isNaN(v)?null:v;
  }

  function checkAnswer(){
    resultMsg.textContent = '';
    const raw = answerInput.value.trim();
    if(raw.length===0){ resultMsg.innerHTML = `<div class="fail">Please enter an answer.</div>`; return; }

    stopTimer();

    if(level===4 && currentAnswer){
      // probability level expects fraction or decimal
      const userVal = normalizeNumber(raw);
      if(userVal===null){ resultMsg.innerHTML = `<div class="fail">Couldn't parse answer. Use number or fraction like 1/6.</div>`; startTimer(); return; }
      const correct = currentAnswer.fav / 36;
      if(Math.abs(userVal - correct) < 1e-6){
        levelComplete(true);
      } else {
        // also accept fraction strings equivalent
        const rawFrac = raw.includes('/') ? raw.trim() : null;
        if(rawFrac){
          const parts = rawFrac.split('/').map(t=>t.trim());
          if(parts.length===2){
            const n = parseFloat(parts[0]), d = parseFloat(parts[1]);
            if(!isNaN(n) && !isNaN(d) && d!==0){
              if(Math.abs(n/d - correct) < 1e-6) return levelComplete(true);
            }
          }
        }
        levelComplete(false);
      }
      return;
    }

    const userNumber = parseFloat(raw);
    if(isNaN(userNumber)){ resultMsg.innerHTML = `<div class="fail">Enter a numerical answer like 12 or 12.5</div>`; startTimer(); return; }

    if(Math.abs(userNumber - currentAnswer) < 1e-6) levelComplete(true);
    else levelComplete(false);
  }

  function levelComplete(ok){
    if(ok){
      resultMsg.innerHTML = `<div class="success">✅ Correct! You pass this gate.</div>`;
      playSound(sndCorrect);
      score += 25;
      scoreEl.textContent = score;
      // short delay then next level
      setTimeout(()=>{ level++; if(level>4) finishQuest(); else setLevelData(); },900);
    } else {
      resultMsg.innerHTML = `<div class="fail">❌ That's not correct. Try hint or skip.</div>`;
      playSound(sndWrong);
      score = Math.max(0, score - 5);
      scoreEl.textContent = score;
      startTimer();
    }
  }

  function finishQuest(){
    finalScoreEl.textContent = score;
    showPage('final');
  }

  /* ---------- DICE ROLL (animated) ---------- */
  function showDiceFace(el, value){
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    if(el) el.textContent = faces[value-1] || '🎲';
  }

  rollBtn && rollBtn.addEventListener('click', ()=>{
    // small animation class
    dice1.classList.add('dice-roll');
    dice2.classList.add('dice-roll');
    setTimeout(()=> {
      dice1.classList.remove('dice-roll');
      dice2.classList.remove('dice-roll');
      const r1 = randInt(1,6), r2 = randInt(1,6);
      showDiceFace(dice1, r1);
      showDiceFace(dice2, r2);
      const sum = r1 + r2;
      rollMsg.textContent = `You rolled ${r1} + ${r2} = ${sum}.`;
      if(sum === probTargetValue) resultMsg.innerHTML = `<div class="success">Nice roll! That equals the target — now enter the probability (as fraction or decimal) to confirm.</div>`;
      else resultMsg.innerHTML = `<div class="muted">Not the target. Try calculating probability by counting favourable pairs.</div>`;
    }, 520);
  });

  /* ---------- SKIP / RESTART ---------- */
  skipBtn.addEventListener('click', ()=> {
    if(confirm('Skip this level? You lose chance for points here.')) {
      stopTimer();
      level++;
      if(level>4) finishQuest(); else setLevelData();
    }
  });

  restartBtn.addEventListener('click', ()=> {
    if(confirm('Restart quest?')) {
      stopTimer();
      level = 1;
      score = 0;
      scoreEl.textContent = score;
      setLevelData();
      showPage('quiz');
    }
  });

  /* ---------- CHECK / HINT ---------- */
  checkBtn.addEventListener('click', checkAnswer);
  hintBtn.addEventListener('click', ()=> {
    resultMsg.innerHTML = `<div class="muted">Hint: ${currentHint}</div>`;
  });

  /* ---------- START / LAUNCH ---------- */
  function startQuiz(){
    score = 0; level = 1; scoreEl.textContent = score;
    showPage('quiz');
    setLevelData();
  }

  // expose startQuiz globally for index.html compatibility
  window.startQuiz = startQuiz;

  /* ---------- Initialization: load progress and wire remaining buttons ---------- */
  function init(){
    loadProgress();
    updateLearnProgressUI();
    // set mark buttons text per loaded state already done by updateLearnProgressUI
    // Attach any other buttons that were present in old HTML (defensive)
    const homeLearnBtn = document.getElementById('btnLearn');
    homeLearnBtn && homeLearnBtn.addEventListener('click', ()=> showPage('learn'));
  }
  init();

}); // DOMContentLoaded end
