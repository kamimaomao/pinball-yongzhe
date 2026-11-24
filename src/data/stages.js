// 《弹珠勇者 · 弹夹撞击闯关录》6 章 18 关主线讨伐战役
// 100% 采用《闯关勇者》roleDB 魔物与首领立绘 + 独立 _st 挨揍颜艺帧 + 原版关卡大图背景

import { BATTLE_PROPS, bgRel, roleHitRel, rolePortraitRel } from '../assets.js';

function m(roleKey, name, element, xPct, yPct, radius, hp, atk, cd, isBoss = false, skillLabel = '', weakPoints = 0, hasSt = true) {
  return {
    name,
    roleKey,
    portrait: rolePortraitRel(roleKey),
    hitPortrait: roleHitRel(roleKey, hasSt),
    isBoss,
    element,
    xPct,
    yPct,
    radius,
    hp,
    atk,
    cd,
    skillLabel,
    weakPoints,
  };
}

function bmp(xPct, yPct, radius, kind = 'dummy') {
  const sprite =
    kind === 'chest'
      ? BATTLE_PROPS.bumperChest
      : kind === 'shield'
        ? BATTLE_PROPS.bumperShield
        : BATTLE_PROPS.bumperDummy;
  const label = kind === 'chest' ? '机关宝箱' : kind === 'shield' ? '反伤圣盾' : '训练木桩';
  return { xPct, yPct, radius, sprite, label };
}

function stg(id, chapter, chapterTitle, stageNum, name, subtitle, bgFile, emblemFile, recElement, energyCost, rewardCoins, rewardGems, firstClearHeroId, firstClearTreasureId, bossRoleKey, bossQuote, waves) {
  return {
    id,
    chapter,
    chapterTitle,
    stageNum,
    name,
    subtitle,
    bg: bgRel(bgFile),
    emblem: bgRel(emblemFile),
    recElement,
    energyCost,
    rewardCoins,
    rewardGems,
    firstClearHeroId,
    firstClearTreasureId,
    bossPortrait: rolePortraitRel(bossRoleKey),
    bossQuote,
    waves,
  };
}

export const STAGES = [
  // ==================== 第一章：艾尔文森林 · 豺狼人暴动 ====================
  stg('1-1', 1, '第一章 · 翡翠林地', 1, '林间哨站', '弹飞偷袭营地的绿皮地精与野猪', 'bg_normal_level_1.jpg', 'changjingxiao_1.png', 'fire', 5, 280, 40, 'longkai', 't_drumstick', 'moster_2_2', '哼哧！重甲野猪冲锋，看谁撞得过谁！', [
    {
      bumpers: [bmp(0.5, 0.42, 23, 'dummy')],
      enemies: [
        m('moster_1_14', '暴躁地精', 'wood', 0.26, 0.24, 27, 920, 140, 2),
        m('moster_2_1', '野猪公主', 'wood', 0.5, 0.18, 30, 1180, 160, 3),
        m('moster_1_14', '暴躁地精', 'wood', 0.74, 0.24, 27, 920, 140, 3),
      ],
    },
    {
      bumpers: [bmp(0.25, 0.36, 22, 'dummy'), bmp(0.75, 0.36, 22, 'dummy')],
      enemies: [
        m('moster_2_11', '绿软泥怪', 'wood', 0.24, 0.21, 28, 1080, 155, 2),
        m('moster_2_19', '荆棘树人', 'wood', 0.5, 0.28, 32, 1450, 175, 3),
        m('moster_2_11', '绿软泥怪', 'wood', 0.76, 0.21, 28, 1080, 155, 2),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.47, 24, 'chest')],
      enemies: [
        m('moster_2_2', '林地恶霸 · 铠甲野猪', 'wood', 0.5, 0.23, 54, 6000, 300, 3, true, '重甲蛮猪冲撞', 1),
        m('moster_2_29', '炸毛猫meme', 'wood', 0.2, 0.34, 26, 1020, 145, 2),
        m('moster_2_29', '炸毛猫meme', 'wood', 0.8, 0.34, 26, 1020, 145, 3),
      ],
    },
  ]),

  stg('1-2', 1, '第一章 · 翡翠林地', 2, '暮色农场', '稻草人与悲伤蛙盘踞的荒芜麦田', 'bg_normal_level_2.jpg', 'changjingxiao_1.png', 'fire', 6, 350, 50, null, 't_wand', 'moster_2_36', '麦田里的闯入者，吃我一记丰收镰刀！', [
    {
      enemies: [
        m('moster_2_32', '悲伤蛙', 'water', 0.28, 0.22, 29, 1320, 170, 2),
        m('moster_2_20', '荆棘野猪人', 'wood', 0.5, 0.34, 31, 1560, 185, 3),
        m('moster_2_32', '悲伤蛙', 'water', 0.72, 0.22, 29, 1320, 170, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.29, 23, 'dummy')],
      enemies: [
        m('moster_2_37', '发条铁皮人', 'gold', 0.27, 0.22, 35, 2250, 215, 3),
        m('moster_2_38', '狂暴雄狮', 'fire', 0.73, 0.22, 35, 2250, 215, 3),
      ],
    },
    {
      bumpers: [bmp(0.22, 0.44, 22, 'dummy'), bmp(0.78, 0.44, 22, 'dummy')],
      enemies: [
        m('moster_2_36', '麦田梦魇 · 稻草人', 'wood', 0.5, 0.23, 56, 8400, 340, 3, true, '群鸦恐惧旋风', 1),
        m('moster_2_33', '狡诈狼外婆', 'star', 0.21, 0.2, 28, 1300, 170, 2),
        m('moster_2_33', '狡诈狼外婆', 'star', 0.79, 0.2, 28, 1300, 170, 3),
      ],
    },
  ]),

  stg('1-3', 1, '第一章 · 翡翠林地', 3, '河爪大本营', '迎战新手村噩梦——豺狼人首领霍格！', 'bg_normal_level_3.jpg', 'changjingxiao_1.png', 'fire', 7, 480, 75, 'daodun', 't_gem', 'moster_2_6', '森林是霍格的领地，把金币统统交出来！', [
    {
      bumpers: [bmp(0.5, 0.37, 24, 'shield')],
      enemies: [
        m('moster_2_7', '蒙面盗贼', 'star', 0.24, 0.2, 28, 1580, 190, 2),
        m('moster_2_8', '野猪人法师', 'fire', 0.5, 0.18, 32, 2050, 220, 3),
        m('moster_2_7', '蒙面盗贼', 'star', 0.76, 0.2, 28, 1580, 190, 2),
      ],
    },
    {
      enemies: [
        m('moster_2_13', '重甲狂犀', 'wood', 0.5, 0.24, 42, 4400, 280, 3),
        m('moster_2_28', '比比拉布', 'wood', 0.22, 0.35, 28, 1500, 180, 2),
        m('moster_2_28', '比比拉布', 'wood', 0.78, 0.35, 28, 1500, 180, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.46, 24, 'chest')],
      enemies: [
        m('moster_2_6', '豺狼人暴君 · 霍格', 'wood', 0.5, 0.22, 58, 11400, 395, 3, true, '碎颅连枷猛击', 2),
        m('moster_1_14', '劫掠地精', 'wood', 0.2, 0.3, 27, 1780, 195, 2),
        m('moster_1_14', '劫掠地精', 'wood', 0.8, 0.3, 27, 1780, 195, 3),
      ],
    },
  ]),

  // ==================== 第二章：西部荒野 · 兄弟会矿坑 ====================
  stg('2-1', 2, '第二章 · 赤脊矿脉', 1, '死亡矿井口', '迪菲亚流民封锁了富饶的黄金矿道', 'bg_normal_level_4.jpg', 'changjingxiao_2.png', 'water', 7, 540, 55, 'panda', 't_medal', 'moster_2_16', '我们的事业是正义的！兄弟会绝不投降！', [
    {
      bumpers: [bmp(0.5, 0.4, 24, 'chest')],
      enemies: [
        m('moster_2_15', '迪菲亚流民', 'fire', 0.26, 0.22, 28, 1900, 215, 2),
        m('moster_2_12', '食人魔法师', 'fire', 0.5, 0.18, 33, 2450, 240, 3),
        m('moster_2_15', '迪菲亚流民', 'fire', 0.74, 0.22, 28, 1900, 215, 3),
      ],
    },
    {
      enemies: [
        m('moster_2_23', '半人马可汗', 'gold', 0.5, 0.24, 42, 5100, 305, 3),
        m('moster_2_7', '矿道暗哨', 'star', 0.22, 0.35, 27, 1800, 210, 2),
        m('moster_2_7', '矿道暗哨', 'star', 0.78, 0.35, 27, 1800, 210, 2),
      ],
    },
    {
      bumpers: [bmp(0.24, 0.44, 22, 'shield'), bmp(0.76, 0.44, 22, 'shield')],
      enemies: [
        m('moster_2_16', '兄弟会魁首 · 艾德温', 'fire', 0.5, 0.23, 56, 13800, 430, 3, true, '暗影双刃风暴', 1),
        m('moster_2_15', '精锐流民', 'fire', 0.2, 0.2, 26, 1880, 205, 2),
        m('moster_2_15', '精锐流民', 'fire', 0.8, 0.2, 26, 1880, 205, 3),
      ],
    },
  ]),

  stg('2-2', 2, '第二章 · 赤脊矿脉', 2, '灼热荒漠', '小心脚下钻出的剧毒巨蝎与炸弹红蟹', 'bg_normal_level_5.jpg', 'changjingxiao_2.png', 'water', 8, 650, 60, null, 't_cat', 'moster_2_25', '荒漠毒尾之下，连岩石都会融化！', [
    {
      enemies: [
        m('moster_2_4', '炸弹红蟹', 'fire', 0.25, 0.2, 29, 2150, 235, 2),
        m('moster_2_27', '重甲威虫', 'wood', 0.5, 0.28, 33, 2750, 260, 3),
        m('moster_2_4', '炸弹红蟹', 'fire', 0.75, 0.2, 29, 2150, 235, 2),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.38, 24, 'dummy')],
      enemies: [
        m('moster_3_2', '荒原钢背兽', 'gold', 0.5, 0.22, 44, 6100, 335, 3),
        m('moster_2_22', '狂躁火元素', 'fire', 0.22, 0.3, 28, 2150, 230, 2),
        m('moster_2_22', '狂躁火元素', 'fire', 0.78, 0.3, 28, 2150, 230, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.47, 24, 'chest')],
      enemies: [
        m('moster_2_25', '赤漠霸主 · 巨蝎王', 'fire', 0.5, 0.22, 58, 17000, 475, 3, true, '熔岩毒尾穿刺', 2),
        m('moster_2_4', '自爆沙蟹', 'fire', 0.2, 0.32, 27, 2250, 235, 2),
        m('moster_2_4', '自爆沙蟹', 'fire', 0.8, 0.32, 27, 2250, 235, 3),
      ],
    },
  ]),

  stg('2-3', 2, '第二章 · 赤脊矿脉', 3, '熔岩裂谷', '烈焰地狱火苏醒，守护通往深海的峡谷', 'bg_normal_level_6.jpg', 'changjingxiao_2.png', 'water', 8, 860, 90, 'shuangzhao', 't_pouch', 'moster_2_14', '燃烧吧！在大地裂隙中化为灰烬！', [
    {
      bumpers: [bmp(0.26, 0.36, 22, 'shield'), bmp(0.74, 0.36, 22, 'shield')],
      enemies: [
        m('moster_2_22', '裂谷火灵', 'fire', 0.25, 0.19, 28, 2450, 255, 2),
        m('moster_2_42', '战争使者', 'fire', 0.5, 0.24, 34, 3150, 285, 3),
        m('moster_2_22', '裂谷火灵', 'fire', 0.75, 0.19, 28, 2450, 255, 2),
      ],
    },
    {
      enemies: [
        m('moster_3_14', '赤鳞魔暴龙', 'fire', 0.5, 0.23, 45, 7200, 365, 3),
        m('moster_2_43', '双头火鹫', 'gold', 0.22, 0.34, 28, 2450, 250, 2),
        m('moster_2_43', '双头火鹫', 'gold', 0.78, 0.34, 28, 2450, 250, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.46, 25, 'chest')],
      enemies: [
        m('moster_2_14', '陨星魔像 · 地狱火', 'fire', 0.5, 0.22, 60, 21500, 525, 3, true, '熔核陨石震击', 2),
        m('moster_2_22', '伴生炎灵', 'fire', 0.19, 0.28, 28, 2700, 265, 2),
        m('moster_2_22', '伴生炎灵', 'fire', 0.81, 0.28, 28, 2700, 265, 3),
      ],
    },
  ]),

  // ==================== 第三章：怒涛海渊 · 娜迦神殿 ====================
  stg('3-1', 3, '第三章 · 怒涛海渊', 1, '潮汐珊瑚礁', '鱼人军团与盐晶巨虾正在集结', 'bg_normal_level_7.jpg', 'changjingxiao_3.png', 'wood', 8, 760, 60, 'lieren_blade', 't_snow', 'moster_3_8', '呜啦啦啦！深海巨触将把船只拖入海底！', [
    {
      enemies: [
        m('moster_2_3', '潮汐小鱼人', 'water', 0.26, 0.22, 28, 2750, 275, 2),
        m('moster_2_30', '盐晶巨虾', 'water', 0.5, 0.32, 32, 3350, 305, 3),
        m('moster_2_3', '潮汐小鱼人', 'water', 0.74, 0.22, 28, 2750, 275, 2),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.42, 24, 'shield')],
      enemies: [
        m('moster_2_26', '暗影鱼人王', 'water', 0.5, 0.22, 44, 8000, 385, 3),
        m('moster_2_5', '深海巨钳蟹', 'water', 0.22, 0.32, 28, 2650, 270, 2),
        m('moster_2_5', '深海巨钳蟹', 'water', 0.78, 0.32, 28, 2650, 270, 3),
      ],
    },
    {
      bumpers: [bmp(0.22, 0.44, 22, 'dummy'), bmp(0.78, 0.44, 22, 'dummy')],
      enemies: [
        m('moster_3_8', '渊海霸主 · 克拉肯海怪', 'water', 0.5, 0.22, 58, 25000, 565, 3, true, '深渊怒涛绞杀', 2),
        m('moster_2_30', '护卫晶虾', 'water', 0.2, 0.24, 28, 3050, 290, 2),
        m('moster_2_30', '护卫晶虾', 'water', 0.8, 0.24, 28, 3050, 290, 3),
      ],
    },
  ]),

  stg('3-2', 3, '第三章 · 怒涛海渊', 2, '沉没祭坛', '娜迦女祭司吟唱着海潮风暴咒文', 'bg_normal_level_8.jpg', 'changjingxiao_3.png', 'wood', 9, 860, 65, null, 't_beef', 'moster_3_9', '向潮汐王座俯首称臣吧，陆地生灵！', [
    {
      enemies: [
        m('moster_2_5', '铁甲海蟹', 'water', 0.25, 0.22, 29, 3050, 295, 2),
        m('moster_2_31', '深海尔多隆', 'water', 0.5, 0.19, 32, 3650, 325, 3),
        m('moster_2_5', '铁甲海蟹', 'water', 0.75, 0.22, 29, 3050, 295, 2),
      ],
    },
    {
      enemies: [
        m('moster_3_6', '幻彩仙灵龙·帕克', 'star', 0.5, 0.24, 44, 9000, 415, 3),
        m('moster_2_26', '深潜鱼人', 'water', 0.22, 0.35, 27, 2950, 290, 2),
        m('moster_2_26', '深潜鱼人', 'water', 0.78, 0.35, 27, 2950, 290, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.46, 24, 'chest')],
      enemies: [
        m('moster_3_9', '潮汐神官 · 娜迦女祭司', 'water', 0.5, 0.22, 58, 28500, 605, 3, true, '海皇叉戟雷暴', 2),
        m('moster_2_30', '祭坛晶虾', 'water', 0.2, 0.3, 28, 3350, 310, 2),
        m('moster_2_30', '祭坛晶虾', 'water', 0.8, 0.3, 28, 3350, 310, 3),
      ],
    },
  ]),

  stg('3-3', 3, '第三章 · 怒涛海渊', 3, '祖尔法拉克水潭', '三头水蛇神加兹瑞拉破水而出！', 'bg_normal_level_9.jpg', 'changjingxiao_3.png', 'wood', 9, 980, 100, 'boss_nagapriest', 't_totem', 'moster_3_12', '三首齐吟，掀起席卷天地的滔天海啸！', [
    {
      bumpers: [bmp(0.5, 0.38, 24, 'shield')],
      enemies: [
        m('moster_2_24', '邪恶水巨魔', 'water', 0.24, 0.2, 29, 3450, 320, 2),
        m('moster_2_40', '深渊纳克', 'star', 0.5, 0.18, 33, 4150, 345, 3),
        m('moster_2_24', '邪恶水巨魔', 'water', 0.76, 0.2, 29, 3450, 320, 2),
      ],
    },
    {
      enemies: [
        m('moster_3_3', '剧毒冥界亚龙', 'wood', 0.5, 0.24, 46, 11000, 455, 3),
        m('moster_2_3', '狂热鱼人', 'water', 0.22, 0.35, 27, 3350, 315, 2),
        m('moster_2_3', '狂热鱼人', 'water', 0.78, 0.35, 27, 3350, 315, 3),
      ],
    },
    {
      bumpers: [bmp(0.22, 0.45, 22, 'chest'), bmp(0.78, 0.45, 22, 'chest')],
      enemies: [
        m('moster_3_12', '远古水蛇神 · 加兹瑞拉', 'water', 0.5, 0.22, 60, 33800, 650, 3, true, '三首寒潮喷涌', 2),
        m('moster_2_30', '护渊晶虾', 'water', 0.2, 0.24, 28, 3750, 330, 2),
        m('moster_2_30', '护渊晶虾', 'water', 0.8, 0.24, 28, 3750, 330, 3),
      ],
    },
  ]),

  // ==================== 第四章：风神王座 · 云巅雷鸣 ====================
  stg('4-1', 4, '第四章 · 云巅神座', 1, '旋风阶梯', '冲破飓风元素与山岭巨人的空中封锁', 'img_jgbj_jgzq.jpg', 'changjingxiao_4.png', 'star', 9, 920, 65, null, 't_rage', 'moster_3_16', '休想踏上泰坦铸造的云端阶梯！', [
    {
      enemies: [
        m('moster_2_10', '狂飙风元素', 'gold', 0.26, 0.22, 29, 3750, 335, 2),
        m('moster_2_43', '云巅双头鹫', 'gold', 0.5, 0.26, 36, 5400, 375, 3),
        m('moster_2_10', '狂飙风元素', 'gold', 0.74, 0.22, 29, 3750, 335, 2),
      ],
    },
    {
      enemies: [
        m('moster_2_34', '幻剧剑客·罗密欧', 'gold', 0.32, 0.24, 38, 5700, 385, 2),
        m('moster_2_35', '圣光修女·朱丽叶', 'gold', 0.68, 0.24, 38, 5700, 385, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.45, 24, 'shield')],
      enemies: [
        m('moster_3_16', '云巅泰坦 · 山岭巨人', 'gold', 0.5, 0.22, 58, 37500, 680, 3, true, '泰坦岩拳轰击', 2),
        m('moster_2_10', '护卫风灵', 'gold', 0.2, 0.3, 28, 4050, 345, 2),
        m('moster_2_10', '护卫风灵', 'gold', 0.8, 0.3, 28, 4050, 345, 3),
      ],
    },
  ]),

  stg('4-2', 4, '第四章 · 云巅神座', 2, '黑曜龙巢', '红莲火龙与幼龙群盘踞在云海火山口', 'img_bj_slzt.jpg', 'changjingxiao_4.png', 'water', 9, 1020, 70, 'boss_firedragon', 't_potion', 'moster_3_5', '巨龙吐息之下，连云海都将沸腾！', [
    {
      enemies: [
        m('moster_3_5_b', '暴怒赤幼龙', 'fire', 0.32, 0.24, 38, 6300, 405, 3),
        m('moster_3_13', '圣羽信使鸽', 'gold', 0.68, 0.24, 38, 6300, 405, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.38, 24, 'chest')],
      enemies: [
        m('moster_3_14', '熔火魔暴龙', 'fire', 0.5, 0.22, 44, 11500, 475, 3),
        m('moster_2_22', '烈焰元素', 'fire', 0.22, 0.32, 28, 4150, 360, 2),
        m('moster_2_22', '烈焰元素', 'fire', 0.78, 0.32, 28, 4150, 360, 3),
      ],
    },
    {
      bumpers: [bmp(0.23, 0.45, 22, 'shield'), bmp(0.77, 0.45, 22, 'shield')],
      enemies: [
        m('moster_3_5', '黑曜龙皇 · 红莲火龙', 'fire', 0.5, 0.22, 58, 42000, 720, 3, true, '红莲灭世龙息', 2),
        m('moster_3_5_b', '护巢幼龙', 'fire', 0.2, 0.22, 28, 4350, 370, 2),
        m('moster_3_5_b', '护巢幼龙', 'fire', 0.8, 0.22, 28, 4350, 370, 3),
      ],
    },
  ]),

  stg('4-3', 4, '第四章 · 云巅神座', 3, '四风神殿之巅', '迎战统御九天雷暴的四风领主奥拉基尔！', 'img_hdmjbJ_hdmj.jpg', 'changjingxiao_4.png', 'star', 10, 1180, 110, 'boss_alakir', 't_axe', 'moster_3_7', '狂风与雷霆！撕碎这群不知天高地厚的凡人！', [
    {
      enemies: [
        m('moster_2_10', '九天飓风灵', 'gold', 0.26, 0.24, 34, 6200, 410, 2),
        m('moster_2_42', '雷霆战争使者', 'gold', 0.5, 0.19, 38, 6700, 415, 3),
        m('moster_2_10', '九天飓风灵', 'gold', 0.74, 0.24, 34, 6200, 410, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.38, 25, 'shield')],
      enemies: [
        m('moster_2_43', '雷云双头鹫', 'gold', 0.25, 0.22, 30, 5100, 405, 2),
        m('moster_3_6', '风暴仙灵龙', 'star', 0.5, 0.26, 36, 6200, 435, 2),
        m('moster_2_43', '雷云双头鹫', 'gold', 0.75, 0.22, 30, 5100, 405, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.47, 24, 'chest')],
      enemies: [
        m('moster_3_7', '天空霸主 · 奥拉基尔', 'gold', 0.5, 0.22, 62, 48500, 775, 3, true, '万钧雷暴漩涡', 2),
        m('moster_2_10', '狂雷元素', 'gold', 0.19, 0.3, 28, 4800, 390, 2),
        m('moster_2_10', '狂雷元素', 'gold', 0.81, 0.3, 28, 4800, 390, 3),
      ],
    },
  ]),

  // ==================== 第五章：斯坦索姆 · 亡灵天灾 ====================
  stg('5-1', 5, '第五章 · 天灾回廊', 1, '瘟疫区实验室', '缝合怪与瘟疫使者散播着致命凋零', 'img_mjbg_hdmj.jpg', 'changjingxiao_5.png', 'gold', 10, 1250, 75, null, 't_dog', 'moster_3_10', '别眨眼，瘟疫坩埚马上就要沸腾了！', [
    {
      enemies: [
        m('moster_2_18', '狂暴食尸鬼', 'star', 0.26, 0.22, 29, 5100, 415, 2),
        m('moster_2_9', '巨型缝合怪', 'wood', 0.5, 0.26, 35, 6300, 445, 3),
        m('moster_2_18', '狂暴食尸鬼', 'star', 0.74, 0.22, 29, 5100, 415, 2),
      ],
    },
    {
      enemies: [
        m('moster_2_21', '暗夜守夜人', 'star', 0.32, 0.24, 40, 8900, 460, 3),
        m('moster_2_17', '鲜血女爵', 'star', 0.68, 0.24, 40, 8900, 460, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.45, 24, 'shield')],
      enemies: [
        m('moster_3_10', '凋零导师 · 瘟疫使者', 'wood', 0.5, 0.22, 60, 54000, 815, 3, true, '亡灵瘟疫毒云', 2),
        m('moster_2_18', '瘟疫食尸鬼', 'wood', 0.2, 0.3, 28, 5300, 420, 2),
        m('moster_2_18', '瘟疫食尸鬼', 'wood', 0.8, 0.3, 28, 5300, 420, 3),
      ],
    },
  ]),

  stg('5-2', 5, '第五章 · 天灾回廊', 2, '死亡骑士大厅', '堕落剑士列阵迎候瑞文戴尔男爵', 'img_bj_fcmj.jpg', 'changjingxiao_5.png', 'gold', 10, 1360, 80, 'boss_icedragon', 't_core', 'moster_3_11', '踏入死亡大厅者，唯有成为我的亡灵铁骑！', [
    {
      enemies: [
        m('moster_2_39', '堕落剑士', 'star', 0.3, 0.24, 40, 9400, 480, 3),
        m('moster_2_41', '白骨战将·摩拉迪', 'star', 0.7, 0.24, 40, 9400, 480, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.38, 24, 'chest')],
      enemies: [
        m('moster_3_15', '冰冠霜翼魔龙', 'water', 0.5, 0.23, 46, 14200, 520, 3),
        m('moster_2_18', '墓穴食尸鬼', 'star', 0.22, 0.34, 28, 5500, 430, 2),
        m('moster_2_18', '墓穴食尸鬼', 'star', 0.78, 0.34, 28, 5500, 430, 3),
      ],
    },
    {
      bumpers: [bmp(0.22, 0.45, 22, 'shield'), bmp(0.78, 0.45, 22, 'shield')],
      enemies: [
        m('moster_3_11', '天灾死骑 · 瑞文戴尔', 'star', 0.5, 0.22, 60, 61000, 860, 3, true, '天灾死亡契约', 2),
        m('moster_2_39', '死骑侍从', 'star', 0.2, 0.24, 28, 5800, 445, 2),
        m('moster_2_39', '死骑侍从', 'star', 0.8, 0.24, 28, 5800, 445, 3),
      ],
    },
  ]),

  stg('5-3', 5, '第五章 · 天灾回廊', 3, '冰霜浮空王座', '决战纳克萨玛斯之主——大巫妖克尔苏加德！', 'img_bg_boss.jpg', 'changjingxiao_5.png', 'gold', 10, 1520, 120, 'boss_kelthuzad', 't_gear', 'moster_3_1', '祈祷吧！浮空城的极寒将把你们永远冻成冰雕！', [
    {
      bumpers: [bmp(0.5, 0.38, 24, 'shield')],
      enemies: [
        m('moster_2_9', '皇家憎恶守卫', 'star', 0.25, 0.2, 31, 6200, 455, 2),
        m('moster_3_15', '极寒骨龙', 'water', 0.5, 0.24, 42, 11800, 515, 3),
        m('moster_2_9', '皇家憎恶守卫', 'star', 0.75, 0.2, 31, 6200, 455, 2),
      ],
    },
    {
      enemies: [
        m('moster_3_11', '先锋统帅·瑞文戴尔', 'star', 0.5, 0.23, 46, 16500, 560, 3),
        m('moster_2_41', '骸骨督军', 'star', 0.22, 0.34, 29, 6100, 450, 2),
        m('moster_2_41', '骸骨督军', 'star', 0.78, 0.34, 29, 6100, 450, 3),
      ],
    },
    {
      bumpers: [bmp(0.2, 0.46, 22, 'chest'), bmp(0.8, 0.46, 22, 'chest')],
      enemies: [
        m('moster_3_1', '浮空城大巫妖 · 克尔苏加德', 'water', 0.5, 0.22, 62, 69000, 910, 3, true, '冰霜裂隙灭世', 2),
        m('moster_2_39', '王座黑骑士', 'star', 0.19, 0.28, 29, 6400, 465, 2),
        m('moster_2_39', '王座黑骑士', 'star', 0.81, 0.28, 29, 6400, 465, 3),
      ],
    },
  ]),

  // ==================== 第六章：黑暗神殿 · 终焉远征 ====================
  stg('6-1', 6, '第六章 · 黑暗神殿', 1, '深渊熔炉前庭', '地狱火督军深渊火魔镇守着城门', 'img_bj_hdmj.jpg', 'changjingxiao_6.png', 'water', 10, 1620, 85, null, 't_scroll', 'moster_3_17', '我的邪能之血，足以焚毁整支远征军！', [
    {
      enemies: [
        m('moster_2_14', '邪能地狱火', 'fire', 0.26, 0.22, 31, 6800, 480, 2),
        m('moster_2_42', '深渊战争狂徒', 'fire', 0.5, 0.25, 38, 9200, 520, 3),
        m('moster_2_14', '邪能地狱火', 'fire', 0.74, 0.22, 31, 6800, 480, 2),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.4, 24, 'shield')],
      enemies: [
        m('moster_3_3', '邪能亚龙', 'wood', 0.32, 0.24, 42, 11800, 540, 3),
        m('moster_3_5', '熔火巨龙', 'fire', 0.68, 0.24, 42, 11800, 540, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.46, 25, 'chest')],
      enemies: [
        m('moster_3_17', '炼狱督军 · 深渊火魔', 'fire', 0.5, 0.22, 62, 76000, 950, 3, true, '深渊陨火裂地', 2),
        m('moster_2_22', '邪炎魔灵', 'fire', 0.2, 0.3, 28, 6900, 480, 2),
        m('moster_2_22', '邪炎魔灵', 'fire', 0.8, 0.3, 28, 6900, 480, 3),
      ],
    },
  ]),

  stg('6-2', 6, '第六章 · 黑暗神殿', 2, '神殿之巅对决', '背生恶魔双翼的黑暗神殿霸主降临！', 'img_rankbg_hdmj.jpg', 'changjingxiao_6.png', 'fire', 10, 1780, 95, 'boss_illidan', null, 'moster_3_4', '凝视背叛者的双刃——你们还没有准备好！', [
    {
      enemies: [
        m('moster_3_9', '伊利达雷女祭司', 'water', 0.3, 0.24, 40, 12500, 555, 3),
        m('moster_2_17', '暗影议会女爵', 'star', 0.7, 0.24, 40, 12500, 555, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.38, 24, 'shield')],
      enemies: [
        m('moster_3_16', '邪能泰坦巨像', 'gold', 0.5, 0.23, 46, 18500, 600, 3),
        m('moster_2_40', '噬魂魔仆', 'star', 0.22, 0.34, 28, 7200, 495, 2),
        m('moster_2_40', '噬魂魔仆', 'star', 0.78, 0.34, 28, 7200, 495, 3),
      ],
    },
    {
      bumpers: [bmp(0.22, 0.45, 22, 'chest'), bmp(0.78, 0.45, 22, 'chest')],
      enemies: [
        m('moster_3_4', '外域霸主 · 恶魔猎手', 'wood', 0.5, 0.22, 62, 85000, 1010, 3, true, '埃辛诺斯邪能斩', 3),
        m('moster_2_21', '恶魔猎手学徒', 'star', 0.2, 0.24, 29, 7500, 510, 2),
        m('moster_2_21', '恶魔猎手学徒', 'star', 0.8, 0.24, 29, 7500, 510, 3),
      ],
    },
  ]),

  stg('6-3', 6, '第六章 · 黑暗神殿', 3, '泰坦终焉熔炉', '最终试炼！粉碎失控的泰坦巨构毁灭者！', 'img_bg_boss.jpg', 'changjingxiao_6.png', 'star', 12, 2200, 160, 'boss_destroyer', null, 'moster_3_18', '终焉歼灭程序启动——弹珠勇者，接受最终审判！', [
    {
      bumpers: [bmp(0.25, 0.37, 23, 'shield'), bmp(0.75, 0.37, 23, 'shield')],
      enemies: [
        m('moster_3_16', '左翼泰坦卫士', 'gold', 0.28, 0.23, 40, 13800, 580, 3),
        m('moster_3_16', '右翼泰坦卫士', 'gold', 0.72, 0.23, 40, 13800, 580, 3),
      ],
    },
    {
      bumpers: [bmp(0.5, 0.4, 25, 'chest')],
      enemies: [
        m('moster_3_17', '熔核前锋督军', 'fire', 0.5, 0.22, 48, 22000, 640, 3),
        m('moster_3_5_b', '熔炉赤龙', 'fire', 0.2, 0.34, 30, 8200, 530, 2),
        m('moster_3_5_b', '熔炉赤龙', 'fire', 0.8, 0.34, 30, 8200, 530, 3),
      ],
    },
    {
      bumpers: [bmp(0.22, 0.46, 23, 'shield'), bmp(0.5, 0.49, 24, 'chest'), bmp(0.78, 0.46, 23, 'shield')],
      enemies: [
        m('moster_3_18', '终焉巨构 · 毁灭者', 'gold', 0.5, 0.22, 64, 96000, 1080, 3, true, '歼星主炮齐射', 3),
        m('moster_2_37', '泰坦发条卫兵', 'gold', 0.19, 0.28, 29, 8600, 540, 2),
        m('moster_2_37', '泰坦发条卫兵', 'gold', 0.81, 0.28, 29, 8600, 540, 3),
      ],
    },
  ]),
];

export const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.id, s]));
