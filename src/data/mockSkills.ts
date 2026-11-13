import type { EffectCategory, EffectDetail, SkillItem } from '../types/skill'

/**
 * フェーズ1のUI・フィルター・将来機能（類似推薦 / CC計算 / ランキング）
 * の動作確認に使うモックデータ。
 *
 * Data Dragon 16.22.1 の日本語名・アイコンを元に、
 * 解除可否と効果時間をフェーズ1用に整理している。
 */

const CDN = 'https://ddragon.leagueoflegends.com/cdn/16.22.1'

const championIcon = (championKey: string) => `${CDN}/img/champion/${championKey}.png`
const spellIcon = (file: string) => `${CDN}/img/spell/${file}`
const passiveIcon = (file: string) => `${CDN}/img/passive/${file}`

function effect(
  id: string,
  label: string,
  category: EffectCategory,
  duration?: number,
  valueText?: string,
): EffectDetail {
  return { id, label, category, duration, valueText }
}

/* ------------------------------------------------------------------ */
/* モルガナ                                                            */
/* ------------------------------------------------------------------ */

const MORGANA_ICON = championIcon('Morgana')

const MORGANA_SKILLS: SkillItem[] = [
  {
    id: 'morgana-p',
    championKey: 'Morgana',
    championName: 'モルガナ',
    championRole: ['Support', 'Mage'],
    key: 'P',
    name: 'ソウルサイフォン',
    description:
      '敵チャンピオン、大型ミニオン、中型・大型ジャングルモンスターにダメージを与えると、自身の体力を回復する。',
    iconUrl: passiveIcon('FallenAngel_Empathize.png'),
    championIconUrl: MORGANA_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('heal', '体力回復', 'buff', undefined, 'ダメージの一部')],
  },
  {
    id: 'morgana-q',
    championKey: 'Morgana',
    championName: 'モルガナ',
    championRole: ['Support', 'Mage'],
    key: 'Q',
    name: 'ダークバインド',
    description:
      '闇の魔力で最初に命中した敵を3秒間スネアし、魔法ダメージを与える。ミニオンに対しては効果時間が半減する。',
    iconUrl: spellIcon('MorganaQ.png'),
    championIconUrl: MORGANA_ICON,
    targetType: 'skillshot',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('snare', 'スネア', 'hard_cc', 3, '3.0秒')],
  },
  {
    id: 'morgana-w',
    championKey: 'Morgana',
    championName: 'モルガナ',
    championRole: ['Support', 'Mage'],
    key: 'W',
    name: '苦悶の影',
    description:
      '指定地点に呪いの闇を発生させ、範囲内の敵に継続的な魔法ダメージを与える。対象の体力が低いほどダメージが増加する。',
    iconUrl: spellIcon('MorganaW.png'),
    championIconUrl: MORGANA_ICON,
    targetType: 'aoe',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [],
  },
  {
    id: 'morgana-e',
    championKey: 'Morgana',
    championName: 'モルガナ',
    championRole: ['Support', 'Mage'],
    key: 'E',
    name: 'ブラックシールド',
    description:
      '味方チャンピオンにバリアを付与し、魔法ダメージと行動妨害を無効化する。',
    iconUrl: spellIcon('MorganaE.png'),
    championIconUrl: MORGANA_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('shield', 'シールド', 'buff', 5, '最大300'),
      effect('cc_immunity', '行動妨害無効', 'buff', 5, '5.0秒'),
    ],
  },
  {
    id: 'morgana-r',
    championKey: 'Morgana',
    championName: 'モルガナ',
    championRole: ['Support', 'Mage'],
    key: 'R',
    name: '魂の足枷',
    description:
      '周囲の敵チャンピオンを鎖で縛り、ダメージとスロウを与える。3秒以内に鎖を断ち切れなかった敵をスタンさせる。',
    iconUrl: spellIcon('MorganaR.png'),
    championIconUrl: MORGANA_ICON,
    targetType: 'aoe',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [
      effect('slow', 'スロー', 'soft_cc', 3, '20%'),
      effect('stun', 'スタン', 'hard_cc', 1.5, '1.5秒'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* マルザハール                                                        */
/* ------------------------------------------------------------------ */

const MALZAHAR_ICON = championIcon('Malzahar')

const MALZAHAR_SKILLS: SkillItem[] = [
  {
    id: 'malzahar-p',
    championKey: 'Malzahar',
    championName: 'マルザハール',
    championRole: ['Mage'],
    key: 'P',
    name: 'ヴォイドシフト',
    description:
      '一定時間ダメージや行動妨害を受けていない時、強力なダメージ軽減と行動妨害無効を得る。',
    iconUrl: passiveIcon('Malzahar_Passive.png'),
    championIconUrl: MALZAHAR_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('damage_reduction', 'ダメージ軽減', 'buff', 0.25, '90%'),
      effect('cc_immunity', '行動妨害無効', 'buff', 0.25, '0.25秒'),
    ],
  },
  {
    id: 'malzahar-q',
    championKey: 'Malzahar',
    championName: 'マルザハール',
    championRole: ['Mage'],
    key: 'Q',
    name: 'ヴォイドコール',
    description:
      '2カ所にヴォイドゲートを発生させ、直線上の敵に魔法ダメージを与える。敵チャンピオンにはサイレンスを付与する。',
    iconUrl: spellIcon('MalzaharQ.png'),
    championIconUrl: MALZAHAR_ICON,
    targetType: 'aoe',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('silence', 'サイレンス', 'soft_cc', 2, '2.0秒')],
  },
  {
    id: 'malzahar-w',
    championKey: 'Malzahar',
    championName: 'マルザハール',
    championRole: ['Mage'],
    key: 'W',
    name: 'ヴォイドスワーム',
    description: '近くの敵を攻撃するヴォイドリングを召喚する。',
    iconUrl: spellIcon('MalzaharW.png'),
    championIconUrl: MALZAHAR_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [],
  },
  {
    id: 'malzahar-e',
    championKey: 'Malzahar',
    championName: 'マルザハール',
    championRole: ['Mage'],
    key: 'E',
    name: '虚性侵蝕',
    description:
      '対象の精神を蝕み、継続ダメージを与える。対象が倒れると近くの敵に感染し、自身のマナを回復する。',
    iconUrl: spellIcon('MalzaharE.png'),
    championIconUrl: MALZAHAR_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [],
  },
  {
    id: 'malzahar-r',
    championKey: 'Malzahar',
    championName: 'マルザハール',
    championRole: ['Mage'],
    key: 'R',
    name: 'ネザーグラスプ',
    description:
      '対象の敵チャンピオンにサプレッションを付与し、継続ダメージを与える。クレンズでは解除できず、QSSが必要。',
    iconUrl: spellIcon('MalzaharR.png'),
    championIconUrl: MALZAHAR_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('suppression', 'サプレッション', 'hard_cc', 2.5, '2.5秒')],
  },
]

/* ------------------------------------------------------------------ */
/* ヤスオ                                                              */
/* ------------------------------------------------------------------ */

const YASUO_ICON = championIcon('Yasuo')

const YASUO_SKILLS: SkillItem[] = [
  {
    id: 'yasuo-p',
    championKey: 'Yasuo',
    championName: 'ヤスオ',
    championRole: ['Fighter', 'Assassin'],
    key: 'P',
    name: '浪人道',
    description:
      'クリティカル率が増加し、移動距離に応じてシールドをチャージする。敵チャンピオンからダメージを受けると発動する。',
    iconUrl: passiveIcon('Yasuo_Passive.png'),
    championIconUrl: YASUO_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('shield', 'シールド', 'buff', 1, '移動距離に応じて')],
  },
  {
    id: 'yasuo-q',
    championKey: 'Yasuo',
    championName: 'ヤスオ',
    championRole: ['Fighter', 'Assassin'],
    key: 'Q',
    name: '抜刀（つむじ風）',
    description:
      '指定方向に突きを放つ。3段目はつむじ風となり、触れた敵ユニットをノックアップさせる。',
    iconUrl: spellIcon('YasuoQ1Wrapper.png'),
    championIconUrl: YASUO_ICON,
    targetType: 'skillshot',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('knockup', 'ノックアップ', 'hard_cc', 1, '1.0秒')],
  },
  {
    id: 'yasuo-w',
    championKey: 'Yasuo',
    championName: 'ヤスオ',
    championRole: ['Fighter', 'Assassin'],
    key: 'W',
    name: '風殺の壁',
    description:
      '前進する風の壁を生み出し、敵のあらゆる発射物を消滅させる。',
    iconUrl: spellIcon('YasuoW.png'),
    championIconUrl: YASUO_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('projectile_block', '発射物無効', 'buff', 4, '4.0秒')],
  },
  {
    id: 'yasuo-e',
    championKey: 'Yasuo',
    championName: 'ヤスオ',
    championRole: ['Fighter', 'Assassin'],
    key: 'E',
    name: '風薙ぎ',
    description:
      '指定した敵を通り過ぎるようにダッシュし、魔法ダメージを与える。連続使用でダメージが増加する。',
    iconUrl: spellIcon('YasuoE.png'),
    championIconUrl: YASUO_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [],
  },
  {
    id: 'yasuo-r',
    championKey: 'Yasuo',
    championName: 'ヤスオ',
    championRole: ['Fighter', 'Assassin'],
    key: 'R',
    name: '鬼哭啾々',
    description:
      'ノックアップ中の敵チャンピオンのもとへブリンクし、範囲内の敵を追加でノックアップさせる。一定時間、物理防御貫通を得る。',
    iconUrl: spellIcon('YasuoR.png'),
    championIconUrl: YASUO_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('knockup', 'ノックアップ', 'hard_cc', 1, '1.0秒'),
      effect('armor_pen', '物理防御貫通', 'debuff', 15, '60%'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* ナサス                                                              */
/* ------------------------------------------------------------------ */

const NASUS_ICON = championIcon('Nasus')

const NASUS_SKILLS: SkillItem[] = [
  {
    id: 'nasus-p',
    championKey: 'Nasus',
    championName: 'ナサス',
    championRole: ['Fighter', 'Tank'],
    key: 'P',
    name: 'ソウルイーター',
    description: '敵の魂のエネルギーを吸い取り、自身のライフスティールを増加させる。',
    iconUrl: passiveIcon('Nasus_Passive.png'),
    championIconUrl: NASUS_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('lifesteal', 'ライフスティール', 'buff', undefined, '最大12%')],
  },
  {
    id: 'nasus-q',
    championKey: 'Nasus',
    championName: 'ナサス',
    championRole: ['Fighter', 'Tank'],
    key: 'Q',
    name: 'サイフォンストライク',
    description:
      '敵を攻撃してダメージを与える。とどめを刺すと威力が永続的に増加する。',
    iconUrl: spellIcon('NasusQ.png'),
    championIconUrl: NASUS_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [],
  },
  {
    id: 'nasus-w',
    championKey: 'Nasus',
    championName: 'ナサス',
    championRole: ['Fighter', 'Tank'],
    key: 'W',
    name: 'ウィザー',
    description:
      '指定した敵チャンピオンを老化させ、効果時間中に移動速度と攻撃速度を徐々に低下させる。',
    iconUrl: spellIcon('NasusW.png'),
    championIconUrl: NASUS_ICON,
    targetType: 'point_and_click',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [
      effect('slow', 'スロー', 'soft_cc', 5, '最大47%'),
      effect('attack_speed_shred', '攻撃速度低下', 'debuff', 5, '最大47%'),
    ],
  },
  {
    id: 'nasus-e',
    championKey: 'Nasus',
    championName: 'ナサス',
    championRole: ['Fighter', 'Tank'],
    key: 'E',
    name: 'スピリットファイア',
    description:
      '指定範囲に神秘的な炎を呼び寄せ、範囲内の敵にダメージを与えて物理防御を低下させる。',
    iconUrl: spellIcon('NasusE.png'),
    championIconUrl: NASUS_ICON,
    targetType: 'aoe',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('armor_shred', '物理防御低下', 'debuff', 5, '最大40%')],
  },
  {
    id: 'nasus-r',
    championKey: 'Nasus',
    championName: 'ナサス',
    championRole: ['Fighter', 'Tank'],
    key: 'R',
    name: 'アヌビスの怒り',
    description:
      '巨大化して砂嵐をまとい、最大体力・物理防御・魔法防御を増加させる。周囲の敵に継続ダメージを与える。',
    iconUrl: spellIcon('NasusR.png'),
    championIconUrl: NASUS_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('max_health', '最大体力増加', 'buff', 15, '300 / 450 / 600'),
      effect('resistance', '物理・魔法防御増加', 'buff', 15, '40 / 55 / 70'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* ルル                                                                */
/* ------------------------------------------------------------------ */

const LULU_ICON = championIcon('Lulu')

const LULU_SKILLS: SkillItem[] = [
  {
    id: 'lulu-p',
    championKey: 'Lulu',
    championName: 'ルル',
    championRole: ['Support', 'Mage'],
    key: 'P',
    name: '仲良し妖精ピックス',
    description:
      'ピックスがくっついているチャンピオンが敵を攻撃するたびに、ピックスが魔法のビームで援護する。',
    iconUrl: passiveIcon('Lulu_PixFaerieCompanion.png'),
    championIconUrl: LULU_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('pix_bolt', '追加魔法ダメージ', 'buff', undefined, 'ピックスの追撃')],
  },
  {
    id: 'lulu-q',
    championKey: 'Lulu',
    championName: 'ルル',
    championRole: ['Support', 'Mage'],
    key: 'Q',
    name: 'ぴかぴかビーム',
    description:
      'ルルとピックスが同時に魔法のビームを発射し、命中したすべての敵にダメージと重度のスロウを与える。',
    iconUrl: spellIcon('LuluQ.png'),
    championIconUrl: LULU_ICON,
    targetType: 'skillshot',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('slow', 'スロー', 'soft_cc', 2, '80% → 40%')],
  },
  {
    id: 'lulu-w',
    championKey: 'Lulu',
    championName: 'ルル',
    championRole: ['Support', 'Mage'],
    key: 'W',
    name: 'イタズラ',
    description:
      '味方には攻撃速度と移動速度増加を付与する。敵にはポリモーフを付与し、通常攻撃とスキルの使用を封じる。',
    iconUrl: spellIcon('LuluW.png'),
    championIconUrl: LULU_ICON,
    targetType: 'point_and_click',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [
      effect('polymorph', 'ポリモーフ', 'hard_cc', 2, '変身 / 無力化'),
      effect('haste', '移動速度増加', 'buff', 2, '味方: 30%'),
    ],
  },
  {
    id: 'lulu-e',
    championKey: 'Lulu',
    championName: 'ルル',
    championRole: ['Support', 'Mage'],
    key: 'E',
    name: 'ピックス、おねがい！',
    description:
      '味方にはシールドを付与し、ピックスを送り込む。敵にはダメージを与え、その後ピックスが対象を可視状態にする。',
    iconUrl: spellIcon('LuluE.png'),
    championIconUrl: LULU_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('shield', 'シールド', 'buff', 2.5, '最大240'),
      effect('vision', '視界確保', 'buff', 4, '4.0秒'),
    ],
  },
  {
    id: 'lulu-r',
    championKey: 'Lulu',
    championName: 'ルル',
    championRole: ['Support', 'Mage'],
    key: 'R',
    name: 'おおきくなぁれ！',
    description:
      '味方1体を巨大化させ、周囲の敵をノックアップする。対象は最大体力が増加し、周囲にスロウの輪を生み出す。',
    iconUrl: spellIcon('LuluR.png'),
    championIconUrl: LULU_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('knockup', 'ノックアップ', 'hard_cc', 0.75, '周囲の敵'),
      effect('max_health', '最大体力増加', 'buff', 7, '最大600'),
      effect('slow', 'スロー', 'soft_cc', 7, '30%'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* アリスター                                                          */
/* ------------------------------------------------------------------ */

const ALISTAR_ICON = championIcon('Alistar')

const ALISTAR_SKILLS: SkillItem[] = [
  {
    id: 'alistar-p',
    championKey: 'Alistar',
    championName: 'アリスター',
    championRole: ['Tank', 'Support'],
    key: 'P',
    name: '戦士の咆哮',
    description:
      '敵チャンピオンをスタン・ノックバックするか、周囲で敵ユニットが倒れると咆哮をチャージする。最大時に自身と近くの味方を回復する。',
    iconUrl: passiveIcon('Alistar_E.png'),
    championIconUrl: ALISTAR_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('heal', '体力回復', 'buff', undefined, '最大331')],
  },
  {
    id: 'alistar-q',
    championKey: 'Alistar',
    championName: 'アリスター',
    championRole: ['Tank', 'Support'],
    key: 'Q',
    name: '圧砕',
    description: '地面をたたきつけ、周囲にいる敵ユニットにダメージを与えてノックアップする。',
    iconUrl: spellIcon('Pulverize.png'),
    championIconUrl: ALISTAR_ICON,
    targetType: 'aoe',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('knockup', 'ノックアップ', 'hard_cc', 1, '1.0秒')],
  },
  {
    id: 'alistar-w',
    championKey: 'Alistar',
    championName: 'アリスター',
    championRole: ['Tank', 'Support'],
    key: 'W',
    name: '頭突き',
    description: '対象に頭突きを食らわせてダメージを与え、ノックバックさせる。',
    iconUrl: spellIcon('Headbutt.png'),
    championIconUrl: ALISTAR_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('knockback', 'ノックバック', 'hard_cc', 0.5, '0.5秒')],
  },
  {
    id: 'alistar-e',
    championKey: 'Alistar',
    championName: 'アリスター',
    championRole: ['Tank', 'Support'],
    key: 'E',
    name: '踏破',
    description:
      '周囲の敵を踏みつける。チャンピオンにダメージを与えるとスタックを獲得し、最大時に次の通常攻撃へスタンと追加魔法ダメージを付与する。',
    iconUrl: spellIcon('AlistarE.png'),
    championIconUrl: ALISTAR_ICON,
    targetType: 'aoe',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('stun', 'スタン', 'hard_cc', 1.5, '5スタック時')],
  },
  {
    id: 'alistar-r',
    championKey: 'Alistar',
    championName: 'アリスター',
    championRole: ['Tank', 'Support'],
    key: 'R',
    name: '不屈の意志',
    description:
      '自身に付与された行動妨害効果をすべて解除し、効果時間中は自身が受ける物理・魔法ダメージを軽減する。',
    iconUrl: spellIcon('FerociousHowl.png'),
    championIconUrl: ALISTAR_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('cc_immunity', '行動妨害解除', 'buff', 7, '発動時に解除'),
      effect('damage_reduction', 'ダメージ軽減', 'buff', 7, '最大70%'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* アッシュ                                                            */
/* ------------------------------------------------------------------ */

const ASHE_ICON = championIcon('Ashe')

const ASHE_SKILLS: SkillItem[] = [
  {
    id: 'ashe-p',
    championKey: 'Ashe',
    championName: 'アッシュ',
    championRole: ['Marksman', 'Support'],
    key: 'P',
    name: 'フロストショット',
    description:
      '通常攻撃が命中した対象にスロウ効果を付与する。さらにその対象への通常攻撃はダメージが増加する。',
    iconUrl: passiveIcon('Ashe_P.png'),
    championIconUrl: ASHE_ICON,
    targetType: 'self',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('slow', 'スロー', 'soft_cc', 2, '25%')],
  },
  {
    id: 'ashe-q',
    championKey: 'Ashe',
    championName: 'アッシュ',
    championRole: ['Marksman', 'Support'],
    key: 'Q',
    name: 'レンジャーフォーカス',
    description:
      'フォーカスのスタックをすべて消費し、効果時間中は攻撃速度を増加させて通常攻撃を「疾風の矢」に変化させる。',
    iconUrl: spellIcon('AsheQ.png'),
    championIconUrl: ASHE_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('attack_speed', '攻撃速度増加', 'buff', 6, '25%〜45%')],
  },
  {
    id: 'ashe-w',
    championKey: 'Ashe',
    championName: 'アッシュ',
    championRole: ['Marksman', 'Support'],
    key: 'W',
    name: 'ボレー',
    description:
      '矢を扇状に発射し、命中した敵にダメージを与える。同時に「フロストショット」のレベルに応じたスロウを付与する。',
    iconUrl: spellIcon('Volley.png'),
    championIconUrl: ASHE_ICON,
    targetType: 'skillshot',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('slow', 'スロー', 'soft_cc', 2, '30%')],
  },
  {
    id: 'ashe-e',
    championKey: 'Ashe',
    championName: 'アッシュ',
    championRole: ['Marksman', 'Support'],
    key: 'E',
    name: 'スカウトホーク',
    description:
      'マップ上の指定した地点へホークスピリットを放ち、一定時間その周囲の視界を確保する。',
    iconUrl: spellIcon('AsheSpiritOfTheHawk.png'),
    championIconUrl: ASHE_ICON,
    targetType: 'aoe',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('vision', '視界確保', 'buff', 5, '5.0秒')],
  },
  {
    id: 'ashe-r',
    championKey: 'Ashe',
    championName: 'アッシュ',
    championRole: ['Marksman', 'Support'],
    key: 'R',
    name: 'クリスタルアロー',
    description:
      '一直線に飛翔する氷の矢を放ち、最初に命中した敵チャンピオンに飛距離に応じたスタンを与える。着弾地点の周囲にもダメージとスロウを与える。',
    iconUrl: spellIcon('EnchantedCrystalArrow.png'),
    championIconUrl: ASHE_ICON,
    targetType: 'skillshot',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [
      effect('stun', 'スタン', 'hard_cc', 3.5, '最大3.5秒'),
      effect('slow', 'スロー', 'soft_cc', 3, '50%'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* マルファイト                                                        */
/* ------------------------------------------------------------------ */

const MALPHITE_ICON = championIcon('Malphite')

const MALPHITE_SKILLS: SkillItem[] = [
  {
    id: 'malphite-p',
    championKey: 'Malphite',
    championName: 'マルファイト',
    championRole: ['Tank', 'Mage'],
    key: 'P',
    name: 'グラナイトシールド',
    description:
      '自身の最大体力の10%までのダメージを吸収する岩のシールドを生成する。数秒間攻撃を受けないと再生する。',
    iconUrl: passiveIcon('Malphite_GraniteShield.png'),
    championIconUrl: MALPHITE_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('shield', 'シールド', 'buff', undefined, '最大体力の10%')],
  },
  {
    id: 'malphite-q',
    championKey: 'Malphite',
    championName: 'マルファイト',
    championRole: ['Tank', 'Mage'],
    key: 'Q',
    name: 'サイズミックシャード',
    description:
      '指定した敵に向かって岩の円盤を転がし、衝突時にダメージを与えて3秒間移動速度を奪う。',
    iconUrl: spellIcon('SeismicShard.png'),
    championIconUrl: MALPHITE_ICON,
    targetType: 'point_and_click',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('slow', 'スロー', 'soft_cc', 3, '40%')],
  },
  {
    id: 'malphite-w',
    championKey: 'Malphite',
    championName: 'マルファイト',
    championRole: ['Tank', 'Mage'],
    key: 'W',
    name: 'サンダークラップ',
    description:
      '大きな力で攻撃してソニックブームを発生させる。その後数秒間、通常攻撃に余波が発生し、物理防御が増加する。',
    iconUrl: spellIcon('Obduracy.png'),
    championIconUrl: MALPHITE_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('resistance', '物理防御増加', 'buff', 5, '物理防御 +30%'),
    ],
  },
  {
    id: 'malphite-e',
    championKey: 'Malphite',
    championName: 'マルファイト',
    championRole: ['Tank', 'Mage'],
    key: 'E',
    name: 'グラウンドスラム',
    description:
      '地面を強打して衝撃波を起こし、自身の物理防御に応じた魔法ダメージを与える。衝撃波に当たった敵は攻撃速度が短時間低下する。',
    iconUrl: spellIcon('Landslide.png'),
    championIconUrl: MALPHITE_ICON,
    targetType: 'aoe',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('attack_speed_shred', '攻撃速度低下', 'debuff', 3, '50%'),
    ],
  },
  {
    id: 'malphite-r',
    championKey: 'Malphite',
    championName: 'マルファイト',
    championRole: ['Tank', 'Mage'],
    key: 'R',
    name: 'アンストッパブル・フォース',
    description:
      '指定地点に勢いよく跳躍し、範囲内の敵ユニットにダメージを与えてノックアップさせる。',
    iconUrl: spellIcon('UFSlash.png'),
    championIconUrl: MALPHITE_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('knockup', 'ノックアップ', 'hard_cc', 1.5, '1.5秒')],
  },
]

/* ------------------------------------------------------------------ */
/* ウーコン                                                            */
/* ------------------------------------------------------------------ */

const WUKONG_ICON = championIcon('MonkeyKing')

const WUKONG_SKILLS: SkillItem[] = [
  {
    id: 'wukong-p',
    championKey: 'MonkeyKing',
    championName: 'ウーコン',
    championRole: ['Fighter', 'Tank'],
    key: 'P',
    name: '岩の皮膚',
    description:
      'チャンピオンまたはモンスターと戦闘中は、スタック可能な物理防御と最大体力に応じた自動回復を獲得する。',
    iconUrl: passiveIcon('MonkeyKingStoneSkin.png'),
    championIconUrl: WUKONG_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('resistance', '物理防御増加', 'buff', 6, '最大8スタック'),
    ],
  },
  {
    id: 'wukong-q',
    championKey: 'MonkeyKing',
    championName: 'ウーコン',
    championRole: ['Fighter', 'Tank'],
    key: 'Q',
    name: '強棒打',
    description:
      '次の通常攻撃の射程が増加して追加ダメージを与え、対象の物理防御を数秒間低下させる。',
    iconUrl: spellIcon('MonkeyKingDoubleAttack.png'),
    championIconUrl: WUKONG_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('armor_shred', '物理防御低下', 'debuff', 3, '45%')],
  },
  {
    id: 'wukong-w',
    championKey: 'MonkeyKing',
    championName: 'ウーコン',
    championRole: ['Fighter', 'Tank'],
    key: 'W',
    name: '戦士の幻惑',
    description:
      'インビジブル状態になって指定方向にダッシュする。元いた場所には近くの敵を攻撃する分身が残る。',
    iconUrl: spellIcon('MonkeyKingDecoy.png'),
    championIconUrl: WUKONG_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('invisibility', 'インビジブル', 'buff', 1.5, '1.5秒'),
    ],
  },
  {
    id: 'wukong-e',
    championKey: 'MonkeyKing',
    championName: 'ウーコン',
    championRole: ['Fighter', 'Tank'],
    key: 'E',
    name: '乱像猿技',
    description:
      '指定した対象に向かって突撃し、複数の残像を発生させる。残像は対象の近くにいる敵を攻撃する。',
    iconUrl: spellIcon('MonkeyKingNimbus.png'),
    championIconUrl: WUKONG_ICON,
    targetType: 'point_and_click',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('attack_speed', '攻撃速度増加', 'buff', 5, '30%〜50%'),
    ],
  },
  {
    id: 'wukong-r',
    championKey: 'MonkeyKing',
    championName: 'ウーコン',
    championRole: ['Fighter', 'Tank'],
    key: 'R',
    name: '旋風猿舞',
    description:
      '如意棒を伸ばして回転し、自身の移動速度が増加する。如意棒に触れた敵にダメージを与えてノックアップさせる。',
    iconUrl: spellIcon('MonkeyKingSpinToWin.png'),
    championIconUrl: WUKONG_ICON,
    targetType: 'aoe',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('knockup', 'ノックアップ', 'hard_cc', 1, '1.0秒'),
      effect('haste', '移動速度増加', 'buff', 4, '30%'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* コグ＝マウ                                                          */
/* ------------------------------------------------------------------ */

const KOGMAW_ICON = championIcon('KogMaw')

const KOGMAW_SKILLS: SkillItem[] = [
  {
    id: 'kogmaw-p',
    championKey: 'KogMaw',
    championName: 'コグ＝マウ',
    championRole: ['Marksman', 'Mage'],
    key: 'P',
    name: 'イカシアの自爆',
    description:
      '倒されてから4秒後、コグ＝マウは爆発して周囲の敵に確定ダメージを与える。',
    iconUrl: passiveIcon('KogMaw_IcathianSurprise.png'),
    championIconUrl: KOGMAW_ICON,
    targetType: 'aoe',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [],
  },
  {
    id: 'kogmaw-q',
    championKey: 'KogMaw',
    championName: 'コグ＝マウ',
    championRole: ['Marksman', 'Mage'],
    key: 'Q',
    name: '腐食粘液',
    description:
      '苛性の粘液を飛ばし、対象に魔法ダメージを与え、物理防御と魔法防御を短時間低下させる。さらに自身の攻撃速度が増加する。',
    iconUrl: spellIcon('KogMawQ.png'),
    championIconUrl: KOGMAW_ICON,
    targetType: 'skillshot',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [
      effect('armor_shred', '物理防御低下', 'debuff', 4, '28%'),
      effect('magic_shred', '魔法防御低下', 'debuff', 4, '28%'),
    ],
  },
  {
    id: 'kogmaw-w',
    championKey: 'KogMaw',
    championName: 'コグ＝マウ',
    championRole: ['Marksman', 'Mage'],
    key: 'W',
    name: '有機性魔力砲',
    description:
      '通常攻撃の射程距離が増加し、対象の最大体力に比例した魔法ダメージを与える。',
    iconUrl: spellIcon('KogMawBioArcaneBarrage.png'),
    championIconUrl: KOGMAW_ICON,
    targetType: 'self',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('range', '射程増加', 'buff', 8, '+130')],
  },
  {
    id: 'kogmaw-e',
    championKey: 'KogMaw',
    championName: 'コグ＝マウ',
    championRole: ['Marksman', 'Mage'],
    key: 'E',
    name: 'ヴォイド分泌液',
    description:
      '敵を貫通する粘液を発射し、命中した敵にダメージを与える。粘液は通過したエリアに残り、踏んだ敵にスロウを付与する。',
    iconUrl: spellIcon('KogMawVoidOoze.png'),
    championIconUrl: KOGMAW_ICON,
    targetType: 'skillshot',
    cleansable: true,
    qssCleanse: true,
    damageTypes: [],
    effects: [effect('slow', 'スロー', 'soft_cc', 2, '50%')],
  },
  {
    id: 'kogmaw-r',
    championKey: 'KogMaw',
    championName: 'コグ＝マウ',
    championRole: ['Marksman', 'Mage'],
    key: 'R',
    name: '生体空撃砲',
    description:
      '射程の長い砲弾を発射して魔法ダメージを与えるとともに、敵を可視状態にする。連発すると消費マナが増加する。',
    iconUrl: spellIcon('KogMawLivingArtillery.png'),
    championIconUrl: KOGMAW_ICON,
    targetType: 'aoe',
    cleansable: false,
    qssCleanse: false,
    damageTypes: [],
    effects: [effect('vision', '視界確保', 'buff', 3, '3.0秒')],
  },
]

/* ------------------------------------------------------------------ */

export const MOCK_SKILLS: SkillItem[] = [
  ...MORGANA_SKILLS,
  ...MALZAHAR_SKILLS,
  ...YASUO_SKILLS,
  ...NASUS_SKILLS,
  ...LULU_SKILLS,
  ...ALISTAR_SKILLS,
  ...ASHE_SKILLS,
  ...MALPHITE_SKILLS,
  ...WUKONG_SKILLS,
  ...KOGMAW_SKILLS,
]

export const MOCK_PATCH_VERSION = '16.22.1'
export const MOCK_CHAMPION_COUNT = new Set(MOCK_SKILLS.map((skill) => skill.championKey)).size
export const MOCK_SKILL_COUNT = MOCK_SKILLS.length
