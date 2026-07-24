/* ============================================================================
   MPS Workout Analytics  (Weapon 8)
   Reads logged history + PRs + conditioning, maps each set to a muscle group via
   the Exercise Library (window.MPS_EXERCISES, matched by canonical exerciseId or
   name), and renders trends, muscle balance, weak-spot detection, PR timeline, and
   most-performed. Self-contained: injects scoped styles (black + blue 3D theme).
   Use: MPSAnalytics.mount(elementOrId, { getHistory, getPRs, getConditioning })
============================================================================ */
window.MPSAnalytics = (function () {
  'use strict';
  var opts = {}, BYID = {}, BYNAME = {};

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }
  function pretty(s){ return String(s||'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}); }
  function fmt(n){ n=Math.round(n||0); return n.toLocaleString(); }
  function hist(){ try{ return (opts.getHistory&&opts.getHistory())||[]; }catch(e){ return []; } }
  function prsMap(){ try{ return (opts.getPRs&&opts.getPRs())||{}; }catch(e){ return {}; } }

  function buildMaps(){
    BYID={}; BYNAME={};
    (window.MPS_EXERCISES||[]).forEach(function(x){
      BYID[x.id]=x; BYNAME[x.name.toLowerCase()]=x;
      (x.aliases||[]).forEach(function(a){ if(!BYNAME[a.toLowerCase()]) BYNAME[a.toLowerCase()]=x; });
    });
  }
  function exOf(d){ return (d.exerciseId&&BYID[d.exerciseId]) || BYNAME[String(d.name||'').toLowerCase()] || null; }
  function regionOf(d){ var x=exOf(d); if(!x)return null; var p=x.placements.find(function(p){return p.role==='primary';})||x.placements[0]; return p?p.bodyRegion:null; }

  var REGION_LABEL={arms:'Arms',forearms:'Forearms',chest:'Chest',shoulders:'Shoulders',traps:'Traps',back:'Back',lower_back:'Lower Back',lats:'Lats',core:'Core',legs:'Legs'};
  function ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function weekStart(dateStr){ var d=new Date(dateStr+'T00:00:00'); d.setDate(d.getDate()-d.getDay()); return ymd(d); }
  function daysBetween(a,b){ return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000); }

  /* ---- compute everything from history ---- */
  function analyze(){
    var H=hist().slice().filter(function(h){return h&&h.date;}).sort(function(a,b){return a.date<b.date?-1:1;});
    var out={ empty:H.length===0, count:H.length };
    if(!H.length) return out;

    var totalVol=0,totalSets=0, dates={}, regionVol={}, exCount={};
    var weeks={};  // weekStart -> {vol, wsum, wsets, sessions}
    H.forEach(function(h){
      dates[h.date]=1;
      var wk=weekStart(h.date); var W=weeks[wk]||(weeks[wk]={vol:0,wsum:0,wsets:0,sessions:0}); W.sessions++;
      (h.detail||[]).forEach(function(d){
        if(!d||!d.sets)return;
        var region=d.isSkill?null:regionOf(d);
        var name=d.name; exCount[name]=(exCount[name]||0)+1;
        d.sets.forEach(function(s){
          if(!s||!s.done)return;
          var w=parseFloat(s.weight)||0, r=parseInt(s.reps)||0, v=w*r;
          totalSets++; totalVol+=v; W.vol+=v;
          if(!d.isSkill && w>0){ W.wsum+=w; W.wsets++; if(region){ regionVol[region]=(regionVol[region]||0)+v; } }
        });
      });
    });

    // streak (consecutive days back from most recent workout)
    var dl=Object.keys(dates).sort(); var last=dl[dl.length-1]; var streak=0, cur=last;
    while(dates[cur]){ streak++; var d=new Date(cur+'T00:00:00'); d.setDate(d.getDate()-1); cur=ymd(d); }

    // this month + sessions/week
    var now=last; var monthPrefix=now.slice(0,7);
    var thisMonth=Object.keys(dates).filter(function(x){return x.slice(0,7)===monthPrefix;}).length;
    var span=Math.max(1, daysBetween(dl[0], last)+1); var perWeek=(H.length/(span/7));

    // last 10 weeks series (aligned)
    var wkKeys=[]; var w0=weekStart(last);
    for(var i=9;i>=0;i--){ var d=new Date(w0+'T00:00:00'); d.setDate(d.getDate()-i*7); wkKeys.push(ymd(d)); }
    var strengthSeries=wkKeys.map(function(k){ var W=weeks[k]; return { k:k, v:(W&&W.wsets)?Math.round(W.wsum/W.wsets):0 }; });
    var volSeries=wkKeys.map(function(k){ var W=weeks[k]; return { k:k, v:W?Math.round(W.vol):0 }; });
    var freqSeries=wkKeys.map(function(k){ var W=weeks[k]; return { k:k, v:W?W.sessions:0 }; });

    // muscle balance (regions sorted by volume)
    var regions=Object.keys(REGION_LABEL).map(function(r){ return { r:r, label:REGION_LABEL[r], vol:Math.round(regionVol[r]||0) }; });
    regions.sort(function(a,b){ return b.vol-a.vol; });
    var maxRegion=regions.length?Math.max.apply(null,regions.map(function(x){return x.vol;})):0;
    var trained=regions.filter(function(x){return x.vol>0;});
    var weak=regions.filter(function(x){return x.vol>0;}).slice(-2).concat(regions.filter(function(x){return x.vol===0;})).slice(0,3);

    // PRs sorted by date
    var prs=Object.keys(prsMap()).map(function(n){ var p=prsMap()[n]; var w=(p&&typeof p==='object')?p.weight:p; var dt=(p&&p.date)||''; return { name:n, weight:w||0, date:dt }; }).filter(function(x){return x.weight>0;});
    prs.sort(function(a,b){ return (a.date<b.date?1:-1); });

    // most performed
    var most=Object.keys(exCount).map(function(n){ return { name:n, c:exCount[n] }; }).sort(function(a,b){ return b.c-a.c; }).slice(0,6);

    return Object.assign(out,{ totalVol:totalVol,totalSets:totalSets,streak:streak,thisMonth:thisMonth,perWeek:perWeek,
      strengthSeries:strengthSeries,volSeries:volSeries,freqSeries:freqSeries,regions:regions,maxRegion:maxRegion,
      trained:trained,weak:weak,prs:prs,most:most });
  }

  /* ---- rendering ---- */
  var CSS=''
   +'.mpsan{--a:var(--mps-accent,#4ab3f4);--argb:var(--mps-accent-rgb,74,179,244);--tx:var(--text,#eef2f6);--dim:var(--text-dim,#9aa6b2);--faint:var(--text-faint,#5f6a76);--ln:var(--border,#22262e);font-family:var(--body,Inter,system-ui,sans-serif);}'
   +'.mpsan-sub{color:var(--dim);font-size:13px;margin:0 0 16px;}'
   +'.mpsan-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:11px;margin-bottom:8px;}'
   +'.mpsan-stat{background:linear-gradient(180deg,#0e1015 0%,#0a0c12 100%);border:1px solid var(--ln);border-radius:12px;padding:16px 14px;text-align:center;box-shadow:0 10px 24px rgba(0,0,0,.85),0 4px 6px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);}'
   +'.mpsan-stat b{font-family:var(--disp,Oswald,sans-serif);font-size:30px;font-weight:600;color:var(--a);display:block;line-height:1;}'
   +'.mpsan-stat span{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);margin-top:6px;display:block;}'
   +'.mpsan-card{background:linear-gradient(180deg,#0e1015 0%,#0a0c12 100%);border:1px solid var(--ln);border-radius:14px;padding:18px;margin-top:16px;box-shadow:0 10px 24px rgba(0,0,0,.85),0 4px 6px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);}'
   +'.mpsan-h{font-family:var(--disp,Oswald,sans-serif);font-size:20px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--tx);display:flex;align-items:center;gap:11px;margin-bottom:16px;}'
   +'.mpsan-h::before{content:"";width:5px;height:20px;border-radius:3px;background:var(--a);box-shadow:0 0 14px rgba(var(--argb),.6);}'
   +'.mpsan-h small{margin-left:auto;font-family:var(--body,Inter,sans-serif);font-size:11px;letter-spacing:.5px;color:var(--faint);text-transform:none;font-weight:500;}'
   +'.mpsan-bars{display:flex;align-items:flex-end;gap:6px;height:130px;}'
   +'.mpsan-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;}'
   +'.mpsan-bar .fill{width:100%;border-radius:5px 5px 0 0;background:linear-gradient(180deg,var(--a),rgba(var(--argb),.35));box-shadow:0 0 10px rgba(var(--argb),.25);min-height:3px;transition:height .3s;}'
   +'.mpsan-bar .bv{font-size:10px;color:var(--dim);font-weight:600;}'
   +'.mpsan-bar .bl{font-size:9px;color:var(--faint);white-space:nowrap;}'
   +'.mpsan-row{margin-bottom:11px;}'
   +'.mpsan-row-top{display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;}.mpsan-row-top .n{color:var(--tx);font-weight:600;}.mpsan-row-top .v{color:var(--dim);font-family:var(--disp,Oswald,sans-serif);letter-spacing:.5px;}'
   +'.mpsan-track{height:16px;background:#0a0c10;border:1px solid var(--ln);border-radius:5px;overflow:hidden;}'
   +'.mpsan-track .f{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--a),rgba(var(--argb),.4));box-shadow:0 0 8px rgba(var(--argb),.3);min-width:2px;}'
   +'.mpsan-weak{display:flex;gap:8px;flex-wrap:wrap;}'
   +'.mpsan-weak .chip{background:#0a0c10;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:9px 13px;font-size:13px;color:var(--tx);}'
   +'.mpsan-weak .chip small{color:var(--faint);display:block;font-size:10px;text-transform:uppercase;letter-spacing:.6px;margin-top:2px;}'
   +'.mpsan-list .li{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-top:1px solid rgba(255,255,255,.05);font-size:13px;}.mpsan-list .li:first-child{border-top:none;}'
   +'.mpsan-list .li .nm{color:var(--tx);font-weight:500;}.mpsan-list .li .sub{color:var(--faint);font-size:11px;}.mpsan-list .li .val{color:var(--a);font-family:var(--disp,Oswald,sans-serif);font-weight:600;letter-spacing:.5px;font-size:15px;}'
   +'.mpsan-empty{color:var(--faint);text-align:center;padding:60px 20px;font-size:15px;line-height:1.7;}';

  function injectCSS(){ if(document.getElementById('mpsan-css'))return; var s=document.createElement('style'); s.id='mpsan-css'; s.textContent=CSS; document.head.appendChild(s); }

  function barChart(series, unit, fmtV){
    var max=Math.max.apply(null,series.map(function(x){return x.v;}).concat([1]));
    return '<div class="mpsan-bars">'+series.map(function(p){
      var h=Math.round((p.v/max)*110);
      var lbl=p.k.slice(5).replace('-','/');
      return '<div class="mpsan-bar"><div class="bv">'+(p.v?(fmtV?fmtV(p.v):p.v):'')+'</div><div class="fill" style="height:'+h+'px"></div><div class="bl">'+lbl+'</div></div>';
    }).join('')+'</div>';
  }

  function render(root){
    var A=analyze();
    if(A.empty){ root.innerHTML='<div class="mpsan-empty">No workouts logged yet.<br>Log a few sessions and your <b style="color:var(--mps-accent,#4ab3f4)">trends, muscle balance, and weak spots</b> appear here automatically.</div>'; return; }

    var html='<div class="mpsan-sub">Your training, measured — from <b style="color:var(--tx)">'+A.count+'</b> logged workouts.</div>';
    // overview
    html+='<div class="mpsan-grid">'
      +'<div class="mpsan-stat"><b>'+A.count+'</b><span>Workouts</span></div>'
      +'<div class="mpsan-stat"><b>'+A.streak+'</b><span>Day Streak</span></div>'
      +'<div class="mpsan-stat"><b>'+A.thisMonth+'</b><span>This Month</span></div>'
      +'<div class="mpsan-stat"><b>'+A.perWeek.toFixed(1)+'</b><span>Sessions / Wk</span></div>'
      +'<div class="mpsan-stat"><b>'+fmt(A.totalVol)+'</b><span>Total Volume</span></div>'
      +'<div class="mpsan-stat"><b>'+fmt(A.totalSets)+'</b><span>Total Sets</span></div>'
      +'</div>';
    // strength trend
    html+='<div class="mpsan-card"><div class="mpsan-h">Strength Trend<small>avg weight / set · 10 weeks</small></div>'+barChart(A.strengthSeries,'lb')+'</div>';
    // volume trend
    html+='<div class="mpsan-card"><div class="mpsan-h">Volume Trend<small>weekly volume (lb) · 10 weeks</small></div>'+barChart(A.volSeries,'lb',function(v){return v>=1000?(v/1000).toFixed(1)+'k':v;})+'</div>';
    // consistency
    html+='<div class="mpsan-card"><div class="mpsan-h">Consistency<small>workouts / week · 10 weeks</small></div>'+barChart(A.freqSeries)+'</div>';
    // muscle balance
    html+='<div class="mpsan-card"><div class="mpsan-h">Muscle Balance<small>volume by region</small></div>'+A.regions.map(function(x){
      var pct=A.maxRegion?Math.round((x.vol/A.maxRegion)*100):0;
      return '<div class="mpsan-row"><div class="mpsan-row-top"><span class="n">'+x.label+'</span><span class="v">'+fmt(x.vol)+' lb</span></div><div class="mpsan-track"><div class="f" style="width:'+pct+'%"></div></div></div>';
    }).join('')+'</div>';
    // weak spots
    if(A.weak.length) html+='<div class="mpsan-card"><div class="mpsan-h">Weak Spots<small>train these next</small></div><div class="mpsan-weak">'+A.weak.map(function(x){
      return '<div class="chip">'+x.label+'<small>'+(x.vol>0?fmt(x.vol)+' lb':'not trained')+'</small></div>';
    }).join('')+'</div></div>';
    // recent PRs
    if(A.prs.length) html+='<div class="mpsan-card"><div class="mpsan-h">Recent PRs<small>heaviest logged</small></div><div class="mpsan-list">'+A.prs.slice(0,8).map(function(p){
      return '<div class="li"><div><div class="nm">'+esc(p.name)+'</div>'+(p.date?'<div class="sub">'+esc(p.date)+'</div>':'')+'</div><div class="val">'+p.weight+' lb</div></div>';
    }).join('')+'</div></div>';
    // most performed
    if(A.most.length) html+='<div class="mpsan-card"><div class="mpsan-h">Most Performed<small>all time</small></div><div class="mpsan-list">'+A.most.map(function(m){
      return '<div class="li"><div class="nm">'+esc(m.name)+'</div><div class="val">'+m.c+'&times;</div></div>';
    }).join('')+'</div>';

    root.innerHTML=html;
  }

  function mount(elOrId,o){
    opts=o||{}; buildMaps();
    var root=(typeof elOrId==='string')?document.getElementById(elOrId):elOrId;
    if(!root)return;
    injectCSS(); root.classList.add('mpsan');
    render(root);
  }
  return { mount:mount };
})();
