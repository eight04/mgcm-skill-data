const SPECIALS = {
  "Magica2061 はなび": [
    null,
    null,
    bonusByTargetDebuff(0.15)
  ],
  "ギャルアーミー 丹": [
    null,
    ({targetDebuff}) => Object.keys(targetDebuff).length ? 1.5 : 1
  ],
  "ワイン娘 いろは": [
    null,
    null,
    ({targetBuff}) => targetBuff.imune.stun ? 1.5 : 1
  ],
  "サディスティックサキュバス マリアンヌ": [
    null,
    null,
    ({targetDebuff}) => targetDebuff.sleep ? 1.5 : 1
  ],
  "サディスティックサキュバス りり": [
    null,
    ({targetDebuff}) => targetDebuff.sleep ? 1.5 : 1
  ],
  "デモンズスタイルレウコシア 陽彩": [
    null,
    null,
    bonusByTargetDebuff(0.3)
  ],
  "マジカルスイムスーツ ここあ": [
    null,
    null,
    bonusByTargetDebuff(0.15)
  ],
  "†ハロウィッチ† いろは": [
    bonusByBuffNumber(0.2),
    bonusByBuffNumber(0.2)
  ],
  "フェニックス はなび": [
    bonusByTargetDebuff(0.2),
    bonusByTargetDebuff(0.2)
  ],
  "デモンズスタイルレウコシア ここあ": [
    bonusByBuffNumber(0.1),
    bonusByBuffNumber(0.1)
  ],
  "デモンズスタイルレウコシア 丹": {
    critRate: ({targetDebuff}) => Object.keys(targetDebuff).length ? 0 : 1
  }
};

function bonusByBuffNumber(bonus) {
  return ({buff}) => Object.keys(buff).length * bonus + 1;
}

function bonusByTargetDebuff(bonus) {
  return ({targetDebuff}) => Object.keys(targetDebuff).length * bonus + 1;
}
