// 《弹珠勇者 · 弹夹撞击闯关录》全 54 位角色名册与七大流派羁绊（100% 映射 db.full.json 原版解包素材）

import { bulletRel, iconRel, roleHitRel, rolePortraitRel, uiRel } from '../assets.js';

export const ELEMENT_META = {
  fire: { name: '赤焰', short: '火', color: '#E04836', rimDark: '#7C1A10', glow: '#FF8A66', beats: 'wood' },
  water: { name: '寒霜', short: '冰', color: '#2B8FD4', rimDark: '#124670', glow: '#7BD4FF', beats: 'fire' },
  wood: { name: '森毒', short: '毒', color: '#2CA87B', rimDark: '#12543A', glow: '#78F0BE', beats: 'water' },
  gold: { name: '圣耀', short: '光', color: '#E5A624', rimDark: '#7A4B08', glow: '#FFE27A', beats: 'star' },
  star: { name: '暗影', short: '暗', color: '#8E52CC', rimDark: '#431C6E', glow: '#D5A6FF', beats: 'gold' },
};

export const RARITY_META = {
  SSR: {
    label: '传说',
    frameSprite: uiRel('Common', 'pinzhi_cai'),
    badgeBg: 'linear-gradient(180deg, #ffcf52 0%, #c86b14 100%)',
    cardBorder: '#f0af3c',
  },
  SR: {
    label: '史诗',
    frameSprite: uiRel('Common', 'pinzhi_cheng'),
    badgeBg: 'linear-gradient(180deg, #b573f7 0%, #6f33ad 100%)',
    cardBorder: '#a364de',
  },
  R: {
    label: '稀有',
    frameSprite: uiRel('Common', 'pinzhi_lan'),
    badgeBg: 'linear-gradient(180deg, #4cb4dc 0%, #246f91 100%)',
    cardBorder: '#4c9ec2',
  },
};

export const GENRE_BONDS = [
  { genre: '石头暴击流', minCount: 2, bondName: '碎岩致命', atkPct: 20, hpPct: 12, critBonusPct: 20, desc: '2名同流派上阵：全队攻击+20%，生命+12%，弱点暴击倍率额外+20%' },
  { genre: '冰毒减速流', minCount: 2, bondName: '极寒瘟疫', atkPct: 16, hpPct: 18, chillChance: 0.45, desc: '2名同流派上阵：全队攻击+16%，生命+18%，友情技有概率冻结推迟敌方行动' },
  { genre: '纯正吸血流', minCount: 2, bondName: '鲜血契约', atkPct: 15, hpPct: 24, lifestealPct: 4, desc: '2名同流派上阵：全队攻击+15%，生命+24%，触发友情技时额外吸取生命' },
  { genre: '反伤护甲流', minCount: 2, bondName: '荆棘铁壁', atkPct: 14, hpPct: 26, bumperBonusPct: 40, desc: '2名同流派上阵：全队攻击+14%，生命+26%，撞击木桩碰柱反击落雷+40%' },
  { genre: '斧头重伤流', minCount: 2, bondName: '狂斧破阵', atkPct: 24, hpPct: 10, desc: '2名同流派上阵：全队攻击+24%，生命+10%，首领破甲爆发大幅跃升' },
  { genre: '闪避大招流', minCount: 2, bondName: '疾影蓄能', atkPct: 18, hpPct: 15, cdReduce: 1, desc: '2名同流派上阵：全队攻击+18%，生命+15%，开局必杀充能额外-1回合' },
  { genre: '大招回血流', minCount: 2, bondName: '圣泉涌动', atkPct: 16, hpPct: 20, coinBonusPct: 25, desc: '2名同流派上阵：全队攻击+16%，生命+20%，通关金币额外+25%' },
];

export const COLLECTION_GROUPS = ['起源十勇者', '觉醒神装', '契约魔宠', '传奇坐骑', '降服魔王'];

const COMBO_DESC_TPL = {
  homing: (n) => `撞击队友连射5枚追踪【${n}】，精准锁定残血魔物`,
  cross_laser: (n) => `撞击队友绽放十字【${n}】冲击光束，纵横贯穿整条战线`,
  aura_blast: (n) => `撞击队友迸发【${n}】震荡环，重创周身敌群并治愈全队生命`,
  barrage: (n) => `撞击队友抛射6枚高爆【${n}】轰炸敌阵，溅射范围伤害`,
  chain_bolt: (n) => `撞击队友激发【${n}】闪电链，连续跳跃电击4名敌人`,
};

const STRIKE_DESC_TPL = {
  speed_storm: '本回合弹射初速与撞击威力翻倍，卡入墙壁与首领缝隙打出毁天灭地壁咚连撞！',
  meteor_judgement: '疾驰标记沿途触碰的所有魔物，停球瞬间召唤天罚陨雷轰击全体标记目标！',
  all_command: '【号令大招】吹响总攻号角，撞到的所有队友一同弹射起飞狂飙围殴！',
  weakness_pierce: '本回合强制贯通敌阵并发射巨型大招剑波，直击BOSS弱点暴击伤害飙升！',
  blessing_sanctuary: '冲锋同时回复全队32%最大生命，并在战场刷出烤鸡腿与战意补给！',
};

function u(id, key, isIcon, name, title, group, genre, rarity, element, moveType, baseAtk, baseHp, speed, comboName, comboType, bulletKey, strikeName, strikeType, dazhaoKey, strikeCd, quote) {
  return {
    id,
    name,
    title,
    group,
    genre,
    rarity,
    element,
    moveType,
    portrait: isIcon ? iconRel(key) : rolePortraitRel(key),
    hitPortrait: isIcon ? iconRel(key) : roleHitRel(key, true),
    hasHitDiff: !isIcon,
    baseAtk,
    baseHp,
    speed,
    comboName,
    comboType,
    comboBullet: bulletRel(bulletKey),
    comboDesc: COMBO_DESC_TPL[comboType](comboName),
    strikeName,
    strikeType,
    strikeProjectile: bulletRel(dazhaoKey),
    strikeCd,
    strikeDesc: STRIKE_DESC_TPL[strikeType],
    quote,
  };
}

export const HERO_ROSTER = [
  // 1. 起源十勇者 (10，100% 具备 _st 受击颜艺帧)
  u('shuangfeng', 'role_5', false, '双锋', '联盟剑卫', '起源十勇者', '大招回血流', 'R', 'gold', 'reflect', 268, 2220, 795, '圣光炉石', 'aura_blast', 'zidan_5', '联盟荣光斩', 'blessing_sanctuary', 'dazhao_1', 7, '为了联盟！握紧剑锋冲破防线！'),
  u('lieren', 'role_2', false, '猎人', '重炮狙神', '起源十勇者', '石头暴击流', 'SR', 'fire', 'pierce', 298, 1980, 845, '暴击巨石', 'homing', 'zidan_1', '穿甲狙击弹幕', 'weakness_pierce', 'dazhao_2', 7, '枪械才是未来，朋友！'),
  u('shuangling', 'role_3', false, '霜灵', '极寒法导师', '起源十勇者', '冰毒减速流', 'SR', 'water', 'pierce', 290, 2040, 820, '极寒冰锥', 'barrage', 'zidan_6', '极寒暴风雪', 'meteor_judgement', 'dazhao_3', 8, '极寒领域！万物皆凝为冰晶！'),
  u('longkai', 'role_4_b', false, '龙铠', '龙血战将', '起源十勇者', '斧头重伤流', 'SR', 'fire', 'reflect', 304, 2260, 805, '裂地重斧', 'cross_laser', 'zidan_3', '巨龙觉醒号令', 'all_command', 'dazhao_4', 8, '巨龙苏醒了！随我踏平深渊！'),
  u('daodun', 'role_6', false, '刀盾', '不屈重装', '起源十勇者', '反伤护甲流', 'SR', 'gold', 'reflect', 276, 2540, 770, '强健铁盾', 'aura_blast', 'zidan_2', '铜墙铁壁壁咚', 'speed_storm', 'dazhao_5', 7, '我的刀盾，绝不后退半步！'),
  u('panda', 'role_7', false, '潘达', '醉拳武僧', '起源十勇者', '闪避大招流', 'SR', 'wood', 'reflect', 292, 2320, 840, '秘酿魔瓶', 'barrage', 'zidan_7', '万钧醉仙连打', 'speed_storm', 'dazhao_6', 7, '酒葫芦还没见底，战斗才刚开始！'),
  u('yingshoumo', 'role_8', false, '影狩魔', '邪能猎魔人', '起源十勇者', '纯正吸血流', 'SSR', 'star', 'pierce', 332, 2180, 880, '嗜血蝙蝠', 'chain_bolt', 'zidan_4', '恶魔变身·天罚', 'meteor_judgement', 'dazhao_7', 8, '你们这是自寻死路！'),
  u('yanti', 'role_1', false, '岩蹄', '先祖萨满', '起源十勇者', '反伤护甲流', 'R', 'wood', 'reflect', 270, 2440, 765, '狂暴血石', 'chain_bolt', 'zidan_9', '大地先祖庇护', 'blessing_sanctuary', 'dazhao_9', 7, '愿先祖指引你的弹射轨迹！'),
  u('shuangzhao', 'role_9', false, '霜爪', '凛冬熊德', '起源十勇者', '冰毒减速流', 'SR', 'water', 'reflect', 296, 2400, 800, '剧毒荆棘', 'homing', 'zidan_8', '群兽奔腾号令', 'all_command', 'dazhao_10', 8, '凛冬利爪，撕碎一切阻碍！'),
  u('lieren_blade', 'role_10', false, '猎刃', '暗影刺客', '起源十勇者', '闪避大招流', 'SR', 'star', 'pierce', 314, 1960, 890, '暗影飞刀', 'homing', 'zidanshu_11', '瞬狱影杀闪', 'weakness_pierce', 'dazhao_21', 7, '阴影之中，一击必杀！'),

  // 2. 觉醒神装 (17，100% 具备 _st 受击颜艺帧)
  u('skin_1', 'skin_1', false, '狂暴·双锋', '血怒剑圣', '觉醒神装', '斧头重伤流', 'SR', 'fire', 'reflect', 312, 2240, 835, '旋风重斧', 'cross_laser', 'zidan_3', '血怒狂飙斩', 'speed_storm', 'dazhao_1', 7, '双刃染焰，战意沸腾！'),
  u('skin_2', 'skin_2', false, '专注·猎人', '鹰眼游侠', '觉醒神装', '石头暴击流', 'SR', 'gold', 'pierce', 320, 2060, 860, '黄金碎石', 'homing', 'zidan_1', '贯星狙魔炮', 'weakness_pierce', 'dazhao_2', 7, '呼吸放缓，弱点已在准星中央！'),
  u('skin_3', 'skin_3', false, '虔诚·霜灵', '圣洁大祭司', '觉醒神装', '大招回血流', 'SR', 'water', 'pierce', 300, 2340, 825, '圣泉炉石', 'aura_blast', 'zidan_5', '圣洁礼赞领域', 'blessing_sanctuary', 'dazhao_3', 7, '圣光与寒霜，皆为守护而鸣。'),
  u('skin_4', 'skin_4', false, '信仰·龙铠', '圣殿龙骑', '觉醒神装', '反伤护甲流', 'SR', 'gold', 'reflect', 314, 2500, 815, '圣龙炎弹', 'cross_laser', 'zidanshu_12', '圣殿骑士总冲锋', 'all_command', 'dazhao_4', 8, '信仰不灭，龙枪所指皆为坦途！'),
  u('skin_5', 'skin_5', false, '我的·刀盾', '黄金守望者', '觉醒神装', '反伤护甲流', 'SR', 'gold', 'reflect', 298, 2680, 785, '金盾重击', 'aura_blast', 'zidan_2', '金城汤池狂撞', 'speed_storm', 'dazhao_5', 7, '站在我的金盾后面，安心输出吧！'),
  u('skin_6', 'skin_6', false, '掠影·潘达', '影宗掌门', '觉醒神装', '闪避大招流', 'SR', 'star', 'pierce', 322, 2260, 870, '影宗酒镖', 'barrage', 'zidanshu_11', '无影七连闪', 'weakness_pierce', 'dazhao_6', 7, '竹影摇曳处，胜负已分！'),
  u('skin_7', 'skin_7', false, '邪能·影狩魔', '深渊魔裔', '觉醒神装', '纯正吸血流', 'SSR', 'wood', 'pierce', 345, 2300, 885, '邪能血蝠', 'chain_bolt', 'zidan_4', '邪能陨火审讯', 'meteor_judgement', 'dazhao_7', 8, '感受被囚禁一万年的邪能怒火！'),
  u('skin_8', 'skin_8', false, '生机·岩蹄', '自然大德鲁伊', '觉醒神装', '大招回血流', 'SR', 'wood', 'reflect', 294, 2580, 790, '复苏美食', 'aura_blast', 'zidan_10', '丰饶图腾圣域', 'blessing_sanctuary', 'dazhao_9', 7, '大地母亲正赐予我们无穷生机！'),
  u('skin_9', 'skin_9', false, '大地·霜爪', '山岭巨熊', '觉醒神装', '石头暴击流', 'SR', 'gold', 'reflect', 318, 2500, 810, '山崩巨石', 'barrage', 'zidan_1', '山崩地裂暴走', 'speed_storm', 'dazhao_10', 7, '群山震怒之时，无人能挡！'),
  u('skin_10', 'skin_10', false, '突袭·猎刃', '绯红影卫', '觉醒神装', '斧头重伤流', 'SR', 'fire', 'pierce', 328, 2080, 895, '绯红血石', 'homing', 'zidan_9', '赤影破军闪', 'weakness_pierce', 'dazhao_21', 7, '绯红一闪，猎物已倒！'),
  u('skin_11', 'skin_11', false, '勇士·猎人', '屠龙炮手', '觉醒神装', '石头暴击流', 'SSR', 'fire', 'reflect', 348, 2280, 855, '烈焰龙蛋', 'barrage', 'zidanshu_12', '屠龙齐射总号令', 'all_command', 'dazhao_2', 8, '装填龙息重炮——全员开火！'),
  u('skin_12', 'skin_12', false, '女巫·霜灵', '星辉秘药师', '觉醒神装', '冰毒减速流', 'SSR', 'star', 'pierce', 350, 2240, 865, '女巫毒剂', 'barrage', 'zidan_8', '午夜星陨坩埚', 'meteor_judgement', 'dazhao_3', 8, '尝尝刚熬好的午夜秘药吧！'),
  u('skin_13', 'skin_13', false, '荆棘·刀盾', '神话反甲王', '觉醒神装', '反伤护甲流', 'SSR', 'wood', 'reflect', 336, 2840, 810, '剧毒荆棘', 'cross_laser', 'zidan_8', '不朽荆棘壁咚', 'speed_storm', 'dazhao_5', 7, '打我越痛，你的死期越近！'),
  u('skin_14', 'skin_14', false, '极限·潘达', '竹仙武神', '觉醒神装', '闪避大招流', 'SSR', 'gold', 'reflect', 354, 2440, 888, '金刚拳罡', 'cross_laser', 'zidan_2', '极意百烈号令', 'all_command', 'dazhao_6', 8, '突破极限——万拳归宗！'),
  u('skin_15', 'skin_15', false, '混乱·影狩魔', '混沌魔神', '觉醒神装', '纯正吸血流', 'SSR', 'fire', 'pierce', 364, 2360, 902, '混沌血蝠', 'homing', 'zidan_4', '混沌灭世贯虹', 'weakness_pierce', 'dazhao_7', 8, '混沌降临，万物臣服！'),
  u('skin_16', 'skin_16', false, '不屈·霜爪', '极北兽皇', '觉醒神装', '冰毒减速流', 'SSR', 'water', 'reflect', 346, 2660, 840, '极北冰块', 'chain_bolt', 'zidan_6', '极北永冻风暴', 'speed_storm', 'dazhao_10', 7, '只要冰雪尚存，兽皇永不倒下！'),
  u('skin_17', 'skin_17', false, '诅咒·猎刃', '冥渊死神', '觉醒神装', '纯正吸血流', 'SSR', 'star', 'pierce', 360, 2200, 912, '死神咒刃', 'chain_bolt', 'zidanshu_11', '冥渊死印天罚', 'meteor_judgement', 'dazhao_21', 8, '听见死神倒计时的钟声了吗？'),

  // 3. 契约魔宠 (9，映射 petDB 全部 9 只原生魔宠)
  u('pet_void_dragon', 'pet_icon_25', true, '铁甲虚空龙', '神话契约龙宠', '契约魔宠', '石头暴击流', 'SSR', 'star', 'pierce', 356, 2460, 882, '虚空龙息', 'cross_laser', 'zidanshu_12', '次元崩裂龙煌', 'weakness_pierce', 'dazhao_4', 8, '铁甲覆虚空，龙吟碎星辰！'),
  u('pet_ragnaros', 'pet_icon_19', true, '炎魔拉格', '熔火元素领主', '契约魔宠', '斧头重伤流', 'SSR', 'fire', 'reflect', 352, 2400, 835, '熔火龙蛋', 'barrage', 'zidanshu_12', '让火焰净化一切', 'meteor_judgement', 'dazhao_1', 8, '虫子们，让火焰净化一切！'),
  u('pet_cerberus', 'pet_icon_20', true, '地狱三头犬', '冥界看门兽', '契约魔宠', '纯正吸血流', 'SSR', 'fire', 'reflect', 340, 2480, 862, '三首血蝠', 'homing', 'zidan_4', '冥狱狂犬暴走', 'speed_storm', 'dazhao_7', 7, '冥狱大门之前，猎物插翅难飞！'),
  u('pet_phoenix', 'pet_icon_23', true, '炽焰不死鸟', '涅槃圣灵', '契约魔宠', '大招回血流', 'SR', 'fire', 'pierce', 308, 2340, 872, '涅槃炉石', 'aura_blast', 'zidan_5', '浴火重生圣歌', 'blessing_sanctuary', 'dazhao_1', 7, '灰烬之中，圣火永生！'),
  u('pet_orthrus', 'pet_icon_22', true, '地狱双头犬', '双生恶犬', '契约魔宠', '斧头重伤流', 'SR', 'star', 'reflect', 302, 2220, 842, '双生飞斧', 'homing', 'zidan_3', '恶犬扑杀风暴', 'speed_storm', 'dazhao_5', 7, '两颗脑袋，双倍凶猛！'),
  u('pet_shadowfiend', 'pet_icon_21', true, '噬魂影魔', '深渊魂匣', '契约魔宠', '纯正吸血流', 'SR', 'star', 'pierce', 314, 2060, 858, '噬魂蝙蝠', 'chain_bolt', 'zidan_4', '万魂齐爆天罚', 'meteor_judgement', 'dazhao_7', 8, '你的灵魂，归入我的收藏！'),
  u('pet_hellhound', 'pet_icon_24', true, '熔岩地狱犬', '火渊猎犬', '契约魔宠', '石头暴击流', 'R', 'fire', 'reflect', 274, 2120, 828, '滚烫火石', 'homing', 'zidan_1', '火渊疾驰', 'speed_storm', 'dazhao_2', 6, '汪呜——嗅到宝箱与魔物的味道了！'),
  u('pet_mech', 'pet_icon_17', true, '飓风机甲', '发条重炮宠', '契约魔宠', '反伤护甲流', 'R', 'gold', 'reflect', 278, 2360, 788, '发条高爆瓶', 'barrage', 'zidan_7', '超载电磁穿刺', 'weakness_pierce', 'dazhao_2', 7, '齿轮满转，火力全开！'),
  u('pet_void_elem', 'pet_icon_10', true, '虚空元素', '奥术灵体', '契约魔宠', '冰毒减速流', 'R', 'water', 'pierce', 270, 2240, 808, '奥术寒冰', 'chain_bolt', 'zidan_6', '虚空虹吸护盾', 'blessing_sanctuary', 'dazhao_3', 7, '来自扭曲虚空的低语……'),

  // 4. 传奇坐骑 (9，映射 rideDB 全部 9 骑原生坐骑)
  u('ride_ashes', 'ride_skin_6200', true, '奥的灰烬', '神塔至高凤凰', '传奇坐骑', '闪避大招流', 'SSR', 'gold', 'pierce', 368, 2500, 920, '日冕龙炎', 'cross_laser', 'zidanshu_12', '凤凰神速总动员', 'all_command', 'dazhao_1', 8, '勇者之塔之巅的光辉，照亮整片大陆！'),
  u('ride_deathcharger', 'ride_skin_6100', true, '亡灵战马', '斯坦索姆梦魇', '传奇坐骑', '纯正吸血流', 'SSR', 'star', 'reflect', 348, 2580, 892, '梦魇血石', 'chain_bolt', 'zidan_9', '死亡冲锋践踏', 'speed_storm', 'dazhao_7', 7, '冥火铁蹄踏过之处，寸草不生！'),
  u('ride_dragonhawk', 'ride_skin_5300', true, '冰蓝龙鹰', '极光掠空骑', '传奇坐骑', '冰毒减速流', 'SR', 'water', 'pierce', 316, 2200, 882, '极光冰羽', 'homing', 'zidan_6', '冰天掠影穿刺', 'weakness_pierce', 'dazhao_3', 7, '乘极光之翼，穿梭寒霜风暴！'),
  u('ride_protodrake', 'ride_skin_5200', true, '始祖幼龙', '远古龙裔骑', '传奇坐骑', '斧头重伤流', 'SR', 'fire', 'reflect', 322, 2380, 848, '远古龙蛋', 'barrage', 'zidanshu_12', '远古龙群号令', 'all_command', 'dazhao_4', 8, '远古洪荒之力，于龙翼间苏醒！'),
  u('ride_gryphon', 'ride_skin_5100', true, '皇家狮鹫', '暴风空骑', '传奇坐骑', '石头暴击流', 'SR', 'gold', 'pierce', 310, 2280, 868, '狮鹫碎石', 'cross_laser', 'zidan_1', '苍穹俯冲审判', 'meteor_judgement', 'dazhao_1', 8, '飞跃云巅，直捣魔王巢穴！'),
  u('ride_kodo', 'ride_skin_4200', true, '雷霆科多兽', '重装战鼓骑', '传奇坐骑', '反伤护甲流', 'SR', 'wood', 'reflect', 296, 2640, 778, '科多战鼓', 'aura_blast', 'zidan_2', '重装战鼓冲撞', 'blessing_sanctuary', 'dazhao_9', 7, '隆隆战鼓响彻荒原！'),
  u('ride_bear', 'ride_skin_4100', true, '丘陵魁熊', '重爪战熊', '传奇坐骑', '反伤护甲流', 'R', 'wood', 'reflect', 280, 2500, 782, '巨熊烤肉震', 'aura_blast', 'zidan_10', '蛮熊横冲直撞', 'speed_storm', 'dazhao_10', 6, '厚实熊背，最可靠的移动堡垒！'),
  u('ride_chocobo', 'ride_skin_3200', true, '疾风陆行鸟', '金色快羽骑', '传奇坐骑', '闪避大招流', 'R', 'gold', 'pierce', 272, 2160, 886, '快羽飞石', 'homing', 'zidan_1', '金色疾风闪', 'speed_storm', 'dazhao_6', 6, '啾——全速冲刺，谁也追不上！'),
  u('ride_raptor', 'ride_skin_3100', true, '荒野迅猛龙', '丛林猎骑', '传奇坐骑', '斧头重伤流', 'R', 'fire', 'reflect', 284, 2100, 856, '利爪飞斧', 'homing', 'zidan_3', '丛林猎杀突刺', 'weakness_pierce', 'dazhao_5', 6, '速度与利齿，丛林的绝对法则！'),

  // 5. 降服魔王 (9，映射 moster_3_* 传世首领 + 100% _st 颜艺帧)
  u('boss_kelthuzad', 'moster_3_1', false, '克尔苏加德', '浮空城大巫妖', '降服魔王', '冰毒减速流', 'SSR', 'water', 'pierce', 366, 2400, 862, '凋零寒冰', 'chain_bolt', 'zidan_6', '纳克萨玛斯天灾', 'meteor_judgement', 'dazhao_3', 8, '黑暗与严寒的仆从们，听候我的召唤！'),
  u('boss_rivendare', 'moster_3_11', false, '瑞文戴尔', '天灾死亡领主', '降服魔王', '纯正吸血流', 'SSR', 'star', 'reflect', 356, 2600, 872, '邪恶符文剑', 'cross_laser', 'zidan_9', '天灾军团总号令', 'all_command', 'dazhao_7', 8, '在铁蹄与符文剑下颤抖吧！'),
  u('boss_illidan', 'moster_3_4', false, '恶魔猎手', '黑暗神殿霸主', '降服魔王', '闪避大招流', 'SSR', 'wood', 'pierce', 368, 2340, 906, '埃辛诺斯蝠刃', 'cross_laser', 'zidan_4', '万载囚笼破障斩', 'weakness_pierce', 'dazhao_21', 8, '你们还没有准备好！'),
  u('boss_alakir', 'moster_3_7', false, '奥拉基尔', '四风天空领主', '降服魔王', '闪避大招流', 'SSR', 'gold', 'pierce', 352, 2380, 916, '九天狂风瓶', 'chain_bolt', 'zidan_7', '四风神座雷暴', 'meteor_judgement', 'dazhao_1', 8, '狂风！听从我的号令！'),
  u('boss_pitlord', 'moster_3_17', false, '深渊火魔', '地狱火督军', '降服魔王', '斧头重伤流', 'SSR', 'fire', 'reflect', 362, 2700, 822, '深渊火雨', 'barrage', 'zidanshu_12', '深渊重戟狂撞', 'speed_storm', 'dazhao_4', 7, '在深渊烈焰中化为焦土吧！'),
  u('boss_destroyer', 'moster_3_18', false, '毁灭者', '泰坦熔炉巨构', '降服魔王', '石头暴击流', 'SSR', 'gold', 'reflect', 358, 2760, 818, '泰坦碎星石', 'barrage', 'zidan_1', '毁灭协议·全军突击', 'all_command', 'dazhao_2', 8, '毁灭指令已确认——目标彻底抹除！'),
  u('boss_icedragon', 'moster_3_15', false, '冰魔龙', '冰冠霜翼龙后', '降服魔王', '冰毒减速流', 'SR', 'water', 'pierce', 326, 2460, 848, '霜翼龙息', 'aura_blast', 'zidan_6', '绝对零度吐息', 'blessing_sanctuary', 'dazhao_3', 7, '刺骨寒风将冻结你们的血脉！'),
  u('boss_firedragon', 'moster_3_5', false, '红莲火龙', '黑曜熔巢古龙', '降服魔王', '石头暴击流', 'SR', 'fire', 'reflect', 332, 2440, 842, '红莲龙蛋', 'homing', 'zidanshu_12', '红莲爆炎壁咚', 'speed_storm', 'dazhao_4', 7, '凡人，休想染指巨龙的宝藏！'),
  u('boss_nagapriest', 'moster_3_9', false, '娜迦女祭司', '深海潮汐女王', '降服魔王', '大招回血流', 'SR', 'water', 'pierce', 320, 2400, 852, '深海魔瓶链', 'chain_bolt', 'zidan_7', '海渊潮汐圣眷', 'blessing_sanctuary', 'dazhao_3', 7, '深海怒涛，终将吞没陆地！'),
];

export const HERO_MAP = Object.fromEntries(HERO_ROSTER.map((h) => [h.id, h]));
