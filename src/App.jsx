import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Shield,
  Sword,
  Crosshair,
  Wrench,
  Cpu,
  Zap,
  RotateCcw,
  Play,
  Pause,
  Skull,
  Trophy,
  RadioTower,
} from "lucide-react";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pct = (value, max) => `${clamp((value / max) * 100, 0, 100)}%`;
const fmt = (n) => Math.floor(n).toLocaleString("ko-KR");

const unitDefs = {
  walker: {
    name: "M-01 워커",
    role: "기본 전선",
    icon: "◇",
    cost: 22,
    hp: 10,
    dps: 1.2,
    defense: 0.2,
    desc: "싸고 많이 투입하는 양산형 로봇. 하급 사도 처리와 전선 유지 담당.",
  },
  tank: {
    name: "아이언 몰 전차",
    role: "중화기",
    icon: "▰",
    cost: 55,
    hp: 32,
    dps: 4.2,
    defense: 0.8,
    desc: "느리지만 안정적인 포격을 제공하는 무인 전차.",
  },
  bulwark: {
    name: "불워크 드론",
    role: "방어",
    icon: "⬡",
    cost: 45,
    hp: 34,
    dps: 0.5,
    defense: 3.2,
    desc: "전방에서 신벌 피해를 나눠 받는 방패 드론.",
  },
  fixer: {
    name: "픽서 드론",
    role: "수리",
    icon: "+",
    cost: 50,
    hp: 18,
    dps: 0.2,
    defense: 0.4,
    repair: 1.3,
    desc: "메인 로봇과 병기 잔해를 수리하는 지원 드론.",
  },
  oracle: {
    name: "오라클 드론",
    role: "해석",
    icon: "◎",
    cost: 60,
    hp: 14,
    dps: 0.1,
    defense: 0.2,
    analysis: 1,
    desc: "신의 권능을 분석해 패턴 예고 시간을 늘리고 노아를 보조한다.",
  },
  martyr: {
    name: "마터 드론",
    role: "자폭",
    icon: "✦",
    cost: 38,
    hp: 1,
    dps: 0,
    defense: 0,
    burst: 52,
    desc: "투입 즉시 돌진해 폭발한다. 보호막과 그로기 게이지를 크게 깎는다.",
  },
};

const robotTemplate = [
  {
    id: "atlas",
    name: "아틀라스",
    subtitle: "움직이는 성벽",
    icon: Shield,
    maxHp: 560,
    hp: 560,
    dps: 7,
    cd: 0,
    maxCd: 22,
    skill: "거신의 방패",
    desc: "8초 동안 모든 아군 피해를 크게 줄이고, 신벌 단일 공격을 대신 받는다.",
  },
  {
    id: "valkyrion",
    name: "발키리온",
    subtitle: "신체 절단 병기",
    icon: Sword,
    maxHp: 360,
    hp: 360,
    dps: 15,
    cd: 0,
    maxCd: 18,
    skill: "약점 절단",
    desc: "즉시 큰 피해를 주고, 7초 동안 보스가 받는 피해를 증가시킨다.",
  },
  {
    id: "hecaton",
    name: "헤카톤",
    subtitle: "대신성 포격 플랫폼",
    icon: Crosshair,
    maxHp: 420,
    hp: 420,
    dps: 20,
    cd: 0,
    maxCd: 24,
    skill: "종말포 충전",
    desc: "강력한 관통 피해를 주고 신의 보호막을 크게 깎는다.",
  },
  {
    id: "seraphim",
    name: "세라핌",
    subtitle: "인공 축복 프로토콜",
    icon: Wrench,
    maxHp: 380,
    hp: 380,
    dps: 3,
    cd: 0,
    maxCd: 20,
    skill: "긴급 복구",
    desc: "모든 메인 로봇을 수리하고 6초 동안 보호막을 부여한다.",
  },
  {
    id: "noah",
    name: "노아",
    subtitle: "금지된 신성 해석 AI",
    icon: Cpu,
    maxHp: 320,
    hp: 320,
    dps: 4,
    cd: 0,
    maxCd: 26,
    skill: "권능 교란",
    desc: "다음 보스 패턴을 지연시키고 8초 동안 모든 로봇 화력을 증폭한다.",
  },
];

const commandTemplate = {
  guard: {
    name: "전군 방어 태세",
    cd: 0,
    maxCd: 32,
    cost: 28,
    desc: "8초 동안 전체 피해 감소.",
  },
  focus: {
    name: "집중 포화",
    cd: 0,
    maxCd: 28,
    cost: 30,
    desc: "10초 동안 보스 피해 증가.",
  },
  last: {
    name: "최후 명령",
    cd: 0,
    maxCd: 55,
    cost: 65,
    desc: "9초 동안 메인 로봇이 체력 1 아래로 파괴되지 않음.",
  },
};

const patterns = [
  {
    key: "lance",
    name: "태양창",
    text: "솔라리스가 가장 앞선 병기를 꿰뚫는 태양창을 투사한다.",
  },
  {
    key: "brand",
    name: "태양 낙인",
    text: "무작위 메인 로봇에 낙인을 찍고 신성 폭발을 일으킨다.",
  },
  {
    key: "wall",
    name: "광휘의 장벽",
    text: "신성 보호막을 둘러 인간의 화력을 튕겨낸다.",
  },
  {
    key: "apostles",
    name: "하급 사도 소환",
    text: "빛으로 빚은 하급 사도들이 전선을 찢고 들어온다.",
  },
  {
    key: "sunrise",
    name: "심판의 일출",
    text: "전장 전체가 타오른다. 방어와 수리 없이는 버티기 어렵다.",
  },
];

function initialGame() {
  return {
    status: "ready",
    time: 0,
    boss: {
      name: "태양의 신 솔라리스",
      maxHp: 4200,
      hp: 4200,
      shield: 180,
      maxShield: 700,
      phase: 1,
      nextPattern: patterns[0],
      patternTimer: 14,
      apostlesHp: 0,
      armor: 0,
    },
    resources: {
      energy: 150,
      maxEnergy: 240,
      will: 35,
      morale: 72,
      scrap: 0,
    },
    units: {
      walker: 8,
      tank: 1,
      bulwark: 2,
      fixer: 1,
      oracle: 1,
      martyr: 0,
    },
    robots: robotTemplate.map((r) => ({ ...r })),
    commands: JSON.parse(JSON.stringify(commandTemplate)),
    buffs: {
      atlas: 0,
      exposed: 0,
      seraph: 0,
      noah: 0,
      guard: 0,
      focus: 0,
      last: 0,
      warning: 0,
    },
    log: ["작전 개시 대기 중. 총사령관의 명령을 기다립니다."],
    damageFlash: false,
  };
}

function addLog(game, message) {
  return { ...game, log: [message, ...game.log].slice(0, 9) };
}

function chooseNextPattern(game) {
  const hpRatio = game.boss.hp / game.boss.maxHp;
  const pool = hpRatio < 0.3 ? patterns : patterns.filter((p) => p.key !== "sunrise");
  const idx = Math.floor(Math.random() * pool.length);
  const oracleBonus = Math.min(game.units.oracle * 1.1, 7);
  const phasePressure = game.boss.phase >= 3 ? -3 : game.boss.phase === 2 ? -1.5 : 0;
  return {
    pattern: pool[idx],
    timer: clamp(14 + oracleBonus + phasePressure + Math.random() * 6, 9, 24),
  };
}

function aliveRobots(robots) {
  return robots.filter((r) => r.hp > 0);
}

function applyBossDamage(game, amount, pierce = 0) {
  let boss = { ...game.boss };
  let realDamage = amount;
  if (boss.shield > 0 && pierce < 1) {
    const toShield = Math.min(boss.shield, amount * (1 - pierce));
    boss.shield -= toShield;
    realDamage -= toShield;
  }
  boss.hp = clamp(boss.hp - realDamage, 0, boss.maxHp);
  return { ...game, boss };
}

function healWeakestRobot(robots, amount) {
  let next = robots.map((r) => ({ ...r }));
  for (let i = 0; i < Math.ceil(amount / 12); i += 1) {
    const targetIndex = next
      .map((r, idx) => ({ idx, ratio: r.hp / r.maxHp, alive: r.hp > 0 }))
      .filter((x) => x.alive && x.ratio < 1)
      .sort((a, b) => a.ratio - b.ratio)[0]?.idx;
    if (targetIndex === undefined) break;
    next[targetIndex].hp = clamp(next[targetIndex].hp + Math.min(12, amount), 0, next[targetIndex].maxHp);
  }
  return next;
}

function damageRobots(game, amount, options = {}) {
  let robots = game.robots.map((r) => ({ ...r }));
  const reduction = clamp(
    (game.buffs.atlas > 0 ? 0.38 : 0) +
      (game.buffs.guard > 0 ? 0.28 : 0) +
      (game.buffs.seraph > 0 ? 0.16 : 0) +
      Math.min(game.units.bulwark * 0.012, 0.18),
    0,
    0.72
  );
  let finalAmount = amount * (1 - reduction);

  if (options.targetId) {
    const idx = robots.findIndex((r) => r.id === options.targetId && r.hp > 0);
    if (idx >= 0) {
      const isFatalBlocked = game.buffs.last > 0 && robots[idx].hp - finalAmount <= 0;
      robots[idx].hp = isFatalBlocked ? 1 : clamp(robots[idx].hp - finalAmount, 0, robots[idx].maxHp);
    }
  } else {
    const living = aliveRobots(robots);
    if (living.length > 0) {
      const per = finalAmount / living.length;
      robots = robots.map((r) => {
        if (r.hp <= 0) return r;
        const isFatalBlocked = game.buffs.last > 0 && r.hp - per <= 0;
        return { ...r, hp: isFatalBlocked ? 1 : clamp(r.hp - per, 0, r.maxHp) };
      });
    }
  }
  return { ...game, robots };
}

function damageUnits(game, amount) {
  const units = { ...game.units };
  let remaining = amount;
  const order = ["walker", "bulwark", "tank", "fixer", "oracle"];
  const defense = Object.entries(units).reduce((sum, [key, count]) => sum + (unitDefs[key]?.defense || 0) * count, 0);
  remaining = Math.max(0, remaining - defense * 0.9);

  for (const key of order) {
    const count = units[key] || 0;
    if (count <= 0 || remaining <= 0) continue;
    const hp = unitDefs[key].hp;
    const losses = Math.min(count, Math.floor(remaining / hp));
    if (losses > 0) {
      units[key] -= losses;
      remaining -= losses * hp;
    }
  }

  const lostMorale = Math.max(0, amount / 80);
  return {
    ...game,
    units,
    resources: { ...game.resources, morale: clamp(game.resources.morale - lostMorale, 0, 100) },
  };
}

function executePattern(game) {
  let next = { ...game, damageFlash: true };
  const p = game.boss.nextPattern.key;
  const phase = game.boss.phase;

  if (p === "lance") {
    const target = game.robots.find((r) => r.id === "atlas" && r.hp > 0) || aliveRobots(game.robots)[0];
    next = damageRobots(next, 150 + phase * 35, { targetId: target?.id });
    next = damageUnits(next, 70 + phase * 16);
    next = addLog(next, `신의 권능: 태양창. ${target?.name || "전선"}이 강타당했습니다.`);
  }

  if (p === "brand") {
    const living = aliveRobots(game.robots);
    const target = living[Math.floor(Math.random() * living.length)];
    if (target) {
      const atlasUp = game.buffs.atlas > 0 && game.robots.find((r) => r.id === "atlas" && r.hp > 0);
      next = damageRobots(next, atlasUp ? 165 : 250 + phase * 35, { targetId: atlasUp ? "atlas" : target.id });
      next = damageUnits(next, 45 + phase * 10);
      next = addLog(
        next,
        `신의 권능: 태양 낙인. ${atlasUp ? "아틀라스가 낙인을 대신 받았습니다." : `${target.name}이 낙인 폭발에 노출됐습니다.`}`
      );
    }
  }

  if (p === "wall") {
    next.boss = {
      ...next.boss,
      shield: clamp(next.boss.shield + 340 + phase * 80, 0, next.boss.maxShield),
      armor: 8,
    };
    next = addLog(next, "신의 권능: 광휘의 장벽. 솔라리스가 신성 보호막을 전개했습니다.");
  }

  if (p === "apostles") {
    next.boss = { ...next.boss, apostlesHp: next.boss.apostlesHp + 380 + phase * 120 };
    next = damageUnits(next, 35 + phase * 8);
    next = addLog(next, "신의 권능: 하급 사도 소환. 전선에 빛의 사도들이 침투했습니다.");
  }

  if (p === "sunrise") {
    next = damageRobots(next, 260 + phase * 60);
    next = damageUnits(next, 260 + phase * 80);
    next.resources = {
      ...next.resources,
      morale: clamp(next.resources.morale - 12, 0, 100),
    };
    next = addLog(next, "신의 권능: 심판의 일출. 전장이 태양 속으로 끌려 들어갑니다.");
  }

  const chosen = chooseNextPattern(next);
  next.boss = { ...next.boss, nextPattern: chosen.pattern, patternTimer: chosen.timer };
  return next;
}

function tick(game) {
  if (game.status !== "playing") return game;
  let next = {
    ...game,
    time: game.time + 0.5,
    damageFlash: false,
    resources: { ...game.resources },
    boss: { ...game.boss },
    buffs: { ...game.buffs },
    units: { ...game.units },
    commands: JSON.parse(JSON.stringify(game.commands)),
    robots: game.robots.map((r) => ({ ...r })),
  };

  Object.keys(next.buffs).forEach((key) => {
    next.buffs[key] = Math.max(0, next.buffs[key] - 0.5);
  });
  Object.keys(next.commands).forEach((key) => {
    next.commands[key].cd = Math.max(0, next.commands[key].cd - 0.5);
  });
  next.robots = next.robots.map((r) => ({ ...r, cd: Math.max(0, r.cd - 0.5) }));

  const moraleMult = 0.72 + next.resources.morale / 140;
  const energyGain = (5.2 + next.units.oracle * 0.18 + next.units.fixer * 0.12) * moraleMult;
  const willGain = (0.55 + next.units.walker * 0.018 + next.units.oracle * 0.025) * moraleMult;
  next.resources.energy = clamp(next.resources.energy + energyGain, 0, next.resources.maxEnergy);
  next.resources.will = clamp(next.resources.will + willGain, 0, 100);

  const robotDps = next.robots.reduce((sum, r) => sum + (r.hp > 0 ? r.dps * (r.hp / r.maxHp > 0.25 ? 1 : 0.65) : 0), 0);
  const unitDps = Object.entries(next.units).reduce((sum, [key, count]) => sum + (unitDefs[key]?.dps || 0) * count, 0);
  let damageMult = 1;
  damageMult += next.buffs.exposed > 0 ? 0.35 : 0;
  damageMult += next.buffs.focus > 0 ? 0.45 : 0;
  damageMult += next.buffs.noah > 0 ? 0.28 : 0;
  damageMult -= next.boss.armor > 0 ? 0.22 : 0;
  const totalDps = (robotDps + unitDps) * damageMult;

  if (next.boss.apostlesHp > 0) {
    const toApostles = Math.min(next.boss.apostlesHp, totalDps * 0.5);
    next.boss.apostlesHp -= toApostles;
    const toBoss = totalDps * 0.5;
    next = applyBossDamage(next, toBoss, 0.08);
  } else {
    next = applyBossDamage(next, totalDps, 0.08);
  }

  if (next.units.martyr > 0) {
    const burst = next.units.martyr * unitDefs.martyr.burst;
    next.units.martyr = 0;
    next = applyBossDamage(next, burst, 0.4);
    next.boss.apostlesHp = Math.max(0, next.boss.apostlesHp - burst * 0.7);
    next.resources.morale = clamp(next.resources.morale + 2.5, 0, 100);
    next = addLog(next, `마터 드론이 돌입했습니다. 신성 폭발 피해 ${fmt(burst)}.`);
  }

  const repair = 2.1 + next.units.fixer * (unitDefs.fixer.repair || 0) + (next.buffs.seraph > 0 ? 10 : 0);
  next.robots = healWeakestRobot(next.robots, repair);

  const aura = 16 + next.boss.phase * 4 + next.boss.apostlesHp / 220;
  next = damageUnits(next, aura);
  if (next.boss.apostlesHp > 0) next = damageRobots(next, 12 + next.boss.phase * 4);

  next.boss.patternTimer -= 0.5;
  next.boss.armor = Math.max(0, next.boss.armor - 0.5);
  if (next.boss.patternTimer <= 0) {
    next = executePattern(next);
  }

  const hpRatio = next.boss.hp / next.boss.maxHp;
  const newPhase = hpRatio < 0.3 ? 3 : hpRatio < 0.65 ? 2 : 1;
  if (newPhase !== next.boss.phase) {
    next.boss.phase = newPhase;
    next.boss.maxShield = newPhase === 3 ? 900 : newPhase === 2 ? 780 : 700;
    next.resources.morale = clamp(next.resources.morale + 8, 0, 100);
    next = addLog(next, `솔라리스가 ${newPhase}페이즈에 돌입했습니다. 권능이 거칠어집니다.`);
  }

  const anyRobotAlive = next.robots.some((r) => r.hp > 0);
  const anyArmy = Object.entries(next.units).some(([key, count]) => key !== "martyr" && count > 0);
  if (next.boss.hp <= 0) {
    next.status = "victory";
    next = addLog(next, "작전 성공. 태양의 신 솔라리스 격멸 확인.");
  } else if (!anyRobotAlive || (!anyArmy && next.resources.energy < 22)) {
    next.status = "defeat";
    next = addLog(next, "작전 실패. 지휘 가능한 전투 전력이 붕괴했습니다.");
  }

  return next;
}

function Bar({ value, max, label, className = "" }) {
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
          <span>{label}</span>
          <span>
            {fmt(value)} / {fmt(max)}
          </span>
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/10">
        <div className={`h-full rounded-full transition-all duration-300 ${className}`} style={{ width: pct(value, max) }} />
      </div>
    </div>
  );
}

function StatPill({ children }) {
  return <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10">{children}</div>;
}

function GameButton({ children, disabled, onClick, title, variant = "default" }) {
  const styles = {
    default: "bg-cyan-500/20 text-cyan-100 ring-cyan-300/20 hover:bg-cyan-400/25",
    danger: "bg-rose-500/20 text-rose-100 ring-rose-300/20 hover:bg-rose-400/25",
    gold: "bg-amber-500/20 text-amber-100 ring-amber-300/20 hover:bg-amber-400/25",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-35 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [game, setGame] = useState(initialGame);
  const loopRef = useRef(null);

  useEffect(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    if (game.status === "playing") {
      loopRef.current = setInterval(() => {
        setGame((g) => tick(g));
      }, 500);
    }
    return () => loopRef.current && clearInterval(loopRef.current);
  }, [game.status]);

  const totals = useMemo(() => {
    const unitPower = Object.entries(game.units).reduce((sum, [key, count]) => sum + (unitDefs[key]?.dps || 0) * count, 0);
    const robotPower = game.robots.reduce((sum, r) => sum + (r.hp > 0 ? r.dps : 0), 0);
    const defense = Object.entries(game.units).reduce((sum, [key, count]) => sum + (unitDefs[key]?.defense || 0) * count, 0);
    return { unitPower, robotPower, defense };
  }, [game.units, game.robots]);

  function start() {
    setGame((g) => ({ ...g, status: "playing", log: ["작전 개시. 솔라리스 교전 진입.", ...g.log] }));
  }

  function pause() {
    setGame((g) => ({ ...g, status: g.status === "playing" ? "paused" : "playing" }));
  }

  function deployUnit(key) {
    setGame((g) => {
      if (g.status !== "playing") return g;
      const def = unitDefs[key];
      if (!def || g.resources.energy < def.cost) return g;
      const next = {
        ...g,
        resources: { ...g.resources, energy: g.resources.energy - def.cost },
        units: { ...g.units, [key]: (g.units[key] || 0) + 1 },
      };
      return addLog(next, `${def.name} 1기 투입.`);
    });
  }

  function useRobotSkill(id) {
    setGame((g) => {
      if (g.status !== "playing") return g;
      const idx = g.robots.findIndex((r) => r.id === id);
      const robot = g.robots[idx];
      if (!robot || robot.hp <= 0 || robot.cd > 0) return g;

      let next = {
        ...g,
        robots: g.robots.map((r) => ({ ...r })),
        boss: { ...g.boss },
        buffs: { ...g.buffs },
        resources: { ...g.resources },
      };
      next.robots[idx].cd = robot.maxCd;

      if (id === "atlas") {
        next.buffs.atlas = 8;
        next.resources.morale = clamp(next.resources.morale + 4, 0, 100);
        next = addLog(next, "아틀라스: 거신의 방패 전개. 신벌 차단 준비 완료.");
      }
      if (id === "valkyrion") {
        next.buffs.exposed = 7;
        next = applyBossDamage(next, 260 + g.units.walker * 3, 0.12);
        next.resources.morale = clamp(next.resources.morale + 6, 0, 100);
        next = addLog(next, "발키리온: 약점 절단 성공. 솔라리스의 신체 균열 노출.");
      }
      if (id === "hecaton") {
        next.boss.shield = Math.max(0, next.boss.shield - 310);
        next = applyBossDamage(next, 340, 0.55);
        next.resources.morale = clamp(next.resources.morale + 5, 0, 100);
        next = addLog(next, "헤카톤: 종말포 발사. 신성 장벽이 붕괴합니다.");
      }
      if (id === "seraphim") {
        next.robots = next.robots.map((r) => (r.hp > 0 ? { ...r, hp: clamp(r.hp + 130, 0, r.maxHp) } : r));
        next.buffs.seraph = 6;
        next.resources.morale = clamp(next.resources.morale + 5, 0, 100);
        next = addLog(next, "세라핌: 긴급 복구 프로토콜. 전투 지속력 회복.");
      }
      if (id === "noah") {
        next.buffs.noah = 8;
        next.boss.patternTimer += 7 + Math.min(g.units.oracle, 6);
        next.resources.morale = clamp(next.resources.morale + 5, 0, 100);
        next = addLog(next, "노아: 권능 교란 성공. 다음 신성 패턴이 지연됩니다.");
      }
      return next;
    });
  }

  function useCommand(key) {
    setGame((g) => {
      if (g.status !== "playing") return g;
      const cmd = g.commands[key];
      if (!cmd || cmd.cd > 0 || g.resources.will < cmd.cost) return g;
      let next = {
        ...g,
        commands: JSON.parse(JSON.stringify(g.commands)),
        resources: { ...g.resources, will: g.resources.will - cmd.cost },
        buffs: { ...g.buffs },
      };
      next.commands[key].cd = cmd.maxCd;
      if (key === "guard") {
        next.buffs.guard = 8;
        next = addLog(next, "총사령관 명령: 전군 방어 태세. 모든 병기가 방어 진형으로 전환합니다.");
      }
      if (key === "focus") {
        next.buffs.focus = 10;
        next = addLog(next, "총사령관 명령: 집중 포화. 모든 화력이 신의 약점에 집중됩니다.");
      }
      if (key === "last") {
        next.buffs.last = 9;
        next.resources.morale = clamp(next.resources.morale + 10, 0, 100);
        next = addLog(next, "최후 명령: 인간은 굴복하지 않는다. 메인 로봇이 한계 이상으로 버팁니다.");
      }
      return next;
    });
  }

  const statusText = {
    ready: "작전 대기",
    playing: "교전 중",
    paused: "일시정지",
    victory: "작전 성공",
    defeat: "작전 실패",
  }[game.status];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_32%),linear-gradient(135deg,#020617,#0f172a_42%,#111827)] p-4 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <StatPill>GODS: 신이 인간을 버린 세계</StatPill>
                <StatPill>{statusText}</StatPill>
                <StatPill>작전 시간 {fmt(game.time)}초</StatPill>
                <StatPill>페이즈 {game.boss.phase}</StatPill>
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">솔라리스 격멸 작전</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                너는 인류 최후 기계군단의 총사령관이다. 양산형 병기로 전선을 유지하고, 메인 로봇 5기의 스킬 타이밍으로 태양의 신을 쓰러뜨려라.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {game.status === "ready" && (
                <GameButton onClick={start} variant="gold">
                  <Play className="mr-1 inline h-4 w-4" />
                  작전 개시
                </GameButton>
              )}
              {(game.status === "playing" || game.status === "paused") && (
                <GameButton onClick={pause}>
                  <Pause className="mr-1 inline h-4 w-4" />
                  {game.status === "playing" ? "일시정지" : "재개"}
                </GameButton>
              )}
              <GameButton onClick={() => setGame(initialGame())} variant="danger">
                <RotateCcw className="mr-1 inline h-4 w-4" />
                초기화
              </GameButton>
            </div>
          </div>
        </header>

        <main className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4">
            <div className={`relative overflow-hidden rounded-3xl border border-amber-300/20 bg-slate-950/75 p-5 shadow-2xl transition ${game.damageFlash ? "ring-4 ring-amber-300/30" : ""}`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-70" />
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-amber-200">BOSS</div>
                  <h2 className="text-3xl font-black text-amber-50">{game.boss.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">“기도는 끝났다. 이제 조준하라.”</p>
                </div>
                <div className="rounded-2xl bg-amber-400/10 p-3 text-right ring-1 ring-amber-300/20">
                  <div className="text-xs text-amber-100">다음 권능</div>
                  <div className="text-lg font-black">{game.boss.nextPattern.name}</div>
                  <div className="text-sm text-slate-300">{game.boss.patternTimer.toFixed(1)}초 후 발동</div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <Bar value={game.boss.hp} max={game.boss.maxHp} label="신성 핵 체력" className="bg-gradient-to-r from-rose-700 via-red-500 to-amber-300" />
                <Bar value={game.boss.shield} max={game.boss.maxShield} label="광휘 보호막" className="bg-gradient-to-r from-sky-600 to-cyan-200" />
                {game.boss.apostlesHp > 0 && (
                  <Bar value={game.boss.apostlesHp} max={900} label="하급 사도 전선 압박" className="bg-gradient-to-r from-violet-700 to-fuchsia-300" />
                )}
              </div>
              <div className="mt-4 rounded-2xl bg-black/25 p-3 text-sm text-slate-300 ring-1 ring-white/10">{game.boss.nextPattern.text}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl">
                <div className="text-xs text-slate-400">잔존 전력</div>
                <div className="text-2xl font-black text-cyan-100">
                  {fmt(game.resources.energy)} / {fmt(game.resources.maxEnergy)}
                </div>
                <Bar value={game.resources.energy} max={game.resources.maxEnergy} className="mt-2 bg-gradient-to-r from-cyan-700 to-cyan-200" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl">
                <div className="text-xs text-slate-400">인류 의지</div>
                <div className="text-2xl font-black text-amber-100">{fmt(game.resources.will)} / 100</div>
                <Bar value={game.resources.will} max={100} className="mt-2 bg-gradient-to-r from-amber-700 to-yellow-200" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl">
                <div className="text-xs text-slate-400">군단 사기</div>
                <div className="text-2xl font-black text-emerald-100">{fmt(game.resources.morale)} / 100</div>
                <Bar value={game.resources.morale} max={100} className="mt-2 bg-gradient-to-r from-emerald-800 to-emerald-300" />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-black">메인 로봇 5기</h3>
                <div className="text-xs text-slate-400">스킬은 쿨타임만 있으면 무료 발동</div>
              </div>
              <div className="grid gap-3 lg:grid-cols-5">
                {game.robots.map((robot) => {
                  const Icon = robot.icon;
                  const down = robot.hp <= 0;
                  return (
                    <div key={robot.id} className={`rounded-2xl border p-3 transition ${down ? "border-rose-500/30 bg-rose-950/30" : "border-white/10 bg-white/[0.04]"}`}>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 font-black">
                            <Icon className="h-4 w-4" />
                            {robot.name}
                          </div>
                          <div className="text-xs text-slate-400">{robot.subtitle}</div>
                        </div>
                        {down && <Skull className="h-5 w-5 text-rose-300" />}
                      </div>
                      <Bar value={robot.hp} max={robot.maxHp} className={down ? "bg-rose-900" : "bg-gradient-to-r from-lime-700 to-emerald-300"} />
                      <button
                        onClick={() => useRobotSkill(robot.id)}
                        disabled={game.status !== "playing" || down || robot.cd > 0}
                        className="mt-3 w-full rounded-xl bg-white/10 px-2 py-2 text-xs font-bold text-slate-100 ring-1 ring-white/10 transition hover:bg-white/20 disabled:opacity-35"
                        title={robot.desc}
                      >
                        {robot.skill} {robot.cd > 0 ? `(${robot.cd.toFixed(0)}s)` : ""}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-black">양산형 병기 생산</h3>
                <RadioTower className="h-5 w-5 text-cyan-200" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(unitDefs).map(([key, def]) => (
                  <button
                    key={key}
                    onClick={() => deployUnit(key)}
                    disabled={game.status !== "playing" || game.resources.energy < def.cost}
                    title={def.desc}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-black">
                        <span className="mr-2 text-cyan-200">{def.icon}</span>
                        {def.name}
                      </div>
                      <div className="text-xs text-cyan-100">{game.units[key] || 0}기</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {def.role} · 전력 {def.cost}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
                <div className="rounded-xl bg-white/5 p-2">
                  군단 화력
                  <br />
                  <b className="text-cyan-100">{totals.unitPower.toFixed(1)}</b>
                </div>
                <div className="rounded-xl bg-white/5 p-2">
                  로봇 화력
                  <br />
                  <b className="text-cyan-100">{totals.robotPower.toFixed(1)}</b>
                </div>
                <div className="rounded-xl bg-white/5 p-2">
                  방어망
                  <br />
                  <b className="text-cyan-100">{totals.defense.toFixed(1)}</b>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl">
              <h3 className="mb-3 text-xl font-black">총사령관 명령</h3>
              <div className="space-y-2">
                {Object.entries(game.commands).map(([key, cmd]) => (
                  <button
                    key={key}
                    onClick={() => useCommand(key)}
                    disabled={game.status !== "playing" || cmd.cd > 0 || game.resources.will < cmd.cost}
                    title={cmd.desc}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-amber-400/10 p-3 text-left transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <div>
                      <div className="font-black text-amber-100">
                        <Zap className="mr-2 inline h-4 w-4" />
                        {cmd.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        의지 {cmd.cost} · {cmd.desc}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-amber-100">{cmd.cd > 0 ? `${cmd.cd.toFixed(0)}s` : "발동"}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl">
              <h3 className="mb-3 text-xl font-black">활성 효과</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(game.buffs).filter(([, v]) => v > 0).length === 0 && <span className="text-sm text-slate-400">활성화된 효과 없음</span>}
                {Object.entries(game.buffs)
                  .filter(([, v]) => v > 0)
                  .map(([key, v]) => (
                    <span key={key} className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100 ring-1 ring-cyan-200/20">
                      {key.toUpperCase()} {v.toFixed(0)}s
                    </span>
                  ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl">
              <h3 className="mb-3 text-xl font-black">전투 로그</h3>
              <div className="max-h-64 space-y-2 overflow-auto pr-1">
                {game.log.map((line, idx) => (
                  <div key={`${line}-${idx}`} className="rounded-xl bg-black/25 p-2 text-sm text-slate-300 ring-1 ring-white/5">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>

        {(game.status === "victory" || game.status === "defeat") && (
          <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 text-center shadow-2xl">
              {game.status === "victory" ? <Trophy className="mx-auto mb-3 h-12 w-12 text-amber-200" /> : <Skull className="mx-auto mb-3 h-12 w-12 text-rose-300" />}
              <h2 className="text-3xl font-black">{game.status === "victory" ? "솔라리스 격멸" : "작전 실패"}</h2>
              <p className="mt-2 text-slate-300">
                {game.status === "victory"
                  ? "태양의 신이 추락했습니다. 인류는 다시 하루를 얻었습니다."
                  : "기계군단이 붕괴했습니다. 다음 작전에는 생산 타이밍과 방어 명령을 더 신중히 사용해야 합니다."}
              </p>
              <div className="mt-4">
                <GameButton onClick={() => setGame(initialGame())} variant="gold">
                  <RotateCcw className="mr-1 inline h-4 w-4" />
                  다시 작전 준비
                </GameButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
