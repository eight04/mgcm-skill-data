MGCM (Magicami) Skill Data
==========================

這個 Repo 記錄 MGCM 各服裝攻擊技能的倍率。歡迎開 PR/Issue 補充。如果是玩 EN/國際服的話，可以加入 Reddit 板友籌備的技能備率測試計劃︰
https://www.reddit.com/r/magicami/comments/ju4yj7/research_help_collect_skill_mod_data_for_dresses/

技能倍率表︰

* [r/magicami 製作的倍率表](https://docs.google.com/spreadsheets/d/1N80A2Uz0lQe8COz3e_xWOePh0_RIMq0hYxkgsMv0CWI/edit#gid=1428786078)
* 也可以參考 data 資料夾底下的 yml 檔。格式為︰
  ```
  skill_modifier +status*ratio *hits
  ```
  其中 `+status*ratio` 不一定存在；`*hits` 為 1 時可能被省略。

傷害公式
--------

```
基本傷害 = 攻擊力 * 攻擊力buff * 技能倍率
  + 額外攻擊力轉換率 * 能力值

傷害 = 基本傷害
  * 升技Bonus
  * 被動技能倍率
  * 是否暴擊 (1.5)
  * 是否強打 (1.3)
  * 是否失誤 (0.7)
  * 750 / (防禦力 * 防禦率buff + 750)
  * 傷害浮動
```

* 攻擊力buff - buff時為 1.5 倍，debuff為 0.5 倍，兩者皆有時為 1 倍。
* 技能倍率 - 請參考技能倍率表。
* 額外攻擊力轉換率 - 有些技能會根據其它的能力值增加傷害，例如「鬼魔愚零卍神特攻服 花織」。同樣可以參考技能倍率表。
* 能力值 - 能力值是會被 buff 影響的。
* 升技Bonus - 有些技能升級後會增加傷害，10% 就 x1.1，10% + 5% 就 x1.15。
* 被動技能 - 有些被動技能會增加傷害，例︰惡魔彩花爆擊時傷害 1.5 倍。
* 防御率buff - buff為 1.7 倍；debuff為 0.3 倍；若技能有無視防禦的效果，則直接乘 0。（這裡指的是敵方身上的防御率buff而非我方身上的）
* 傷害浮動 - 隨機乘上 0.98, 0.99, 1, 1.01 其中一個值。[#2](https://github.com/eight04/mgcm-skill-data/issues/2)

額外攻擊力 - 比例型 vs. 依存型
------------------------------

MGCM 有兩類額外增傷，

### 比例型

比例型增傷的技能，會以特定的轉換率，將某個能力值加進傷害中，**額外傷害不受攻擊力 buff 影響**。

例︰[鬼魔愚零卍神特攻服 花織](https://appmedia.jp/magicami/4073230) 的一技

### 依存型

依存型增傷的技能，除了會以特定的轉換率增傷以外，會**完全無視衣服本身的攻擊力**，換句話說攻擊力 buff 對這類技能完全無效。這類技能的技能倍率統一設定為 0。

例︰[鬼魔愚零卍神特攻服 花織](https://appmedia.jp/magicami/4073230) 的二、三技

目前為止（2020/11/23）的中文版本，所有的額外增傷技能都被翻譯成「自身XX越高，此攻擊威力越大」。若要區分，建議查詢官方 wiki 或使用英文版。

傷害浮動
--------

由於最終傷害並不是單一數值，測試時需要測出四種傷害再找出第二高的值，或是測出最低和最高的傷害再計算︰`第二高傷害 = (最高傷 + 最低傷) / (1.01 + 0.98)`

> **Note:** 避免以失誤/降攻狀態時的傷害去推算原始傷害，以免小數誤差被放大

測出敵人防禦力
--------------

利用降防或無視防禦的技能，可以得出敵人的防禦力。公式為

```
敵防禦 = 750 * (降防後傷害 - 降防前傷害) / (降防前傷害 - K * 降防後傷害)
```

降防的情況下 K 為 0.3，無視防禦的情況下 K 為 0。

以下為說明︰設攻擊為 A，防禦為 B，降防後的防禦為 K*B，降防前的傷害為 D1，降防後的傷害為 D2，則

```
D1 = A * 750 / (B + 750)
D2 = A * 750 / (K*B + 750)

=> D1 / D2 = (K*B + 750) / (B + 750)

=> B = 750 * (D2 - D1) / (D1 - D2 * K)
```

測出技能倍率
------------

在沒有額外增傷的情況下，知道敵人的防禦後就能很容易的用攻擊力算出技能倍率︰

```
技能倍率 = 傷害 / (750 / (防禦力 + 750)) / 攻擊力
```

或是用其它技能的傷害比率來算︰

```
B技能倍率 = A技能倍率 * B技能傷害 / A技能傷害
```

測出額外攻擊轉換率-比例型增傷
-----------------------------

利用攻擊buff，可以求出額外攻擊轉換率和技能倍率︰

```
技能倍率 = -(防禦 + 750) * (加攻前傷害 - 加攻後傷害) / 375 / 攻擊力
轉換率 = (防禦力 + 750) * (3 * 加攻前傷害 - 2 * 加攻後傷害) / 750 / 能力值
```

以下說明︰設攻擊為 A，防禦為 B，加攻前傷害為 D1，加攻後傷害為 D2，能力值為 E，轉換率為 R，技能倍率為 S。則︰

```
D1 = (A * S + E * R) * 750 / (B + 750)
D2 = (1.5A * S + E * R) * 750 / (B + 750)

解對 R, S 的二元一次方程組

=>

R = (B + 750) (3 D1 - 2 D2) / 750 / E
S = - (B + 750) (D1 - D2) / 375 / A
```

測出額外攻擊轉換率-依存型增傷
-----------------------------

由於依存型增傷技能的倍率為 0，很容易就可以求出︰

```
轉換率 = 傷害 / (750 / (防禦力 + 750)) / 能力值
```

和 [ヒムラン](https://twitter.com/Br51XxvpgRwyDjk) 之間的差異
-------------------------------------------------------------

* 所乘上的常數不同。ヒムラン的技能威力 * 1.75 / 750 = 這裡的技能倍率。
* ヒムラン使用浮動傷害中的最低傷害來計算技能威力，所以ヒムラン的技能倍率 / 0.985 = 這裡的技能倍率。

Todos
-----

* 有些資料小數點精度太低，需要重測。
* 有些技能倍率是會改變的，例︰2019莉莉的2技。測出HP比例對倍率的公式？
* シブハロナイトコス 系列會根據敵人HP增傷，可能要去競技場測。
* ウェスタンカウガール はなび 的三技。
* 測試時常常有些微妙的誤差。例如︰原本傷害1613，失誤時變1130。顯示的數字是無條件進位的嗎？
* 傷害是從敵人的HP計算的？小數進位誤差？第一次暴擊 3115，第二次暴擊 3114。
* 傷害計算機。由技能倍率乘上各服裝於各LV的攻擊力來算出該技能的傷害。
* 傷害Ranking？加上CD來算出服裝每回合能造成的傷害。分單體/多體？

Trivia
------

* 在敵方有降防的情況下使用多段數技能，若敵人被第一擊打死，則後續的傷害吃不到降防效果。

Reference
----------

* [ヒムラン](https://twitter.com/Br51XxvpgRwyDjk)

  - 傷害公式: https://twitter.com/Br51XxvpgRwyDjk/status/1183932508922171393
  - 技能Bonus: https://twitter.com/Br51XxvpgRwyDjk/status/1185455902377181184

* [計算用試算表](https://docs.google.com/spreadsheets/d/14Hp_SpN5iVYI3hPgo01_UWr8geUb5Ymx7ME2KLLKkZ8/edit?usp=sharing)

* [Skill Multiplier Research Results & Strongest Dresses in MGCM](https://www.reddit.com/r/magicami/comments/jxerjq/skill_multiplier_research_results_strongest/)
