const Momentum = (() => {
  const S = {
    theme: localStorage.getItem('theme') || 'auto',
    identity: localStorage.getItem('identity') || 'I focus on one meaningful task at a time.',
    xp: parseInt(localStorage.getItem('xp')||'0',10),
    level: parseInt(localStorage.getItem('level')||'1',10),
    streak: parseInt(localStorage.getItem('streak')||'0',10),
    lastMarked: localStorage.getItem('lastMarked')||'',
    // Core data
    today: JSON.parse(localStorage.getItem('today')||'{"plan":[],"woop":[],"review":""}'),
    newMe: JSON.parse(localStorage.getItem('newMe')||'{"entries":[],"links":[],"identity":""}'),
    xyz: JSON.parse(localStorage.getItem('xyz')||'{"goal":"","deadline":"","progress":0,"roadmap":[]}'),
    nuclear: JSON.parse(localStorage.getItem('nuclear')||'{"total":0,"review":""}'),
    attack: JSON.parse(localStorage.getItem('attack')||'{"skills":[],"systems":[],"wisdom":[],"mindset":[],"viz":[],"plans":[],"journals":[],"sdt":{"auto":5,"comp":5,"rel":5},"review":""}')
  };

  const save = (k,v) => localStorage.setItem(k, typeof v==='string' ? v : JSON.stringify(v));
  const addXP = (n) => { S.xp = Math.max(0, S.xp + n); save('xp', S.xp); levelCheck(); };
  const levelCheck = () => { const target = 50 * S.level; if(S.xp >= target){ S.level++; save('level', S.level); } };
  const markStreak = () => {
    const today = new Date().toDateString();
    if(S.lastMarked === today) return;
    const diff = S.lastMarked ? Math.round((new Date() - new Date(S.lastMarked))/(1000*60*60*24)) : null;
    S.streak = (!S.lastMarked || diff===1) ? S.streak+1 : 1;
    S.lastMarked = today; save('streak', S.streak); save('lastMarked', S.lastMarked);
  };

  // Theme
  const applyTheme = (mode) => {
    const root = document.documentElement;
    const set = (bg, card, text, border) => {
      root.style.setProperty('--bg', bg);
      root.style.setProperty('--card', card);
      root.style.setProperty('--text', text);
      root.style.setProperty('--border', border);
    };
    if(mode==='auto'){ /* respect system */ }
    if(mode==='dark'){ set('#0b1020','#131733','#e9ecf6','#2b3556'); }
    if(mode==='light'){ set('#f5f7fa','#ffffff','#1a1a1a','#dde2ea'); }
    if(mode==='contrast'){ root.style.setProperty('--primary','#00ffff'); root.style.setProperty('--accent','#ffff00'); }
    S.theme = mode; save('theme', mode);
  };
  const bindThemeButtons = () => {
    document.querySelectorAll('.tools .mini').forEach(b=> b.addEventListener('click', ()=>applyTheme(b.dataset.theme)));
    applyTheme(S.theme);
  };

  // Timer helpers
  const formatClock = (secs) => {
    const m = Math.floor(secs/60).toString().padStart(2,'0');
    const s = (secs%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };
  const runTimer = (seconds, onTick, onDone) => {
    let secs = seconds;
    const iv = setInterval(()=>{
      secs = Math.max(0, secs-1);
      if(onTick) onTick(secs);
      if(secs===0){ clearInterval(iv); if(onDone) onDone(true); }
    },1000);
    return () => clearInterval(iv); // cancel
  };

  // Home
  const home = () => {
    bindThemeButtons();
    document.getElementById('homeIdentity').textContent = S.identity;
    document.getElementById('homeIdentitySave').onclick = ()=>{
      const v = document.getElementById('homeIdentityInput').value.trim();
      if(!v) return; S.identity=v; save('identity', v);
      document.getElementById('homeIdentity').textContent = v; addXP(5);
    };
    document.getElementById('homeXP').textContent = S.xp;
    document.getElementById('homeLevel').textContent = S.level;
    document.getElementById('homeStreak').textContent = S.streak;
    const pct = Math.round(((S.xyz.progress||0) + ((S.nuclear.total||0)/120*100))/2);
    document.getElementById('homeProgressBar').style.width = `${pct}%`;
    document.getElementById('homeProgressText').textContent = `${pct}% from missions + points`;
  };

  // Attack Mode
  const attackMode = () => {
    bindThemeButtons();

    // Skills (neuroplasticity)
    const skillList = document.getElementById('amSkillList');
    const renderSkills = () => {
      skillList.innerHTML='';
      S.attack.skills.forEach((sk,i)=>{
        const d = document.createElement('div'); d.className='item';
        d.innerHTML = `<strong>${sk.name}</strong><br>Reps: ${sk.reps}
        <div class="row"><button class="mini" data-i="${i}" data-act="inc">+1 rep</button>
        <button class="mini ghost" data-i="${i}" data-act="dec">-1</button></div>`;
        skillList.appendChild(d);
      });
    };
    document.getElementById('amSkillAdd').onclick = ()=>{
      const name = document.getElementById('amSkill').value.trim(); if(!name) return;
      S.attack.skills.push({name, reps:0}); save('attack', S.attack); renderSkills(); addXP(2);
    };
    skillList.addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const i = parseInt(btn.dataset.i,10); const act = btn.dataset.act;
      const sk = S.attack.skills[i]; if(!sk) return;
      sk.reps = Math.max(0, sk.reps + (act==='inc'?1:-1));
      save('attack', S.attack); renderSkills(); addXP(act==='inc'?1:-1);
    });
    renderSkills();

    // Systems (Pareto)
    const sysList = document.getElementById('amSystemList');
    const renderSystems = () => {
      sysList.innerHTML='';
      S.attack.systems.slice().reverse().forEach(s=>{
        const d=document.createElement('div'); d.className='item';
        d.textContent = s.note;
        sysList.appendChild(d);
      });
      // simple success estimate grows with entries
      const count = S.attack.systems.length;
      const success = Math.min(80, 20 + count*5);
      document.getElementById('amParetoBar').style.width = `${success}%`;
      document.getElementById('amParetoText').textContent = `Estimated success rate: ${success}% (iteration improves systems)`;
    };
    document.getElementById('amSystemAdd').onclick = ()=>{
      const note = document.getElementById('amSystem').value.trim(); if(!note) return;
      S.attack.systems.push({note, ts:Date.now()}); save('attack', S.attack); renderSystems(); addXP(3);
    };
    renderSystems();

    // Wisdom
    const wList = document.getElementById('amWisdomList');
    const renderWisdom = () => {
      wList.innerHTML='';
      S.attack.wisdom.slice().reverse().forEach(w=>{
        const d=document.createElement('div'); d.className='item';
        d.textContent = w.text; wList.appendChild(d);
      });
    };
    document.getElementById('amWisdomSave').onclick = ()=>{
      const text = document.getElementById('amWisdomPrompt').value.trim(); if(!text) return;
      S.attack.wisdom.push({text, ts:Date.now()}); save('attack', S.attack); renderWisdom(); addXP(2);
    };
    renderWisdom();

    // Mindset
    const mList = document.getElementById('amMindsetList');
    const renderMindset = () => {
      mList.innerHTML='';
      S.attack.mindset.slice().reverse().forEach(m=>{
        const d=document.createElement('div'); d.className='item';
        d.innerHTML = `<strong>Fixed:</strong> ${m.fixed}<br><strong>Growth:</strong> ${m.growth}`;
        mList.appendChild(d);
      });
    };
    document.getElementById('amMindsetSave').onclick = ()=>{
      const fixed = document.getElementById('amFixed').value.trim();
      const growth = document.getElementById('amGrowth').value.trim();
      if(!fixed || !growth) return;
      S.attack.mindset.push({fixed,growth,ts:Date.now()});
      save('attack', S.attack); renderMindset(); addXP(3);
    };
    renderMindset();

    // Visualization
    const vList = document.getElementById('amVizList');
    const renderViz = () => {
      vList.innerHTML='';
      S.attack.viz.slice().reverse().forEach(v=>{
        const d=document.createElement('div'); d.className='item';
        d.textContent = v.goal; vList.appendChild(d);
      });
    };
    document.getElementById('amVizSave').onclick = ()=>{
      const goal = document.getElementById('amVizGoal').value.trim(); if(!goal) return;
      S.attack.viz.push({goal, ts:Date.now()}); save('attack', S.attack); renderViz(); addXP(2);
    };
    renderViz();

    // Plans + deadlines
    const pList = document.getElementById('amPlanList');
    const renderPlans = () => {
      pList.innerHTML='';
      S.attack.plans.slice().reverse().forEach(p=>{
        const d=document.createElement('div'); d.className='item';
        d.textContent = `Deadline: ${p.deadline} → ${p.note}`; pList.appendChild(d);
      });
    };
    document.getElementById('amPlanSave').onclick = ()=>{
      const deadline = document.getElementById('amDeadline').value;
      const note = document.getElementById('amPlanNote').value.trim();
      if(!deadline || !note) return;
      S.attack.plans.push({deadline,note}); save('attack', S.attack); renderPlans(); addXP(3);
    };
    renderPlans();

    // Journals
    const jList = document.getElementById('amJournalList');
    const renderJournals = () => {
      jList.innerHTML='';
      S.attack.journals.slice().reverse().forEach(j=>{
        const d=document.createElement('div'); d.className='item';
        d.textContent = `[${j.tag}] ${j.text}`; jList.appendChild(d);
      });
    };
    document.getElementById('amJournalSave').onclick = ()=>{
      const text = document.getElementById('amJournal').value.trim();
      const tag = document.getElementById('amJournalTag').value;
      if(!text) return;
      S.attack.journals.push({text, tag, ts:Date.now()});
      save('attack', S.attack); renderJournals(); addXP(2);
    };
    renderJournals();

    // SDT sliders
    const autoEl = document.getElementById('amSDTAuto');
    const compEl = document.getElementById('amSDTComp');
    const relEl = document.getElementById('amSDTRel');
    const sdtBar = document.getElementById('amSDTBar');
    const sdtText = document.getElementById('amSDTText');
    const renderSDT = ()=>{
      const a = S.attack.sdt.auto, c = S.attack.sdt.comp, r = S.attack.sdt.rel;
      const avg = Math.round((a+c+r)/3*10);
      sdtBar.style.width = `${avg}%`;
      sdtText.textContent = `Autonomy ${a}/10 • Competence ${c}/10 • Relatedness ${r}/10`;
    };
    [autoEl,compEl,relEl].forEach(el=> el.addEventListener('input', ()=>{
      S.attack.sdt = {auto:parseInt(autoEl.value,10), comp:parseInt(compEl.value,10), rel:parseInt(relEl.value,10)};
      save('attack', S.attack); renderSDT();
    }));
    autoEl.value = S.attack.sdt.auto; compEl.value = S.attack.sdt.comp; relEl.value = S.attack.sdt.rel; renderSDT();

    // Weekly review
    const revEl = document.getElementById('amReviewView');
    document.getElementById('amReviewSave').onclick = ()=>{
      const txt = document.getElementById('amReview').value.trim(); if(!txt) return;
      S.attack.review = txt; save('attack', S.attack);
      revEl.textContent = txt; addXP(4); markStreak();
    };
    revEl.textContent = S.attack.review || '';
  };

  // New Me
  const newMe = () => {
    bindThemeButtons();
    document.getElementById('jmAdd').onclick = () => {
      const text = document.getElementById('jmEntry').value.trim();
      const tag = document.getElementById('jmTag').value;
      if(!text) return;
      S.newMe.entries.push({text, tag, ts: Date.now()});
      save('newMe', S.newMe); renderNewMe(); addXP(2);
    };
    document.getElementById('jmLink').onclick = () => {
      const tr = document.getElementById('jmTrigger').value.trim();
      const ac = document.getElementById('jmAction').value.trim();
      if(!tr || !ac) return;
      S.newMe.links.push({tr, ac}); save('newMe', S.newMe); renderNewMe(); addXP(3);
    };
    document.getElementById('jmIdentitySave').onclick = () => {
      const idt = document.getElementById('jmIdentity').value.trim();
      if(!idt) return;
      S.newMe.identity = idt; save('newMe', S.newMe);
      document.getElementById('jmIdentityView').textContent = idt; addXP(5);
    };
    const renderNewMe = () => {
      const list = document.getElementById('jmList'); list.innerHTML='';
      S.newMe.entries.slice().reverse().forEach(e=>{
        const d = document.createElement('div'); d.className='item';
        d.textContent = `[${e.tag}] ${e.text}`; list.appendChild(d);
      });
      const counts = {}; S.newMe.entries.forEach(e=> counts[e.tag]=(counts[e.tag]||0)+1 );
      const pat = document.getElementById('jmPatterns'); pat.innerHTML='';
      Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([tag,n])=>{
        const c = document.createElement('div'); c.className='chip'; c.textContent = `${tag} ×${n}`; pat.appendChild(c);
      });
      const prev = document.getElementById('jmPrevent'); prev.innerHTML='';
      Object.keys(counts).forEach(tag=>{
        const i = document.createElement('div'); i.className='item';
        i.textContent = `If ${tag} rises → then: 25m focus + notifications off + prep tools.`; prev.appendChild(i);
      });
      document.getElementById('jmIdentityView').textContent = S.newMe.identity||'';
    };
    renderNewMe();
  };

  // Nuke Today
  const nukeToday = () => {
    bindThemeButtons();
    const hoursEl = document.getElementById('ntHours');
    document.getElementById('ntCalc').onclick = ()=>{
      const now = document.getElementById('ntNow').value;
      const next = document.getElementById('ntNextEvent').value;
      if(!now || !next){ hoursEl.textContent = 'Enter times to calculate.'; return; }
      const [nh,nm] = now.split(':').map(Number), [xh,xm] = next.split(':').map(Number);
      const mins = (xh*60+xm) - (nh*60+nm);
      const h = Math.max(0, Math.floor(mins/60)), m = Math.max(0, mins%60);
      hoursEl.textContent = `Hours left: ${h}h ${m}m`;
    };

    const planEl = document.getElementById('ntPlanView');
    const clockEl = document.getElementById('ntClock');
    const barEl = document.getElementById('ntFocusBar');
    const statusEl = document.getElementById('ntStatus');
    let cancelTimer = null;

    const renderPlan = ()=>{
      planEl.innerHTML = '';
      S.today.plan.forEach(p=>{
        const div = document.createElement('div'); div.className='item';
        div.textContent = `⏰ ${p.start} — ${p.mit} for ${p.dur}m`;
        planEl.appendChild(div);
      });
    };
    document.getElementById('ntPlan').onclick = ()=>{
      const mit = document.getElementById('ntMIT').value.trim();
      const start = document.getElementById('ntStart').value;
      const dur = parseInt(document.getElementById('ntDuration').value||'25',10);
      if(!mit || !start){ statusEl.textContent='Define task and start time.'; return; }
      S.today.plan.unshift({mit,start,dur}); save('today', S.today);
      renderPlan(); addXP(5); statusEl.textContent='Planned.';
    };
    document.getElementById('ntAlarm').onclick = ()=>{
      const last = S.today.plan[0]; if(!last){ statusEl.textContent='Plan first.'; return; }
      if('Notification' in window){
        Notification.requestPermission().then(p=>{
          if(p==='granted'){ new Notification(`Reminder: ${last.mit} at ${last.start}`); statusEl.textContent='Reminder scheduled.'; }
        });
      } else { statusEl.textContent='Notifications unsupported.'; }
    };
    document.getElementById('ntFocus').onclick = ()=>{
      const last = S.today.plan[0]; if(!last){ statusEl.textContent='Plan first.'; return; }
      const totalSecs = last.dur*60; let startSecs = totalSecs;
      cancelTimer = runTimer(totalSecs, (secs)=>{
        clockEl.textContent = formatClock(secs);
        barEl.style.width = Math.round(((startSecs - secs)/startSecs)*100) + '%';
      }, ()=>{
        clockEl.textContent = '00:00'; barEl.style.width = '100%';
        statusEl.textContent = 'Focus complete. +20 XP';
        addXP(20); markStreak();
      });
      statusEl.textContent = 'Focus started.';
    };
    document.getElementById('ntCancel').onclick = ()=>{
      if(cancelTimer){ cancelTimer(); statusEl.textContent='Focus canceled.'; barEl.style.width='0%'; clockEl.textContent='00:00'; }
    };

    const queueEl = document.getElementById('ntQueue');
    document.getElementById('ntAdd').onclick = ()=>{
      const t = document.getElementById('ntTask').value.trim();
      const cat = document.getElementById('ntCat').value;
      if(!t) return;
      const div = document.createElement('div'); div.className='item';
      div.textContent = `[${cat}] ${t}`; queueEl.appendChild(div); addXP(1);
    };

    const woopEl = document.getElementById('ntWOOPView');
    const renderWOOP = ()=>{
      woopEl.innerHTML='';
      S.today.woop.slice(0,5).forEach(w=>{
        const div = document.createElement('div'); div.className='item';
        div.innerHTML = `<strong>Wish:</strong> ${w.wish}<br><strong>Outcome:</strong> ${w.outcome}<br><strong>Obstacle:</strong> ${w.obstacle}<br><strong>Plan:</strong> If ${w.obstacle} → then ${w.planIf}`;
        woopEl.appendChild(div);
      });
    };
    document.getElementById('ntWOOPSave').onclick = ()=>{
      const wish = document.getElementById('ntWish').value.trim();
      const outcome = document.getElementById('ntOutcome').value.trim();
      const obstacle = document.getElementById('ntObstacle').value.trim();
      const planIf = document.getElementById('ntPlanIf').value.trim();
      if(!wish || !outcome || !obstacle || !planIf) return;
      S.today.woop.unshift({wish,outcome,obstacle,planIf,ts:Date.now()});
      save('today', S.today); renderWOOP(); addXP(4);
    };

    const reviewEl = document.getElementById('ntReviewView');
    document.getElementById('ntReviewSave').onclick = ()=>{
      const txt = document.getElementById('ntReview').value.trim(); if(!txt) return;
      S.today.review = txt; save('today', S.today);
      reviewEl.textContent = txt; addXP(3);
    };

    renderPlan(); renderWOOP();
    clockEl.textContent = '00:00';
  };

  // Nuke XYZ
  const nukeXYZ = () => {
    bindThemeButtons();
    document.getElementById('nxSave').onclick = () => {
      const goal = document.getElementById('nxGoal').value.trim();
      const dl = document.getElementById('nxDeadline').value;
      if(!goal || !dl) return;
      S.xyz.goal = goal; S.xyz.deadline = dl; save('xyz', S.xyz);
      document.getElementById('nxView').textContent = `Mission: ${goal} → Deadline: ${dl}`; addXP(5);
    };
    document.querySelectorAll('[data-win]').forEach(b=> b.onclick = () => {
      const inc = parseInt(b.getAttribute('data-win'),10);
      S.xyz.progress = Math.min(100, Math.max(0, (S.xyz.progress||0) + inc));
      save('xyz', S.xyz); renderXYZ(); addXP(inc);
    });
    document.getElementById('nxReset').onclick = () => { S.xyz.progress = 0; save('xyz', S.xyz); renderXYZ(); };
    let nxTimer = null, nxSecs = 25*60;
    document.getElementById('nxStart').onclick = () => {
      const v = parseInt(document.getElementById('nxSession').value,10);
      nxSecs = v*60; renderNXClock();
      if(nxTimer) return;
      nxTimer = runTimer(nxSecs, (s)=>{ nxSecs=s; renderNXClock(); }, (done)=> {
        addXP(20); document.getElementById('nxFocusStatus').textContent = `Focus done → +20 XP`;
        nxTimer = null; renderNXClock();
      });
    };
    document.getElementById('nxStop').onclick = () => { if(nxTimer){ nxTimer(); nxTimer=null; renderNXClock(); } };
    document.getElementById('nxAdd').onclick = () => {
      const step = document.getElementById('nxTask').value.trim(); if(!step) return;
      S.xyz.roadmap.push({step, done:false}); save('xyz', S.xyz); renderRoadmap(); addXP(2);
    };
    const renderXYZ = () => {
      const pct = S.xyz.progress||0;
      document.getElementById('nxBar').style.width = `${pct}%`;
      document.getElementById('nxPct').textContent = `${pct}%`;
      const tips = document.getElementById('nxTips'); tips.innerHTML='';
      [[30,'Prep tools the night before'],[60,'Guard mornings: one hard win before messages'],[90,'Sprint day: 3 focus blocks, then ship']].forEach(([t,m])=>{
        if(pct>=t){ const d=document.createElement('div'); d.className='item'; d.textContent = `Unlocked @${t}% → ${m}`; tips.appendChild(d); }
      });
    };
    const renderNXClock = () => {
      const m = Math.floor(nxSecs/60).toString().padStart(2,'0');
      const s = (nxSecs%60).toString().padStart(2,'0');
      document.getElementById('nxClock').textContent = `${m}:${s}`;
    };
    const renderRoadmap = () => {
      const r = document.getElementById('nxRoadmap'); r.innerHTML='';
      S.xyz.roadmap.forEach((st,i)=>{
        const d = document.createElement('div'); d.className='item';
        d.innerHTML = `<label><input type="checkbox" ${st.done?'checked':''}> ${st.step}</label>`;
        const cb = d.querySelector('input'); cb.onchange = (e)=> {
          st.done = e.target.checked; save('xyz', S.xyz);
          addXP(e.target.checked?5:-5);
        };
        r.appendChild(d);
      });
    };
    // init
    renderXYZ(); renderRoadmap();
    document.getElementById('nxView').textContent = S.xyz.goal ? `Mission: ${S.xyz.goal} → Deadline: ${S.xyz.deadline}` : '';
  };

  // Nuclear System
  const nuclearSystem = () => {
    bindThemeButtons();
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const categories = ['Exam','Skill','Project','Health','Learning'];
    const container = document.getElementById('nsWeek'); container.innerHTML='';
    days.forEach(d=>{
      const day = document.createElement('div'); day.className='day';
      day.innerHTML = `<h3>${d} (20 pts)</h3>`;
      for(let i=0;i<2;i++){
        const row = document.createElement('div'); row.className='row';
        row.innerHTML = `
          <select class="nsCat">${categories.map(c=>`<option>${c}</option>`).join('')}</select>
          <input class="nsHard" type="range" min="1" max="10" value="5" />
          <span class="chip">hardness</span>
          <input class="nsUrg" type="range" min="1" max="10" value="5" />
          <span class="chip">urgency</span>
          <span class="chip nsPts">0 pts</span>
          <label><input class="nsDone" type="checkbox" /> done</label>
        `;
        day.appendChild(row);
      }
      container.appendChild(day);
    });

    const recalc = () => {
      let total = 0;
      document.querySelectorAll('.day').forEach(day=>{
        let dayPts = 0;
        const dones = day.querySelectorAll('.nsDone');
        const ptsEls = day.querySelectorAll('.nsPts');
        const hard = day.querySelectorAll('.nsHard');
        const urg = day.querySelectorAll('.nsUrg');
        for(let i=0;i<dones.length;i++){
          const h = parseInt(hard[i].value,10);
          const u = parseInt(urg[i].value,10);
          const pts = Math.min(20, Math.round((h*u)/10)); // behavior-weighted points
          ptsEls[i].textContent = `${pts} pts`;
          if(dones[i].checked) dayPts += pts;
        }
        dayPts = Math.min(20, dayPts); total += dayPts; // daily cap
      });
      S.nuclear.total = total; save('nuclear', S.nuclear);
      document.getElementById('nsTotal').textContent = total;
      document.getElementById('nsStatus').textContent = total>=70 ? '✅ Goal achieved!' : '⚠ Keep going!';
      if(total>=70){ addXP(30); markStreak(); renderBadges(); }
      // Update home progress on next load; localStorage already updated
    };
    document.getElementById('nsReset').onclick = () => {
      S.nuclear.total = 0; save('nuclear', S.nuclear);
      document.getElementById('nsTotal').textContent = 0;
      document.querySelectorAll('.nsDone').forEach(cb=>cb.checked=false);
      document.getElementById('nsStatus').textContent='Reset';
      renderBadges();
    };
    document.addEventListener('input', (e)=> {
      if(e.target.classList.contains('nsDone') || e.target.classList.contains('nsHard') || e.target.classList.contains('nsUrg')) recalc();
    });

    document.getElementById('nsSaveReview').onclick = () => {
      const txt = document.getElementById('nsReview').value.trim(); if(!txt) return;
      S.nuclear.review = txt; save('nuclear', S.nuclear);
      document.getElementById('nsReviewView').textContent = txt; addXP(5);
    };

    const renderBadges = () => {
      const b = document.getElementById('nsBadges'); if(!b) return;
      b.innerHTML='';
      const badges = [];
      if(S.streak>=3) badges.push('🔥 3‑day streak');
      if(S.level>=3) badges.push('🏅 Level 3');
      if((S.nuclear.total||0)>=90) badges.push('🚀 Weekly 75%+');
      badges.forEach(t=>{ const c=document.createElement('div'); c.className='chip'; c.textContent = t; b.appendChild(c); });
    };
    renderBadges();
  };

  return { home, attackMode, newMe, nukeToday, nukeXYZ, nuclearSystem };
})();
