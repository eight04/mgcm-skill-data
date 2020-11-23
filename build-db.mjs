import rawFetch from "make-fetch-happen";
import rwlock from "@eight04/read-write-lock";
import cheerio from "cheerio";
import YAML from "yaml";

const fetch = throttle(rawFetch);

const STATUS_TABLE = {
  "HP": "hp",
  "攻撃": "atk",
  "防御": "def",
  "速度": "spd",
  "的中": "fcs",
  "抵抗": "rst"
};

const base = "https://appmedia.jp/magicami/3788680";
const r = await fetch(base);
const text = await r.text();
const table = text.match(/<table id='dress_list[\s\S]+?<\/table/)[0];
const urls = [...findIter(table, /<a [^>]*href='(\d+)/g)]
  .map(id => new URL(id, base).toString());

const data = await Promise.all(urls.map(getDressInfo));
// console.log(JSON.stringify(data, null, 2));
console.log(YAML.stringify(data));

function *findIter(text, re) {
  let match;
  while ((match = re.exec(text))) {
    yield match[1];
  }
}

// function pickRandom(array, n) {
  // const result = [];
  // while (result.length < n) {
    // const i = Math.floor(Math.random() * array.length);
    // result.push(array[i]);
    // array[i] = array[array.length - 1];
    // array.pop();
  // }
  // return result;
// }

function throttle(cb) {
  const lock = rwlock.createLock({maxActiveReader: 5});
  return (...args) => lock.read(() => cb(...args));
}

async function getDressInfo(url) {
  const r = await fetch(url);
  const text = await r.text();
  const $ = cheerio.load(text);
  
  // debugger;
  
  const result = {
    id: Number(url.match(/\d+$/)),
    name: $(".dress_img_wrapper img").attr("alt").split("_").pop()
  };
  
  // info
  const info = $("#1 ~ table").eq(0).find("td");
  result.rarity = info.eq(0).text();
  result.pool = getPool(info.eq(-1).text());
  
  // status
  $("#2 + table tr").slice(1).each((i, row) => {
    const key = STATUS_TABLE[
      $(row)
        .children()
        .eq(0)
        .text()
      ];
      
    const value = $(row)
      .children()
      .slice(1)
      .map((i, el) => Number($(el).text().replace(/,/g, "")))
      .get();
      
    if (value.every(v => v === value[0])) {
      result[key] = value[0];
    } else {
      result[key] = value;
    }
  });
  
  // skill
  const skill = [];
  let el = $("#3").next();
  while (!el.is("h2")) {
    if (el.is("h3")) {
      skill.push({
        bonus: 0,
        // cd: [1, 1]
      });
      el = el.next();
      const cd = el.find("tr").eq(4);
      if (cd.children().length > 1) {
        skill[skill.length - 1].cd = [
          parseInt(cd.children().eq(1).text(), 10),
          parseInt(cd.children().eq(3).text(), 10)
        ];
      }
    } else if (el.is("h4")) {
      el = el.next();
      el.find("td").each((i, el) => {
        const match = $(el).text().match(/ダメージ量\+(\d+)%/);
        if (match) {
          skill[skill.length - 1].bonus += Number(match[1]);
        }
      });
    }
    el = el.next();
  }
  result.skill = skill;
  
  return result;
}

function getPool(text) {
  if (text.includes("イベント報酬")) {
    return "event";
  }
  if (text.includes("メインストーリー")) {
    return "story";
  }
  return "gacha";
}