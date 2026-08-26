/* ============================================================================
   MPS Exercise Library + Exercise Profile  (reusable component)
   Weapon 5 (browse/search/filter) + Weapon 6 (collapsible Exercise Profile).
   Self-contained: injects its own scoped styles, reads window.MPS_EXERCISES.
   Use: MPSLibrary.mount(elementOrId, { getHistory, getPRs })
     - getHistory(): optional () => [ {date, detail:[{name, isSkill, sets:[{weight,reps,done}]}]} ]
     - getPRs():     optional () => { exerciseName: {weight, date} }
   Standalone (no data fns) shows the structure with "log to unlock" states.
   Styles use the workout app's CSS vars with safe fallbacks so it fits in-app.
============================================================================ */
window.MPSLibrary = (function () {
  'use strict';
  var EX = [], byId = {}, mounted = null, opts = {};

  var REGIONS = [
    { id:'arms', label:'Arms', groups:[
      { label:'Biceps', subs:[['biceps_long_head','Long Head'],['biceps_short_head','Short Head'],['brachialis','Brachialis']] },
      { label:'Triceps', subs:[['triceps_long_head','Long Head'],['triceps_lateral_head','Lateral Head'],['triceps_medial_head','Medial Head']] } ] },
    { id:'forearms', label:'Forearms', groups:[{ label:null, single:true, subs:[['wrist_flexors','Wrist Flexors'],['wrist_extensors','Wrist Extensors'],['brachioradialis','Brachioradialis'],['grip_strength','Grip Strength']] }] },
    { id:'chest', label:'Chest', groups:[{ label:null, single:true, subs:[['upper_chest','Upper Chest'],['middle_chest','Middle Chest'],['lower_chest','Lower Chest'],['inner_chest','Inner Chest'],['outer_chest','Outer Chest']] }] },
    { id:'shoulders', label:'Shoulders', groups:[{ label:null, single:true, subs:[['front_delts','Front Delts'],['side_delts','Side Delts'],['rear_delts','Rear Delts']] }] },
    { id:'traps', label:'Traps', groups:[{ label:null, single:true, subs:[['upper_traps','Upper Traps'],['middle_traps','Middle Traps'],['lower_traps','Lower Traps']] }] },
    { id:'back', label:'Back', groups:[{ label:null, single:true, subs:[['upper_back','Upper Back'],['middle_back','Middle Back'],['lower_back','Lower Back','lower_back'],['spinal_stability','Spinal Stability','lower_back']] }] },
    { id:'lats', label:'Lats', groups:[{ label:null, single:true, subs:[['upper_lats','Upper Lats'],['lower_lats','Lower Lats']] }] },
    { id:'core', label:'Core', groups:[{ label:null, single:true, subs:[['upper_abs','Upper Abs'],['lower_abs','Lower Abs'],['obliques','Obliques'],['serratus','Serratus']] }] },
    { id:'legs', label:'Legs', groups:[
      { label:'Quads', subs:[['inner_quad','Inner Quad / Teardrop'],['outer_quad','Outer Quad'],['center_quad','Center Quad'],['overall_quads','Overall Quads']] },
      { label:'Hamstrings', subs:[['outer_hamstring','Outer Hamstring'],['inner_hamstring','Inner Hamstring']] },
      { label:'Calves', subs:[['upper_calves','Upper Calves'],['lower_calves','Lower Calves']] } ] },
    { id:'glutes', label:'Glutes / Hip', groups:[{ label:null, single:true, subs:[['upper_glutes','Upper Glutes','legs'],['glute_max','Glute Max','legs'],['side_glutes','Side Glutes','legs'],['adductors','Inner Thigh / Adductors','legs']] }] }
  ];
  var COMPOUND = [['horizontal_push','Horizontal Push'],['vertical_push','Vertical Push'],['horizontal_pull','Horizontal Pull'],['vertical_pull','Vertical Pull'],['squat','Squat'],['hinge','Hinge'],['lunge','Lunge'],['hip_extension','Hip Extension'],['dip','Dip'],['carry','Carry']];
  // Map a placement's raw (bodyRegion:subsection) to the DISPLAY region label the browse view uses,
  // honouring the source-region override (e.g. legs/upper_glutes shows under "Glutes / Hip").
  var SUBREG = {};
  REGIONS.forEach(function(reg){ (reg.groups||[]).forEach(function(g){ (g.subs||[]).forEach(function(s){ SUBREG[(s[2]||reg.id)+':'+s[0]] = reg.label; }); }); });

  function pretty(s){ return String(s||'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }
  function inSub(x,r,s){ return x.placements.some(function(p){return !p.hidden&&p.bodyRegion===r&&p.subsection===s;}); }
  function roleIn(x,r,s){ var p=x.placements.find(function(p){return p.bodyRegion===r&&p.subsection===s;}); return p?p.role:null; }

  function ic(){ return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M4 8.5v7M17.5 6.5v11M20 8.5v7M6.5 12h11"/></svg>'; }
  function chev(){ return '<svg class="mpslib-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>'; }

  var CSS = ''
    + '.mpslib{--a:var(--mps-accent,#4ab3f4);--argb:var(--mps-accent-rgb,74,179,244);--tx:var(--text,#eef2f6);--dim:var(--text-dim,#9aa6b2);--faint:var(--text-faint,#5f6a76);--ln:var(--border,#223052);--c1:var(--card,#0e1526);--c2:var(--card-2,#141d33);--gold:#ffffff;font-family:var(--body,Inter,system-ui,sans-serif);}'
    + '.mpslib-sub{color:var(--dim);font-size:13px;margin:0 0 14px;}.mpslib-sub b{color:var(--a);}'
    + '.mpslib-search-wrap{position:relative;}.mpslib-search{width:100%;background:var(--c1);border:1px solid var(--ln);color:var(--tx);border-radius:12px;padding:13px 14px 13px 42px;font-size:15px;font-family:inherit;}.mpslib-search:focus{outline:none;border-color:var(--a);}.mpslib-search-wrap svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--faint);}'
    + '.mpslib-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;}.mpslib-chip{font-size:12px;padding:8px 14px;border-radius:16px;background:linear-gradient(180deg,#161a20,#0b0d11);border:1px solid var(--ln);color:var(--dim);cursor:pointer;text-transform:capitalize;transition:.12s;box-shadow:0 3px 7px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);}.mpslib-chip:active{transform:translateY(1px);}.mpslib-chip.on{background:rgba(var(--argb),.18);border-color:var(--a);color:#fff;}'
    + '.mpslib-region{margin-top:18px;}'
    + '.mpslib-group{background:linear-gradient(180deg,#0c0e12 0%,#08090d 100%);border:1px solid var(--ln);border-radius:16px;padding:10px 20px 24px;margin-bottom:36px;box-shadow:0 12px 28px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.05);}'
    + '.mpslib-rhead{display:flex;align-items:center;gap:12px;padding:16px 6px 14px;cursor:pointer;user-select:none;border-bottom:2px solid var(--ln);}.mpslib-rhead:hover{background:transparent;}'
    + '.mpslib-ric{color:var(--a);flex-shrink:0;}.mpslib-rtitle{font-family:var(--disp,Oswald,sans-serif);font-weight:700;font-size:38px;letter-spacing:1.5px;flex:1;}.mpslib-rcount{font-size:12px;color:var(--faint);letter-spacing:1px;}'
    + '.mpslib-chev{color:var(--faint);transition:transform .18s;}.mpslib-region.open .mpslib-chev,.mpslib-region[open] .mpslib-chev{transform:rotate(90deg);}'
    + '.mpslib-rbody{display:none;padding:8px 0 4px;}.mpslib-region.open .mpslib-rbody,.mpslib-region[open] .mpslib-rbody{display:block;}'
    + '.mpslib-region>summary{list-style:none;outline:none;}.mpslib-region>summary::-webkit-details-marker{display:none;}.mpslib-region>summary::marker{content:"";font-size:0;}'
    + '.mpslib-glabel{display:flex;align-items:center;gap:13px;font-family:var(--disp,Oswald,sans-serif);font-size:30px;font-weight:500;letter-spacing:3px;text-transform:uppercase;color:var(--tx);margin:18px 2px 14px;line-height:1;}.mpslib-glabel::before{content:"";width:7px;height:30px;border-radius:3px;background:var(--a);box-shadow:0 0 16px rgba(var(--argb),.6);}.mpslib-glabel .cnt{font-family:var(--body,Inter,sans-serif);font-size:14px;font-weight:500;letter-spacing:.5px;color:var(--faint);text-transform:none;}'
    + '.mpslib-slabel{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:1.6px;font-size:14px;text-transform:uppercase;color:var(--dim);margin:26px 2px 10px;padding-bottom:8px;border-bottom:1px solid var(--ln);}.mpslib-slabel span{color:var(--faint);font-weight:600;}.mpslib-glabel + .mpslib-slabel{margin-top:2px;}.mpslib-group > .mpslib-slabel:first-child{margin-top:6px;}'
    + '.mpslib-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:10px;}@media(min-width:760px){.mpslib-cards{grid-template-columns:repeat(5,minmax(0,1fr));}}'
    + '.mpslib-ex{display:flex;flex-direction:column;min-height:96px;background:linear-gradient(180deg,#0e1015 0%,#0a0c12 100%);border:1px solid var(--ln);border-radius:12px;padding:15px 15px 13px 19px;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;position:relative;overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.85),0 4px 6px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);}.mpslib-ex:hover{border-color:var(--a);transform:translateY(-3px);box-shadow:0 16px 32px rgba(0,0,0,.9),0 0 0 1px rgba(var(--argb),.3),inset 0 1px 0 rgba(255,255,255,.09);}'
    + '.mpslib-ex::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 3px 3px 0;background:var(--a);box-shadow:0 0 10px rgba(var(--argb),.5);}'
    + '.mpslib-exn{font-weight:600;font-size:15px;line-height:1.3;color:var(--tx);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;padding-right:26px;}'
    + '.mpslib-exm{margin-top:auto;padding-top:12px;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--faint);}.mpslib-exm .eq{color:var(--dim);}'
    + '.mpslib-meta{display:flex;gap:6px;flex-wrap:wrap;}.mpslib-tag{font-size:10px;letter-spacing:.4px;padding:3px 7px;border-radius:6px;background:rgba(255,255,255,.05);color:var(--dim);border:1px solid var(--ln);text-transform:capitalize;}.mpslib-tag.acc{color:var(--a);border-color:rgba(var(--argb),.4);background:rgba(var(--argb),.08);}.mpslib-tag.dim{background:transparent;border-color:transparent;color:var(--faint);padding-left:0;padding-right:8px;letter-spacing:1px;text-transform:uppercase;font-size:9px;}'
    + '.mpslib-ref{position:absolute;top:10px;right:10px;font-size:9px;font-weight:700;color:var(--dim);border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.07);padding:2px 5px;border-radius:5px;}'
    + '.mpslib-empty{color:var(--faint);text-align:center;padding:36px;font-size:14px;}'
    /* profile drawer */
    + '.mpslib-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.74);z-index:2147483000;padding:16px;overflow-y:auto;}.mpslib-bg.on{display:block;}'
    + '.mpslib-draw{max-width:540px;margin:20px auto;background:linear-gradient(160deg,#151a21,#0c0f13);border:1px solid rgba(var(--argb),.35);border-radius:16px;padding:20px 20px 8px;box-shadow:0 24px 60px rgba(0,0,0,.7);}'
    + '.mpslib-dh{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:4px;}.mpslib-dh h2{font-family:var(--disp,Oswald,sans-serif);font-weight:600;font-size:23px;letter-spacing:.5px;color:var(--tx);}.mpslib-close{cursor:pointer;color:var(--dim);font-size:26px;line-height:1;flex-shrink:0;}'
    + '.mpslib-aka{color:var(--dim);font-size:12px;margin-bottom:8px;}'
    + '.mpslib-info{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;}'
    + '.mpslib-sec{border-top:1px solid var(--ln);}.mpslib-sec-h{display:flex;align-items:center;gap:9px;padding:13px 2px;cursor:pointer;user-select:none;}.mpslib-sec-h .mpslib-chev{margin-left:auto;}'
    + '.mpslib-sec-ic{color:var(--a);display:flex;}.mpslib-sec-t{font-family:var(--disp,Oswald,sans-serif);font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:var(--tx);}'
    + '.mpslib-sec.open .mpslib-chev{transform:rotate(90deg);}.mpslib-sec-b{display:none;padding:0 2px 14px;}.mpslib-sec.open .mpslib-sec-b{display:block;}'
    + '.mpslib-lock{color:var(--faint);font-size:13px;line-height:1.5;}'
    + '.mpslib-stat-row{display:flex;gap:10px;flex-wrap:wrap;}'
    + '.mpslib-stat{flex:1;min-width:88px;background:var(--c2);border:1px solid var(--ln);border-radius:10px;padding:11px;text-align:center;}.mpslib-stat b{font-family:var(--disp,Oswald,sans-serif);font-size:22px;font-weight:600;color:var(--tx);display:block;line-height:1;}.mpslib-stat span{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--dim);}'
    + '.mpslib-krow{display:flex;padding:8px 0;font-size:13px;border-top:1px solid rgba(255,255,255,.04);}.mpslib-krow .k{width:120px;color:var(--faint);flex-shrink:0;text-transform:uppercase;font-size:11px;letter-spacing:1px;padding-top:2px;}.mpslib-krow .v{flex:1;color:var(--tx);}'
    + '.mpslib-appears{display:flex;gap:6px;flex-wrap:wrap;}'
    + '.mpslib-cats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;}'
    + '.mpslib-cat{flex:1;min-width:150px;display:flex;align-items:center;justify-content:center;gap:10px;padding:17px;border-radius:14px;background:linear-gradient(180deg,#13161c,#0a0c11);border:1px solid var(--ln);color:var(--dim);cursor:pointer;font-family:var(--disp,Oswald,sans-serif);font-weight:600;font-size:15px;letter-spacing:1.5px;text-transform:uppercase;transition:transform .14s,box-shadow .14s,border-color .14s;box-shadow:0 8px 18px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06);}.mpslib-cat:active{transform:translateY(1px);}'
    + '.mpslib-cat:hover{border-color:var(--a);color:var(--tx);}'
    + '.mpslib-cat.on{background:rgba(var(--argb),.16);border-color:var(--a);color:#fff;}'
    + '.mpslib-cat.soon{opacity:.6;}.mpslib-cat .badge{font-family:var(--body,Inter,sans-serif);font-size:9px;letter-spacing:.5px;text-transform:none;color:var(--faint);border:1px solid var(--ln);border-radius:8px;padding:1px 6px;}'
    + '.mpslib-soon{color:var(--faint);text-align:center;padding:52px 20px;font-size:14px;line-height:1.7;}';

  function injectCSS(){ if(document.getElementById('mpslib-css'))return; var s=document.createElement('style'); s.id='mpslib-css'; s.textContent=CSS; document.head.appendChild(s); }

  /* ---- history helpers (optional; graceful when absent) ---- */
  function hist(){ try{ return (opts.getHistory&&opts.getHistory())||[]; }catch(e){ return []; } }
  function prsMap(){ try{ return (opts.getPRs&&opts.getPRs())||{}; }catch(e){ return {}; } }
  // pull all logged sets for an exercise (matched by canonical name or alias, against history detail names)
  function loggedSets(x){
    var names={}; names[x.name.toLowerCase()]=1; (x.aliases||[]).forEach(function(a){names[a.toLowerCase()]=1;});
    var out=[];
    hist().forEach(function(h){ (h.detail||[]).forEach(function(d){
      if(!d||!d.name||!names[String(d.name).toLowerCase()])return;
      (d.sets||[]).forEach(function(s){ if(s&&s.done){ out.push({date:h.date, weight:parseFloat(s.weight)||0, reps:parseInt(s.reps)||0}); } });
    });});
    return out;
  }
  function epley(w,r){ return r>1? Math.round(w*(1+r/30)) : w; }

  /* ---- browse render ---- */
  function card(x,ref,showMuscle){
    var meta = (showMuscle ? '<span class="eq">'+esc(pretty(x.primaryMuscles[0]||''))+'</span> &middot; ' : '')
      + '<span class="eq">'+esc(pretty(x.equipment[0]||''))+'</span> &middot; ' + esc(pretty(x.difficulty));
    return '<div class="mpslib-ex" data-id="'+x.id+'">'+(ref?'<span class="mpslib-ref">REF</span>':'')
      +'<div class="mpslib-exn">'+esc(x.name)+'</div>'
      +'<div class="mpslib-exm">'+meta+'</div></div>';
  }
  var state={ q:'', eq:{}, df:{} };
  function passFilter(x){
    var eq=Object.keys(state.eq).filter(function(k){return state.eq[k];});
    var df=Object.keys(state.df).filter(function(k){return state.df[k];});
    if(eq.length && !x.equipment.some(function(e){return state.eq[e];})) return false;
    if(df.length && !state.df[x.difficulty]) return false;
    return true;
  }
  function matchQ(x){ if(!state.q)return true; var s=state.q.toLowerCase(); return x.name.toLowerCase().indexOf(s)>=0 || (x.aliases||[]).some(function(a){return a.toLowerCase().indexOf(s)>=0;}); }

  function renderResults(root){
    var R=root.querySelector('.mpslib-results');
    if(state.q){
      var hits=EX.filter(function(x){return matchQ(x)&&passFilter(x);}).sort(function(a,b){return a.name.localeCompare(b.name);});
      R.innerHTML = hits.length ? '<div class="mpslib-region open"><div class="mpslib-rbody" style="display:block;padding-top:14px"><div class="mpslib-slabel">Search results <span>'+hits.length+'</span></div><div class="mpslib-cards">'+hits.map(function(x){return card(x,false,true);}).join('')+'</div></div></div>' : '<div class="mpslib-empty">No exercises match "'+esc(state.q)+'".</div>';
      wireCards(root); return;
    }
    var html='';
    REGIONS.forEach(function(reg,ri){
      var inner='',count=0;
      reg.groups.forEach(function(g){
        if(g.label){
          // real group (Biceps, Triceps, Quads...) -> ONE container box
          var body='';
          g.subs.forEach(function(pair){
            var sid=pair[0], slabel=pair[1], sreg=pair[2]||reg.id;
            var list=EX.filter(function(x){return inSub(x,sreg,sid)&&passFilter(x);});
            if(!list.length)return; count+=list.length;
            body+='<div class="mpslib-slabel">'+slabel+' <span>'+list.length+'</span></div><div class="mpslib-cards">'+list.map(function(x){return card(x, roleIn(x,sreg,sid)==='reference');}).join('')+'</div>';
          });
          if(body) inner+='<div class="mpslib-group"><div class="mpslib-glabel">'+g.label+'</div>'+body+'</div>';
        } else if(g.single){
          // group-less region shown as ONE container (e.g. Forearms) with its subsections inside
          var sbody='';
          g.subs.forEach(function(pair){
            var sid=pair[0], slabel=pair[1], sreg=pair[2]||reg.id;
            var list=EX.filter(function(x){return inSub(x,sreg,sid)&&passFilter(x);});
            if(!list.length)return; count+=list.length;
            sbody+='<div class="mpslib-slabel">'+slabel+' <span>'+list.length+'</span></div><div class="mpslib-cards">'+list.map(function(x){return card(x, roleIn(x,sreg,sid)==='reference');}).join('')+'</div>';
          });
          if(sbody) inner+='<div class="mpslib-group">'+sbody+'</div>';
        } else {
          // group-less region (Chest, Lats...) -> each subsection is its own container box
          g.subs.forEach(function(pair){
            var sid=pair[0], slabel=pair[1], sreg=pair[2]||reg.id;
            var list=EX.filter(function(x){return inSub(x,sreg,sid)&&passFilter(x);});
            if(!list.length)return; count+=list.length;
            inner+='<div class="mpslib-group"><div class="mpslib-glabel">'+slabel+' <span class="cnt">'+list.length+'</span></div><div class="mpslib-cards">'+list.map(function(x){return card(x, roleIn(x,sreg,sid)==='reference');}).join('')+'</div></div>';
          });
        }
      });
      if(!inner)return;
      if(reg.bare){
        // no region title bar (e.g. Lower Back, whose title duplicates its subsection) — always shown
        html+='<div class="mpslib-region open"><div class="mpslib-rbody" style="display:block">'+inner+'</div></div>';
      } else {
        html+='<details class="mpslib-region"'+(ri===0?' open':'')+'><summary class="mpslib-rhead"><span class="mpslib-ric">'+ic()+'</span><span class="mpslib-rtitle">'+reg.label+'</span><span class="mpslib-rcount">'+count+'</span>'+chev()+'</summary><div class="mpslib-rbody">'+inner+'</div></details>';
      }
    });
    var cCards=[];
    COMPOUND.forEach(function(pair){
      EX.filter(function(x){return x.collections.indexOf('compound:'+pair[0])>=0&&passFilter(x);}).forEach(function(x){ cCards.push(card(x,false)); });
    });
    if(cCards.length) html+='<details class="mpslib-region"><summary class="mpslib-rhead"><span class="mpslib-ric">'+ic()+'</span><span class="mpslib-rtitle">Compound Lifts</span><span class="mpslib-rcount">'+cCards.length+'</span>'+chev()+'</summary><div class="mpslib-rbody"><div class="mpslib-group"><div class="mpslib-cards">'+cCards.join('')+'</div></div></div></details>';
    R.innerHTML=html||'<div class="mpslib-empty">No exercises match these filters.</div>';
    /* region toggling is native <details>/<summary> now (shell scroll-fix whitelists these) */
    wireCards(root);
  }
  function wireCards(root){ root.querySelectorAll('.mpslib-ex').forEach(function(e){ e.onclick=function(){ openProfile(e.getAttribute('data-id')); }; }); }

  /* ---- Weapon 6: Exercise Profile ---- */
  var SEC_IC = {
    pr:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 4H4v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 1-3 3"/></svg>',
    prog:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    stats:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="12"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="9"/></svg>',
    est:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6"/></svg>',
    target:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>'
  };
  function sec(id,icon,title,body,open){
    return '<div class="mpslib-sec'+(open?' open':'')+'" data-sec="'+id+'"><div class="mpslib-sec-h"><span class="mpslib-sec-ic">'+icon+'</span><span class="mpslib-sec-t">'+title+'</span>'+chev()+'</div><div class="mpslib-sec-b">'+body+'</div></div>';
  }
  function lock(msg){ return '<div class="mpslib-lock">'+msg+'</div>'; }

  function buildProfile(x){
    var sets=loggedSets(x), pr=prsMap()[x.name];
    var best=null; sets.forEach(function(s){ if(s.weight>0&&(!best||s.weight>best.weight||(s.weight===best.weight&&s.reps>best.reps))) best=s; });
    if(!best && pr && pr.weight) best={weight:pr.weight, reps:(pr.reps||1), date:pr.date};
    var canWeight = x.tracking.supportsWeight;

    // PR section
    var prBody;
    if(best && best.weight){ prBody='<div class="mpslib-stat-row"><div class="mpslib-stat"><b>'+best.weight+'</b><span>Best Weight (lb)</span></div><div class="mpslib-stat"><b>'+(best.reps||1)+'</b><span>Reps</span></div>'+(canWeight?'<div class="mpslib-stat"><b>'+epley(best.weight,best.reps||1)+'</b><span>Est. 1RM</span></div>':'')+'</div>'+(best.date?'<div class="mpslib-krow"><div class="k">Set on</div><div class="v">'+esc(best.date)+'</div></div>':''); }
    else { prBody=lock('No records yet. Log this '+(canWeight?'lift':'exercise')+' and your first PR lands here automatically.'); }

    // Progression (last sessions)
    var progBody;
    if(sets.length){
      var byDate={}; sets.forEach(function(s){ var top=byDate[s.date]; if(!top||s.weight>top) byDate[s.date]=s.weight; });
      var rows=Object.keys(byDate).sort().slice(-6).map(function(d){ return '<div class="mpslib-krow"><div class="k">'+esc(d)+'</div><div class="v">'+byDate[d]+' lb top set</div></div>'; }).join('');
      progBody=rows||lock('Not enough data yet.');
    } else { progBody=lock('Your weight-over-time chart appears here once you log a few sessions.'); }

    // Lifetime stats
    var statsBody;
    if(sets.length){
      var totalSets=sets.length, totalReps=0, vol=0, days={};
      sets.forEach(function(s){ totalReps+=s.reps; vol+=s.weight*s.reps; days[s.date]=1; });
      statsBody='<div class="mpslib-stat-row"><div class="mpslib-stat"><b>'+Object.keys(days).length+'</b><span>Sessions</span></div><div class="mpslib-stat"><b>'+totalSets+'</b><span>Sets</span></div><div class="mpslib-stat"><b>'+totalReps+'</b><span>Reps</span></div><div class="mpslib-stat"><b>'+Math.round(vol).toLocaleString()+'</b><span>Volume (lb)</span></div></div>';
    } else { statsBody=lock('Lifetime sets, reps, and volume total up here as you train.'); }

    // Estimates (rep-max table from best set)
    var estBody;
    if(best && best.weight && canWeight){
      var orm=epley(best.weight,best.reps||1);
      var reps=[1,3,5,8,10,12];
      estBody='<div class="mpslib-krow"><div class="k">Est. 1RM</div><div class="v">'+orm+' lb</div></div>'+reps.map(function(r){ var w=Math.round(orm/(1+r/30)/2.5)*2.5; return '<div class="mpslib-krow"><div class="k">'+r+'-rep max</div><div class="v">'+w+' lb</div></div>'; }).join('');
    } else { estBody=lock('Estimated 1RM and a full rep-max table calculate from your best logged set.'); }

    // Next target
    var tgtBody;
    if(best && best.weight && canWeight){
      var next=Math.round((best.weight+ (best.weight<100?5:5))/2.5)*2.5;
      tgtBody='<div class="mpslib-stat-row"><div class="mpslib-stat"><b>'+next+'</b><span>Target Weight</span></div><div class="mpslib-stat"><b>'+(best.reps||1)+'+</b><span>Target Reps</span></div></div><div class="mpslib-lock" style="margin-top:8px">Beat '+best.weight+'×'+(best.reps||1)+' next session. Small, steady jumps win.</div>';
    } else { tgtBody=lock('Once you log a set, we suggest the next weight to chase.'); }

    var info='<span class="mpslib-tag acc">'+esc(pretty(x.primaryMuscles[0]||''))+'</span>'
      + x.secondaryMuscles.slice(0,3).map(function(m){return '<span class="mpslib-tag">'+esc(pretty(m))+'</span>';}).join('')
      + '<span class="mpslib-tag">'+esc(pretty(x.equipment[0]||''))+'</span><span class="mpslib-tag">'+esc(x.difficulty)+'</span><span class="mpslib-tag">'+esc(pretty(x.movementPattern))+'</span>';
    var appears=x.placements.filter(function(p){return !p.hidden;}).map(function(p){ var dr=SUBREG[p.bodyRegion+':'+p.subsection]||pretty(p.bodyRegion); return '<span class="mpslib-tag">'+esc(dr)+' · '+esc(pretty(p.subsection))+(p.role==='reference'?' <b style="color:var(--gold)">ref</b>':'')+'</span>'; }).join('');

    return '<div class="mpslib-dh"><h2>'+esc(x.name)+'</h2><span class="mpslib-close">&times;</span></div>'
      + (x.aliases&&x.aliases.length?'<div class="mpslib-aka">a.k.a. '+esc(x.aliases.join(', '))+'</div>':'')
      + '<div class="mpslib-info">'+info+'</div>'
      + sec('pr', SEC_IC.pr, 'Personal Records', prBody, true)
      + sec('prog', SEC_IC.prog, 'Progression', progBody, false)
      + sec('stats', SEC_IC.stats, 'Lifetime Stats', statsBody, false)
      + sec('est', SEC_IC.est, 'Estimates', estBody, false)
      + sec('target', SEC_IC.target, 'Next Target', tgtBody, false)
      + sec('about', SEC_IC.stats, 'Details', '<div class="mpslib-krow"><div class="k">Appears in</div><div class="v mpslib-appears">'+appears+'</div></div><div class="mpslib-krow"><div class="k">How-to</div><div class="v">'+((x.instructions&&x.instructions.execution)?esc(x.instructions.execution):'<span class="mpslib-lock">Instructions + demo added in the content pass.</span>')+'</div></div>', false);
  }

  var _profScroller=null, _profTop=0, _profWin=0;
  function _findScroller(){
    var best=document.scrollingElement||document.documentElement, max=(best.scrollHeight-best.clientHeight)||0;
    ['#tab-library','.tab-content'].forEach(function(sel){ document.querySelectorAll(sel).forEach(function(el){ var m=el.scrollHeight-el.clientHeight, oy=getComputedStyle(el).overflowY; if(m>max&&(oy==='auto'||oy==='scroll')){best=el;max=m;} }); });
    return best;
  }
  function openProfile(id){
    var x=byId[id]; if(!x)return;
    _profScroller=_findScroller(); _profTop=_profScroller.scrollTop; _profWin=window.scrollY||0;  // remember position
    var bg=document.getElementById('mpslib-bg');
    var draw=bg.querySelector('.mpslib-draw');
    draw.innerHTML=buildProfile(x);
    draw.querySelector('.mpslib-close').onclick=closeProfile;
    draw.querySelectorAll('.mpslib-sec-h').forEach(function(h){ h.onclick=function(){ h.parentElement.classList.toggle('open'); }; });
    bg.classList.add('on');
  }
  function closeProfile(){
    document.getElementById('mpslib-bg').classList.remove('on');
    try{ if(_profScroller) _profScroller.scrollTop=_profTop; if(_profWin) window.scrollTo(0,_profWin); }catch(e){}  // stay in place
  }

  function ensureDrawer(){
    if(document.getElementById('mpslib-bg'))return;
    var bg=document.createElement('div'); bg.className='mpslib-bg'; bg.id='mpslib-bg';
    bg.innerHTML='<div class="mpslib-draw"></div>';
    bg.onclick=function(e){ if(e.target===bg) closeProfile(); };
    document.body.appendChild(bg);
  }

  var CAT_IC = {
    weight: ic(),
    skill: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
    cond: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 20 9 4 6 12 2 12"/></svg>'
  };

  // Weightlifting library UI (search + filters + region browse) rendered into a container.
  function renderWeightUI(c){
    var equip=[]; EX.forEach(function(x){ x.equipment.forEach(function(e){ if(equip.indexOf(e)<0)equip.push(e); }); }); equip.sort();
    var diff=['beginner','intermediate','advanced'];
    c.innerHTML='<div class="mpslib-sub"><b>'+EX.length+'</b> exercises · browse by body region, or search</div>'
      +'<div class="mpslib-search-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input class="mpslib-search" placeholder="Search exercises (bench, curl, squat...)"></div>'
      +'<div class="mpslib-chips mpslib-eq">'+equip.map(function(e){return '<span class="mpslib-chip'+(state.eq[e]?' on':'')+'" data-eq="'+e+'">'+e+'</span>';}).join('')+'</div>'
      +'<div class="mpslib-chips mpslib-df">'+diff.map(function(d){return '<span class="mpslib-chip'+(state.df[d]?' on':'')+'" data-df="'+d+'">'+d+'</span>';}).join('')+'</div>'
      +'<div class="mpslib-results"></div>';
    var inp=c.querySelector('.mpslib-search'); inp.value=state.q||'';
    inp.addEventListener('input',function(e){ state.q=e.target.value.trim(); renderResults(c); });
    c.querySelectorAll('[data-eq]').forEach(function(b){ b.onclick=function(){ state.eq[b.dataset.eq]=!state.eq[b.dataset.eq]; b.classList.toggle('on'); renderResults(c); }; });
    c.querySelectorAll('[data-df]').forEach(function(b){ b.onclick=function(){ state.df[b.dataset.df]=!state.df[b.dataset.df]; b.classList.toggle('on'); renderResults(c); }; });
    renderResults(c);
  }

  function renderCategory(root, cat){
    var c=root.querySelector('.mpslib-cat-content'); if(!c)return;
    if(cat==='weight'){ renderWeightUI(c); return; }
    var name = (cat==='skill') ? 'Skill Work' : 'Conditioning';
    c.innerHTML='<div class="mpslib-soon">The <b style="color:var(--text,#fff)">'+name+'</b> library is coming next.<br>For now, <b style="color:var(--mps-accent,#4ab3f4)">Weightlifting</b> holds all '+EX.length+' exercises.</div>';
  }

  function mount(elOrId, o){
    opts=o||{};
    EX=(window.MPS_EXERCISES||[]).filter(function(x){return x&&x.id&&Array.isArray(x.placements)&&Array.isArray(x.equipment)&&Array.isArray(x.primaryMuscles)&&Array.isArray(x.secondaryMuscles)&&Array.isArray(x.collections)&&x.tracking;});
    byId={}; EX.forEach(function(x){ byId[x.id]=x; });
    var root=(typeof elOrId==='string')?document.getElementById(elOrId):elOrId;
    if(!root)return;
    injectCSS(); ensureDrawer();
    root.classList.add('mpslib');
    root.innerHTML='<div class="mpslib-cats">'
      +'<button class="mpslib-cat on" data-cat="weight">'+CAT_IC.weight+' Weightlifting</button>'
      +'<button class="mpslib-cat soon" data-cat="skill">'+CAT_IC.skill+' Skill Work <span class="badge">soon</span></button>'
      +'<button class="mpslib-cat soon" data-cat="cond">'+CAT_IC.cond+' Conditioning <span class="badge">soon</span></button>'
      +'</div><div class="mpslib-cat-content"></div>';
    root.querySelectorAll('[data-cat]').forEach(function(b){ b.onclick=function(){
      root.querySelectorAll('[data-cat]').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on');
      renderCategory(root, b.dataset.cat);
    }; });
    renderCategory(root,'weight');
    mounted=root;
  }

  return { mount:mount };
})();
