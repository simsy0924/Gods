import React, { useMemo, useState } from "react";
import { Shield, Sword, Crosshair, Wrench, Cpu, Zap, RotateCcw, Skull, Trophy, RadioTower, Flame, Target, Hammer, AlertTriangle, ChevronRight } from "lucide-react";

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const fmt=n=>Math.floor(n).toLocaleString("ko-KR");
const pct=(v,m)=>`${clamp(v/m*100,0,100)}%`;

const units={
  walker:{name:"M-01 워커",icon:"◇",role:"전선",cost:28,hp:16,atk:20,def:0.2,desc:"기본 양산형 로봇. 군단 사격 화력을 만든다."},
  tank:{name:"아이언 몰 전차",icon:"▰",role:"중화기",cost:70,hp:42,atk:58,def:0.6,desc:"비싸지만 강한 화력. 보호막 제거에 좋다."},
  bulwark:{name:"불워크 드론",icon:"⬡",role:"방어",cost:55,hp:55,atk:8,def:3.8,desc:"피해를 줄이는 방패 드론."},
  fixer:{name:"픽서 드론",icon:"+",role:"수리",cost:62,hp:24,atk:4,def:0.3,repair:26,desc:"턴 종료 후 메인 로봇을 수리한다."},
  oracle:{name:"오라클 드론",icon:"◎",role:"해석",cost:68,hp:20,atk:3,def:0.1,will:4,desc:"의지 수급과 노아 교란을 보조한다."},
  martyr:{name:"마터 드론",icon:"✦",role:"자폭",cost:48,hp:1,atk:0,def:0,burst:230,desc:"군단 사격 때 소모되어 큰 관통 피해를 준다."},
};

const robotBase=[
  {id:"atlas",name:"아틀라스",sub:"움직이는 성벽",icon:Shield,maxHp:720,hp:720,atk:55,cd:0,maxCd:2,cp:1,skill:"거신의 방패",desc:"이번 보스 권능 피해를 크게 줄이고 태양창/낙인을 대신 받는다."},
  {id:"valkyrion",name:"발키리온",sub:"신체 절단 병기",icon:Sword,maxHp:470,hp:470,atk:95,cd:0,maxCd:2,cp:2,skill:"약점 절단",desc:"즉시 피해를 주고 2턴 동안 받는 피해를 증가시킨다."},
  {id:"hecaton",name:"헤카톤",sub:"대신성 포격 플랫폼",icon:Crosshair,maxHp:520,hp:520,atk:120,cd:0,maxCd:3,cp:2,skill:"종말포",desc:"보호막을 크게 깎고 관통 피해를 준다."},
  {id:"seraphim",name:"세라핌",sub:"인공 축복 프로토콜",icon:Wrench,maxHp:460,hp:460,atk:28,cd:0,maxCd:3,cp:1,skill:"긴급 복구",desc:"모든 메인 로봇을 수리하고 이번 턴 피해를 줄인다."},
  {id:"noah",name:"노아",sub:"금지된 신성 해석 AI",icon:Cpu,maxHp:390,hp:390,atk:35,cd:0,maxCd:3,cp:1,skill:"권능 교란",desc:"이번 보스 권능을 약화하고 그로기 게이지를 올린다."},
];

const commandBase={
  guard:{name:"전군 방어 태세",icon:Shield,cost:28,cp:2,cd:0,maxCd:3,desc:"이번 턴 전체 피해 감소."},
  focus:{name:"집중 포화",icon:Target,cost:30,cp:2,cd:0,maxCd:3,desc:"이번 턴 공격 피해 증가."},
  last:{name:"최후 명령",icon:Flame,cost:70,cp:3,cd:0,maxCd:6,desc:"이번 턴 메인 로봇이 체력 1로 버틴다."},
};

const patterns=[
  {key:"lance",name:"태양창",desc:"가장 취약한 메인 로봇을 꿰뚫는다.",hint:"아틀라스 방패/전군 방어 추천"},
  {key:"brand",name:"태양 낙인",desc:"무작위 메인 로봇에게 큰 피해.",hint:"아틀라스가 대신 받을 수 있음"},
  {key:"wall",name:"광휘의 장벽",desc:"신성 보호막 대량 회복.",hint:"헤카톤/마터 드론 추천"},
  {key:"apostles",name:"하급 사도 소환",desc:"사도 전선을 만들고 압박 피해.",hint:"군단 사격으로 먼저 제거"},
  {key:"sunrise",name:"심판의 일출",desc:"전장 전체 광역 피해.",hint:"전군 방어/세라핌/최후 명령 추천"},
];

function init(){
  return {
    status:"ready", turn:1, cp:4, maxCp:4,
    boss:{name:"태양의 신 솔라리스",maxHp:5600,hp:5600,shield:520,maxShield:1100,phase:1,stagger:0,maxStagger:100,apostlesHp:0,nextPattern:patterns[0],armor:0},
    res:{energy:105,maxEnergy:230,will:36,morale:68},
    unit:{walker:3,tank:0,bulwark:1,fixer:0,oracle:0,martyr:0},
    robots:robotBase.map(r=>({...r})),
    commands:JSON.parse(JSON.stringify(commandBase)),
    buffs:{atlas:0,seraph:0,noah:0,guard:0,focus:0,last:0,exposed:0,staggered:0},
    flags:{salvo:false},
    log:["턴제 작전 대기 중. 자동 공격은 없습니다. 명령하지 않으면 신만 움직입니다."]
  };
}
const copy=g=>JSON.parse(JSON.stringify(g));
function log(g,msg){return {...g,log:[msg,...g.log].slice(0,11)}}
function alive(rs){return rs.filter(r=>r.hp>0)}
function nextPattern(g){
  const pool=(g.boss.hp/g.boss.maxHp<0.34)?patterns:patterns.filter(p=>p.key!=="sunrise");
  const filtered=pool.filter(p=>p.key!==g.boss.nextPattern.key);
  return filtered[Math.floor(Math.random()*filtered.length)] || pool[0];
}
function phase(g){
  let n=copy(g), ratio=n.boss.hp/n.boss.maxHp;
  let p=ratio<0.34?3:ratio<0.67?2:1;
  if(p!==n.boss.phase){n.boss.phase=p;n.res.morale=clamp(n.res.morale+6,0,100);n=log(n,`솔라리스가 ${p}페이즈에 돌입했습니다.`)}
  return n;
}
function endCheck(g){
  let n=copy(g);
  if(n.boss.hp<=0){n.status="victory";return log(n,"작전 성공. 태양의 신 솔라리스 격멸 확인.")}
  if(!n.robots.some(r=>r.hp>0)||n.res.morale<=0){n.status="defeat";return log(n,"작전 실패. 메인 로봇 전력 또는 군단 사기가 붕괴했습니다.")}
  return n;
}
function bossDamage(g,amount,pierce=0,stagger=0){
  let n=copy(g), dmg=amount;
  if(n.buffs.focus>0)dmg*=1.45;
  if(n.buffs.exposed>0)dmg*=1.35;
  if(n.buffs.staggered>0)dmg*=1.4;
  if(n.boss.armor>0)dmg*=0.72;
  let real=dmg;
  if(n.boss.shield>0 && pierce<1){
    const s=Math.min(n.boss.shield,dmg*(1-pierce));
    n.boss.shield-=s; real-=s;
  }
  n.boss.hp=clamp(n.boss.hp-Math.max(0,real),0,n.boss.maxHp);
  n.boss.stagger=clamp(n.boss.stagger+stagger,0,n.boss.maxStagger);
  if(n.boss.stagger>=n.boss.maxStagger){
    n.boss.stagger=0;n.buffs.staggered=1;n.boss.nextPattern=nextPattern(n);
    n=log(n,"그로기 발생. 다음 권능이 취소되고 이번 턴 피해가 증가합니다.");
  }
  return n;
}
function healRobots(robots,amount){return robots.map(r=>r.hp<=0?r:{...r,hp:clamp(r.hp+amount,0,r.maxHp)})}
function robotDamage(g,raw,mode="split"){
  let n=copy(g);
  const red=clamp((n.buffs.atlas?0.36:0)+(n.buffs.guard?0.32:0)+(n.buffs.seraph?0.22:0)+(n.buffs.noah?0.12:0)+Math.min(n.unit.bulwark*0.035,0.28),0,0.78);
  const amount=raw*(1-red), list=alive(n.robots); if(!list.length)return n;
  let ids=[];
  if(mode==="atlas" && n.robots.some(r=>r.id==="atlas"&&r.hp>0)) ids=["atlas"];
  else if(mode==="random") ids=[list[Math.floor(Math.random()*list.length)].id];
  else if(mode==="weak") ids=[[...list].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0].id];
  if(ids.length){
    n.robots=n.robots.map(r=>ids.includes(r.id)&&r.hp>0?{...r,hp:n.buffs.last&&r.hp-amount<=0?1:clamp(r.hp-amount,0,r.maxHp)}:r);
    return n;
  }
  const each=amount/list.length;
  n.robots=n.robots.map(r=>r.hp>0?{...r,hp:n.buffs.last&&r.hp-each<=0?1:clamp(r.hp-each,0,r.maxHp)}:r);
  return n;
}
function unitDamage(g,raw){
  let n=copy(g);
  const def=Object.entries(n.unit).reduce((s,[k,c])=>s+(units[k]?.def||0)*c,0);
  let amount=Math.max(0,raw-def*3.2);
  if(n.buffs.guard)amount*=0.7; if(n.buffs.seraph)amount*=0.82; if(n.buffs.noah)amount*=0.9;
  let losses=0;
  for(const k of ["walker","oracle","fixer","tank","bulwark"]){
    if(!n.unit[k]||amount<=0)continue;
    const killed=Math.min(n.unit[k],Math.floor(amount/units[k].hp));
    if(killed){n.unit[k]-=killed;losses+=killed;amount-=killed*units[k].hp}
  }
  if(losses){n.res.morale=clamp(n.res.morale-losses*2.4,0,100);n=log(n,`양산형 병기 ${losses}기가 파괴되었습니다.`)}
  return n;
}
function bossTurn(g){
  let n=copy(g), p=n.boss.nextPattern, ph=n.boss.phase;
  if(n.buffs.staggered){n=log(n,"솔라리스가 그로기 상태라 권능 발동이 취소되었습니다.");n.boss.nextPattern=nextPattern(n);return n}
  if(p.key==="lance"){n=robotDamage(n,420+ph*95,n.buffs.atlas?"atlas":"weak");n=unitDamage(n,65+ph*25);n=log(n,"신의 권능: 태양창. 빛의 창이 전장을 관통했습니다.")}
  if(p.key==="brand"){n=robotDamage(n,470+ph*120,n.buffs.atlas?"atlas":"random");n.res.morale=clamp(n.res.morale-5,0,100);n=log(n,"신의 권능: 태양 낙인. 표식이 폭발했습니다.")}
  if(p.key==="wall"){n.boss.shield=clamp(n.boss.shield+520+ph*150,0,n.boss.maxShield);n.boss.armor=1;n=log(n,"신의 권능: 광휘의 장벽. 보호막이 재구축되었습니다.")}
  if(p.key==="apostles"){n.boss.apostlesHp=clamp(n.boss.apostlesHp+520+ph*160,0,1500);n=unitDamage(n,80+ph*30);n=log(n,"신의 권능: 하급 사도 소환. 전선 압박이 시작됩니다.")}
  if(p.key==="sunrise"){n=robotDamage(n,360+ph*130,"split");n=unitDamage(n,220+ph*80);n.res.morale=clamp(n.res.morale-10,0,100);n=log(n,"신의 권능: 심판의 일출. 전장 전체가 불탔습니다.")}
  if(n.boss.apostlesHp>0){n=unitDamage(n,55+n.boss.apostlesHp/12);n=robotDamage(n,55+n.boss.apostlesHp/18,"split");n=log(n,"하급 사도 전선이 추가 피해를 가했습니다.")}
  n.boss.nextPattern=nextPattern(n);return n;
}
function Bar({value,max,label,cls=""}){return <div>{label&&<div className="mb-1 flex justify-between text-xs text-slate-300"><span>{label}</span><span>{fmt(value)} / {fmt(max)}</span></div>}<div className="h-3 overflow-hidden rounded-full bg-slate-950 ring-1 ring-white/10"><div className={`h-full rounded-full transition-all ${cls}`} style={{width:pct(value,max)}} /></div></div>}
function Pill({children}){return <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10">{children}</span>}
function Btn({children,onClick,disabled,variant="cyan",title}){const v={cyan:"bg-cyan-500/15 text-cyan-100 ring-cyan-300/20 hover:bg-cyan-400/25",amber:"bg-amber-500/15 text-amber-100 ring-amber-300/20 hover:bg-amber-400/25",rose:"bg-rose-500/15 text-rose-100 ring-rose-300/20 hover:bg-rose-400/25",emerald:"bg-emerald-500/15 text-emerald-100 ring-emerald-300/20 hover:bg-emerald-400/25"};return <button title={title} onClick={onClick} disabled={disabled} className={`rounded-xl px-3 py-2 text-sm font-bold ring-1 transition disabled:cursor-not-allowed disabled:opacity-35 ${v[variant]}`}>{children}</button>}

export default function App(){
  const [game,setGame]=useState(init);
  const unitAtk=useMemo(()=>Object.entries(game.unit).reduce((s,[k,c])=>s+(units[k]?.atk||0)*c,0),[game.unit]);
  const robotAtk=useMemo(()=>game.robots.reduce((s,r)=>s+(r.hp>0?r.atk*(r.hp/r.maxHp>0.35?1:0.65):0),0),[game.robots]);
  const can=(cp,e=0,w=0)=>game.status==="playing"&&game.cp>=cp&&game.res.energy>=e&&game.res.will>=w;
  const spend=(g,cp,e=0,w=0)=>{let n=copy(g);n.cp-=cp;n.res.energy-=e;n.res.will-=w;return n};

  function start(){setGame(g=>({...g,status:"playing",log:["1턴 작전 개시. CP를 사용해 행동하세요.",...g.log]}))}
  function deploy(k){setGame(g=>{if(!can(1,units[k].cost))return g;let n=spend(g,1,units[k].cost);n.unit[k]=(n.unit[k]||0)+1;return log(n,`${units[k].name} 1기 생산. CP 1 소모.`)})}
  function salvo(){setGame(g=>{if(!can(1)||g.flags.salvo)return g;let n=spend(g,1);n.flags.salvo=true;let dmg=unitAtk+robotAtk*0.55,pierce=0.05,stag=Math.min(40,12+g.unit.tank*5+g.unit.martyr*16);if(n.unit.martyr){let b=n.unit.martyr*units.martyr.burst;dmg+=b;pierce=0.35;stag+=n.unit.martyr*22;n=log(n,`마터 드론 ${n.unit.martyr}기가 돌입해 자폭했습니다.`);n.unit.martyr=0}if(n.boss.apostlesHp>0){let a=Math.min(n.boss.apostlesHp,dmg*0.7);n.boss.apostlesHp-=a;dmg*=0.45;n=log(n,`하급 사도 전선을 ${fmt(a)}만큼 정리했습니다.`)}n=bossDamage(n,dmg,pierce,stag);n=phase(n);n=endCheck(n);return log(n,`군단 사격 실행. 피해 ${fmt(dmg)}. CP 1 소모.`)})}
  function maintain(){setGame(g=>{if(!can(1))return g;let n=spend(g,1),bonus=(n.unit.fixer||0)*10;n.res.energy=clamp(n.res.energy+42+bonus,0,n.res.maxEnergy);n.res.morale=clamp(n.res.morale+4,0,100);n.robots=healRobots(n.robots,16+bonus*0.4);return log(n,"정비 명령. 전력, 사기, 로봇 체력을 일부 회복했습니다.")})}
  function robotSkill(id){setGame(g=>{let i=g.robots.findIndex(r=>r.id===id),r=g.robots[i];if(!r||r.hp<=0||r.cd>0||!can(r.cp))return g;let n=spend(g,r.cp);n.robots[i].cd=r.maxCd;if(id==="atlas"){n.buffs.atlas=1;n.res.morale=clamp(n.res.morale+5,0,100);n=log(n,"아틀라스: 거신의 방패 전개.")}if(id==="valkyrion"){n.buffs.exposed=2;n=bossDamage(n,380,0.12,22);n=log(n,"발키리온: 약점 절단.")}if(id==="hecaton"){n.boss.shield=clamp(n.boss.shield-460,0,n.boss.maxShield);n=bossDamage(n,470,0.62,18);n=log(n,"헤카톤: 종말포 발사.")}if(id==="seraphim"){n.buffs.seraph=1;n.robots=healRobots(n.robots,130);n=log(n,"세라핌: 긴급 복구.")}if(id==="noah"){n.buffs.noah=1;n.boss.stagger=clamp(n.boss.stagger+24+n.unit.oracle*8,0,n.boss.maxStagger);n.res.will=clamp(n.res.will+8+n.unit.oracle*2,0,100);n=log(n,"노아: 권능 교란.")}n=phase(n);return endCheck(n)})}
  function command(k){setGame(g=>{let c=g.commands[k];if(!c||c.cd>0||!can(c.cp,0,c.cost))return g;let n=spend(g,c.cp,0,c.cost);n.commands[k].cd=c.maxCd;if(k==="guard"){n.buffs.guard=1;n=log(n,"총사령관 명령: 전군 방어 태세.")}if(k==="focus"){n.buffs.focus=1;n=log(n,"총사령관 명령: 집중 포화.")}if(k==="last"){n.buffs.last=1;n.res.morale=clamp(n.res.morale+9,0,100);n=log(n,"최후 명령: 인간은 굴복하지 않는다.")}return n})}
  function endTurn(){setGame(g=>{if(g.status!=="playing")return g;let n=log(g,`${g.turn}턴 종료. 솔라리스가 권능을 발동합니다.`);n=bossTurn(n);n=phase(n);n=endCheck(n);if(n.status!=="playing")return n;let heal=(n.unit.fixer||0)*units.fixer.repair;if(heal){n.robots=healRobots(n.robots,heal);n=log(n,`픽서 드론이 ${fmt(heal)}만큼 수리했습니다.`)}let eg=52+n.unit.oracle*4+n.unit.fixer*3,wg=14+n.unit.oracle*units.oracle.will+Math.floor(n.res.morale/24);n.res.energy=clamp(n.res.energy+eg,0,n.res.maxEnergy);n.res.will=clamp(n.res.will+wg,0,100);n.turn+=1;n.cp=n.maxCp;n.flags.salvo=false;n.boss.armor=Math.max(0,n.boss.armor-1);Object.keys(n.buffs).forEach(k=>n.buffs[k]=Math.max(0,n.buffs[k]-1));n.robots=n.robots.map(r=>({...r,cd:Math.max(0,r.cd-1)}));Object.keys(n.commands).forEach(k=>n.commands[k].cd=Math.max(0,n.commands[k].cd-1));return log(n,`${n.turn}턴 시작. CP ${n.maxCp}, 전력 +${eg}, 의지 +${wg}.`)})}

  const status={ready:"작전 대기",playing:"작전 진행",victory:"작전 성공",defeat:"작전 실패"}[game.status];
  const aliveCount=game.robots.filter(r=>r.hp>0).length;
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.13),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_45%,#111827)] p-4 text-slate-100"><div className="mx-auto max-w-7xl space-y-4">
    <header className="rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-2xl backdrop-blur"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex flex-wrap gap-2"><Pill>GODS 턴제 V2</Pill><Pill>{status}</Pill><Pill>{game.turn}턴</Pill><Pill>페이즈 {game.boss.phase}</Pill></div><h1 className="text-3xl font-black tracking-tight md:text-5xl">솔라리스 격멸 작전</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">자동 DPS를 제거한 턴제 버전입니다. CP로 행동을 선택하고 턴 종료 시 보스 권능이 발동합니다.</p></div><div className="flex gap-2">{game.status==="ready"&&<Btn onClick={start} variant="amber"><ChevronRight className="mr-1 inline h-4 w-4"/>작전 개시</Btn>}<Btn onClick={()=>setGame(init())} variant="rose"><RotateCcw className="mr-1 inline h-4 w-4"/>초기화</Btn></div></div></header>
    <main className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div className="rounded-3xl border border-amber-300/20 bg-slate-950/75 p-5 shadow-2xl"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="text-sm font-semibold text-amber-200">BOSS</div><h2 className="text-3xl font-black text-amber-50">{game.boss.name}</h2><p className="mt-1 text-sm text-slate-300">다음 권능을 보고 이번 턴 행동을 정하세요.</p></div><div className="rounded-2xl bg-amber-400/10 p-3 ring-1 ring-amber-300/20"><div className="flex items-center gap-2 text-xs text-amber-100"><AlertTriangle className="h-4 w-4"/>다음 권능</div><div className="mt-1 text-lg font-black">{game.boss.nextPattern.name}</div><div className="mt-1 max-w-sm text-xs leading-5 text-slate-300">{game.boss.nextPattern.desc}</div><div className="mt-2 rounded-xl bg-black/20 p-2 text-xs text-amber-100">대응: {game.boss.nextPattern.hint}</div></div></div><div className="mt-5 space-y-3"><Bar value={game.boss.hp} max={game.boss.maxHp} label="신성 핵 체력" cls="bg-gradient-to-r from-rose-800 via-red-500 to-amber-300"/><Bar value={game.boss.shield} max={game.boss.maxShield} label="광휘 보호막" cls="bg-gradient-to-r from-sky-700 to-cyan-200"/><Bar value={game.boss.stagger} max={game.boss.maxStagger} label="그로기 게이지" cls="bg-gradient-to-r from-violet-700 to-fuchsia-300"/>{game.boss.apostlesHp>0&&<Bar value={game.boss.apostlesHp} max={1500} label="하급 사도 전선" cls="bg-gradient-to-r from-purple-800 to-pink-300"/>}</div></div>
        <div className="grid gap-4 md:grid-cols-4">{[["명령 포인트",`${game.cp} / ${game.maxCp}`,"text-cyan-100"],["잔존 전력",`${fmt(game.res.energy)} / ${fmt(game.res.maxEnergy)}`,"text-cyan-100"],["인류 의지",`${fmt(game.res.will)} / 100`,"text-amber-100"],["군단 사기",`${fmt(game.res.morale)} / 100`,"text-emerald-100"]].map(([a,b,c])=><div key={a} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl"><div className="text-xs text-slate-400">{a}</div><div className={`mt-1 text-2xl font-black ${c}`}>{b}</div></div>)}</div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl"><div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><h3 className="text-xl font-black">이번 턴 핵심 행동</h3><div className="text-xs text-slate-400">군단 사격은 턴당 1회</div></div><div className="grid gap-2 md:grid-cols-3"><Btn onClick={salvo} disabled={!can(1)||game.flags.salvo} variant="amber"><Target className="mr-1 inline h-4 w-4"/>군단 사격 CP 1</Btn><Btn onClick={maintain} disabled={!can(1)} variant="emerald"><Hammer className="mr-1 inline h-4 w-4"/>정비 CP 1</Btn><Btn onClick={endTurn} disabled={game.status!=="playing"} variant="rose"><Flame className="mr-1 inline h-4 w-4"/>턴 종료</Btn></div><div className="mt-3 grid gap-2 text-center text-xs text-slate-300 md:grid-cols-3"><div className="rounded-xl bg-white/5 p-2">예상 사격 화력<br/><b className="text-amber-100">{fmt(unitAtk+robotAtk*0.55)}</b></div><div className="rounded-xl bg-white/5 p-2">생존 메인 로봇<br/><b className="text-emerald-100">{aliveCount} / 5</b></div><div className="rounded-xl bg-white/5 p-2">사격 여부<br/><b className={game.flags.salvo?"text-slate-400":"text-cyan-100"}>{game.flags.salvo?"사용 완료":"사용 가능"}</b></div></div></div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><h3 className="text-xl font-black">메인 로봇 5기</h3><span className="text-xs text-slate-400">턴 단위 스킬</span></div><div className="grid gap-3 lg:grid-cols-5">{game.robots.map(r=>{const Icon=robotBase.find(x=>x.id===r.id).icon,down=r.hp<=0;return <div key={r.id} className={`rounded-2xl border p-3 ${down?"border-rose-500/30 bg-rose-950/25":"border-white/10 bg-white/[0.04]"}`}><div className="mb-2 flex items-start justify-between gap-2"><div><div className="flex items-center gap-2 font-black"><Icon className="h-4 w-4"/>{r.name}</div><div className="text-xs text-slate-400">{r.sub}</div></div>{down&&<Skull className="h-5 w-5 text-rose-300"/>}</div><Bar value={r.hp} max={r.maxHp} cls={down?"bg-rose-900":"bg-gradient-to-r from-lime-800 to-emerald-300"}/><button onClick={()=>robotSkill(r.id)} disabled={game.status!=="playing"||down||r.cd>0||game.cp<r.cp} title={r.desc} className="mt-3 w-full rounded-xl bg-white/10 px-2 py-2 text-xs font-bold text-slate-100 ring-1 ring-white/10 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35">{r.skill} CP {r.cp}{r.cd>0?` · ${r.cd}턴`:""}</button></div>})}</div></div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><h3 className="text-xl font-black">양산형 병기 생산</h3><RadioTower className="h-5 w-5 text-cyan-200"/></div><div className="grid gap-2 sm:grid-cols-2">{Object.entries(units).map(([k,u])=><button key={k} onClick={()=>deploy(k)} disabled={!can(1,u.cost)} title={u.desc} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-35"><div className="flex items-center justify-between gap-2"><div className="font-black"><span className="mr-2 text-cyan-200">{u.icon}</span>{u.name}</div><div className="text-xs text-cyan-100">{game.unit[k]||0}기</div></div><div className="mt-1 text-xs text-slate-400">{u.role} · 전력 {u.cost} · CP 1</div></button>)}</div></div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl"><h3 className="mb-3 text-xl font-black">총사령관 명령</h3><div className="space-y-2">{Object.entries(game.commands).map(([k,c])=>{const Icon=commandBase[k].icon;return <button key={k} onClick={()=>command(k)} disabled={game.status!=="playing"||c.cd>0||game.cp<c.cp||game.res.will<c.cost} title={c.desc} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-amber-400/10 p-3 text-left transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-35"><div><div className="font-black text-amber-100"><Icon className="mr-2 inline h-4 w-4"/>{c.name}</div><div className="text-xs text-slate-400">CP {c.cp} · 의지 {c.cost} · {c.desc}</div></div><div className="text-sm font-bold text-amber-100">{c.cd>0?`${c.cd}턴`:"발동"}</div></button>})}</div></div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl"><h3 className="mb-3 text-xl font-black">활성 효과</h3><div className="flex flex-wrap gap-2">{Object.entries(game.buffs).filter(([,v])=>v>0).length===0&&<span className="text-sm text-slate-400">활성화된 효과 없음</span>}{Object.entries(game.buffs).filter(([,v])=>v>0).map(([k,v])=><span key={k} className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100 ring-1 ring-cyan-200/20">{k.toUpperCase()} {v}턴</span>)}</div></div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl"><h3 className="mb-3 text-xl font-black">전투 로그</h3><div className="max-h-80 space-y-2 overflow-auto pr-1">{game.log.map((line,i)=><div key={`${line}-${i}`} className="rounded-xl bg-black/25 p-2 text-sm leading-5 text-slate-300 ring-1 ring-white/5">{line}</div>)}</div></div>
      </aside>
    </main>
    {(game.status==="victory"||game.status==="defeat")&&<div className="fixed inset-0 z-20 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 text-center shadow-2xl">{game.status==="victory"?<Trophy className="mx-auto mb-3 h-12 w-12 text-amber-200"/>:<Skull className="mx-auto mb-3 h-12 w-12 text-rose-300"/>}<h2 className="text-3xl font-black">{game.status==="victory"?"솔라리스 격멸":"작전 실패"}</h2><p className="mt-2 text-slate-300">{game.status==="victory"?"이번 승리는 자동 전투가 아니라 총사령관의 명령으로 얻은 것입니다.":"다음 권능을 보고 방어와 공격 타이밍을 다시 조절하세요."}</p><div className="mt-4"><Btn onClick={()=>setGame(init())} variant="amber"><RotateCcw className="mr-1 inline h-4 w-4"/>다시 작전 준비</Btn></div></div></div>}
  </div></div>
}
