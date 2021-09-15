export const NAME_JP2EN = {
  "丹": "aka",
  "陽彩": "akisa",
  "蒼": "ao",
  "エリザ": "eliza",
  "はなび": "hanabi",
  "依子": "iko",
  "いろは": "iroha",
  "花織": "kaori",
  "ここあ": "kokoa",
  "りり": "lilly",
  "マリアンヌ": "marianne",
  "セイラ": "seira"
};

export const NAME_EN2JP = Object.fromEntries(Object.entries(NAME_JP2EN).map(([a, b]) => [b, a]));

export const NAMES = Object.values(NAME_JP2EN);

export const NAME_FULL2EN = {
  "中野一花": "aka"
};
