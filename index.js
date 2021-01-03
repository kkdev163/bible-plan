//////////// 输入参数区
const startDay = '2021-01-04';   // 开始读经日期
const days = 180; // 计划多少天读完
const members = ['坤坤', '康慧'];  // 小组成员
//////////// 输入参数区


const fs = require('fs');
const path = require('path');
var xlsx = require('node-xlsx').default;
const moment = require('moment');

moment.locale('zh-cn', {
  week: {
    dow: 1,
    doy: 4
  }
})

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

function getTotalChapters() {
  return catalog.reduce((acc, it) => acc + it[2], 0);
}

// 每天固定章节算法
function fixedReadCount() {
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

// 按卷分组
function groupByVolumn() {
  const totalChapters = getTotalChapters();
  const chapterOneDay = Math.ceil(totalChapters / days);
  console.log('计划 ' + days + ' 天读完一遍旧约');
  console.log('每天需要读 ' + chapterOneDay + ' 章左右');
  const results = new Array(days * 1.5).fill(0).map((a, i) => ({ day: 'No.' + (i + 1), read: [] }));
  let dayIndex = 0;

  let mergedCount = 0;
  for (let i = 0; i < catalog.length; i++) {
    const volume = catalog[i];
    const volumeName = volume[1];
    const chapters = volume[2];

    const daysComplete = (chapters + mergedCount) / chapterOneDay;

    if (daysComplete <= 0.5) {
      // 这卷数太少了，就并入下一卷书一起读吧
      results[dayIndex].read.push({
        volumeName,
        from: 1,
        to: chapters
      })
      mergedCount += chapters;
    } else if (daysComplete < 1.2) {
      // 凑活一天读完吧
      results[dayIndex].read.push({
        volumeName,
        from: 1,
        to: chapters
      })
      dayIndex++;
      mergedCount = 0;
    } else { // 平均分成多天读吧
      // 几天读完
      let volumeDays = Math.ceil(daysComplete);
      // 每天读几章
      const basicInDay = Math.floor(chapters / volumeDays);
      // 有多少天需要多读一章
      let remains = chapters - volumeDays * basicInDay;

      let volumneIndex = 1;
      while (volumneIndex <= chapters) {
        const from = volumneIndex;
        const readCount = basicInDay + (remains > 0 ? 1 : 0);
        const to = from + readCount - 1 - mergedCount;
        mergedCount = 0;

        results[dayIndex].read.push({
          volumeName,
          from: volumneIndex,
          to
        })
        dayIndex++;
        remains--;
        volumneIndex = to + 1
      }
    }
  }

  const filtered = results
    .map(d => {
      return {
        ...d,
        total: d.read.reduce((acc, it) => acc + it.to - it.from + 1, 0)
      }
    }).filter(d => d.total > 0);
  console.log('按卷分组后，实际需要', filtered.length + ' 天可读完')
  return filtered;
}

function main() {
  const bibleDaily = groupByVolumn();
  let bibleIndex = 0;
  const sheetRows = [];
  let startOfWeek = moment(startDay);
  sheetRows.push([null, '周一', '周二', '周三', '周四', '周五', '周六', '周日'])

  while (bibleIndex < bibleDaily.length) {
    const bibleRow = [];
    let weekDay = moment(startOfWeek).weekday()
    const endOfWeek = moment(startOfWeek).endOf('week');
    const daysRange = moment(startOfWeek).format('MM.DD') + '-' + moment(endOfWeek).format('MM.DD');

    bibleRow.push(daysRange);
    while (weekDay-- > 0) {
      bibleRow.push(null);
    }
    while (startOfWeek <= endOfWeek) {
      bibleRow.push(formatRead(bibleDaily[bibleIndex++]))
      startOfWeek = moment(startOfWeek).add(1, 'day');
    }
    sheetRows.push(bibleRow);
    members.forEach(m => {
      sheetRows.push([m])
    })
  }

  const wpx = 100
  const options = { '!cols': [{ wpx }, { wpx }, { wpx }, { wpx }, { wpx }, { wpx }, { wpx }, { wpx }] };
  var buffer = xlsx.build([{ name: "biblePlan", data: sheetRows }], options);
  fs.writeFileSync(path.join(__dirname, 'biblePlan.xlsx'), buffer);
}

function formatRead(bible) {
  if (bible) {
    return bible.read.map(it => it.volumeName + it.from + '-' + it.to).join('、')
  } else {
    return null
  }
}
main();