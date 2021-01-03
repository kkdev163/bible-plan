const fs = require('fs');
const path = require('path');
const moment = require('moment');
const catalog = [
  ['创世记', '创', 50],
  ['出埃及记', '出', 40],
  ['利未记', '利', 27],
  ['民数记', '民', 36],
  ['申命记', '申', 34],
  ['约书亚记', '书', 24],
  ['士师记', '士', 21],
  ['路得记', '得', 4],
  ['撒母耳记上', '撒上', 31],
  ['撒母耳记下', '撒下', 24],
  ['列王记上', '王上', 22],
  ['列王记下', '王下', 25],
  ['历代志上', '代上', 29],
  ['历代志下', '代下', 36],
  ['以斯拉记', '拉', 10],
  ['尼希米记', '尼', 13],
  ['以斯贴记', '斯', 10],
  ['约伯记', '伯', 42],
  ['诗篇', '诗', 150],
  ['箴言', '箴', 31],
  ['传道书', '传', 12],
  ['雅歌', '歌', 8],
  ['以赛亚书', '赛', 66],
  ['耶利米书', '耶', 52],
  ['耶利米哀歌', '哀', 5],
  ['以西结书', '结', 48],
  ['但以理书', '但', 12],
  ['何西阿书', '何', 14],
  ['约珥书', '珥', 3],
  ['阿摩司书', '摩', 9],
  ['俄巴底亚书', '俄', 1],
  ['约拿书', '拿', 4],
  ['弥迦书', '弥', 7],
  ['那鸿书', '鸿', 3],
  ['哈巴谷书', '哈', 3],
  ['西番雅书', '番', 3],
  ['哈该书', '该', 2],
  ['撒迦利亚书', '亚', 14],
  ['玛拉基书', '玛', 4],
];

const startDay = '2021-01-04';
const days = 180;

function getTotalChapters() {
  return catalog.reduce((acc, it) => acc + it[2], 0);
}

function main() {
  const totalChapters = getTotalChapters();
  const chapterOneDay = Math.ceil(totalChapters / days);

  let result = new Array(days).fill(0).map((a, i) => ({ day: 'No.' + (i + 1), read: [] }));
  let volumeIndex = 0;
  let chapterIndexMap = {};

  for (let i = 0; i < days; i++) {
    let dayRemain = chapterOneDay;
    while (dayRemain > 0) {
      const volume = catalog[volumeIndex];
      if (!volume) { break; }
      const volumeName = volume[0];
      const chapters = volume[2];


      const chapterIndex = chapterIndexMap[volumeName] || 1;
      const read = Math.min(chapters - chapterIndex + 1, dayRemain);
      result[i].read.push({
        volumeName,
        from: chapterIndex,
        to: chapterIndex + read - 1
      })

      dayRemain = dayRemain - read;

      chapterIndexMap[volumeName] = chapterIndex + read;

      if (chapterIndexMap[volumeName] > chapters) {
        volumeIndex += 1
      }
    }
  }

  fs.writeFileSync(path.join(__dirname, './result.json'), JSON.stringify(result, null, 2))
}


main()