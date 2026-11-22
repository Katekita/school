// Simple parser for Gemini-sourced schedule tables
const fs = require('fs');

const rawText = fs.readFileSync('jina.txt', 'utf8');

// Subject mapping
const subjectAliases = {
  'Матем': 'algebra',
  'Математика': 'algebra',
  'Алгебра': 'algebra',
  'Геометрия': 'geometry',
  'О тили жана окуу': 'russian',
  'Орус тили': 'russian',
  'Орус. тили': 'russian',
  'К тили жана окуу': 'kyrgyz',
  'Кыргыз тили': 'kyrgyz',
  'Кырг. тили': 'kyrgyz',
  'Орус адаб': 'russianLit',
  'Орусская литература': 'russianLit',
  'Кырг. адаб': 'kyrgyzLit',
  'Кыргызская литература': 'kyrgyzLit',
  'Кырг.адаб': 'kyrgyzLit',
  'Кырг. адаб.': 'kyrgyzLit',
  'Дене тарбия': 'pe',
  'Физика': 'physics',
  'Химия': 'chemistry',
  'Биология': 'biology',
  'География': 'geography',
  'Тарых': 'history',
  'Информат': 'informatics',
  'Информатика': 'informatics',
  'Информат.': 'informatics',
  'Музыка': 'music',
  'Көркөм өнөр': 'art',
  'Технология': 'technology',
  'Чет тили': 'foreign',
  'Адам жана к': 'social',
  'Ад. ж. коом': 'social',
  'Дин. өнүгүү': 'religious',
  'Дин. өн. т': 'religious',
  'Дин. өн. тар': 'religious',
  'АЧД': 'achd',
  'Кл. саат': 'classHour',
  'Кл.саат': 'classHour',
  'О тили': 'russian',
  'К тили': 'kyrgyz',
  'К-тили': 'kyrgyz',
  'К-адабият': 'kyrgyzLit',
  'К-адабияты': 'kyrgyzLit',
  'К-адаб': 'kyrgyzLit',
  'К-тили': 'kyrgyz',
  'О-тили': 'russian',
  'О-адабият': 'russianLit',
  'О-адабияты': 'russianLit',
  'Орус адаб.': 'russianLit',
  'Орус.адаб': 'russianLit',
  'Орус. адаб': 'russianLit',
  'Орус. тили': 'russian',
  'Орус. адаб.': 'russianLit',
  'Т-таануу': 'social',
  'Тарых таануу': 'history',
  'Мен жана д': 'social',
  'Мен жана дүйнө': 'social',
  'Мен ж/а дүйнө': 'social',
  'Мен жана дүйн.': 'social',
  'Мен жана д.': 'social',
  'Т-таануу': 'social',
  'К-тили (': 'kyrgyz',
  'О-тили (': 'russian',
  'О-тил': 'russian',
  'Матем (': 'algebra',
  'К-тили (': 'kyrgyz',
  'О-тил (': 'russian',
  'Орус тил': 'russian',
  'Кырг. тил': 'kyrgyz',
  'Кырг. тил (': 'kyrgyz',
  'Кырг. тил (': 'kyrgyz',
  'Кырг. адаб': 'kyrgyzLit',
  'Кырг. адаб (': 'kyrgyzLit',
  'Кырг. адаб.': 'kyrgyzLit',
  'Кырг. адаб. (': 'kyrgyzLit',
  'Орус. тили': 'russian',
  'Орус. адаб': 'russianLit',
  'Орус. адаб.': 'russianLit',
  'Д-тарбия': 'pe',
  'Д-тарбия (': 'pe',
  'Д-тарб': 'pe',
  'Инфор-ка': 'informatics',
  'Дин өн': 'religious',
  'Дин өн. т': 'religious',
  'Дин өн. тар': 'religious',
};

function normalizeSubject(raw) {
  const cleaned = raw.replace(/\s*\(\d+(?:\/\d+)*\)/g, '').trim();
  for (const [alias, key] of Object.entries(subjectAliases)) {
    if (cleaned.startsWith(alias) || cleaned.includes(alias)) return key;
  }
  return 'other';
}

function extractRoom(raw) {
  const match = raw.match(/\((\d+(?:\/\d+)*)\)/);
  return match ? match[1] : null;
}

function parseLessonsFromTable(text, className) {
  const lines = text.split('\n');
  const lessons = [];
  
  for (const line of lines) {
    if (!line.includes('|')) continue;
    
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length < 2) continue;
    
    // Find lesson number
    let lessonNum = 0;
    for (const cell of cells) {
      const numMatch = cell.match(/^\s*(\d+)\s*(?:\(|–|—|—)/);
      if (numMatch) {
        lessonNum = parseInt(numMatch[1]);
        break;
      }
      const numMatch2 = cell.match(/^(\d+)\s*[–—–]/);
      if (numMatch2) {
        lessonNum = parseInt(numMatch2[1]);
        break;
      }
    }
    
    if (lessonNum === 0) continue;
    
    // Find our class column
    let classIdx = -1;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].includes(className) || cells[i].includes(`${className} (каб`)) {
        classIdx = i;
        break;
      }
    }
    
    if (classIdx < 0) continue;
    
    // Get subject for this class
    if (classIdx + 1 < cells.length) {
      const subjectRaw = cells[classIdx + 1];
      if (subjectRaw && subjectRaw !== '—' && !subjectRaw.includes('тАФ') && !subjectRaw.includes('Кл. саат') === false) {
        // Check if it's not a day header or meta info
        if (!subjectRaw.includes('День') && !subjectRaw.includes('№') && !subjectRaw.includes('каб.')) {
          lessons.push({
            lesson: lessonNum,
            subject: normalizeSubject(subjectRaw),
            room: extractRoom(subjectRaw),
          });
        }
      }
    }
  }
  
  return lessons;
}

// Split by class section headers
const sections = rawText.split(/^## /m).filter(s => s.trim());

const scheduleData = {
  year: '2026–2027',
  shifts: {
    morning: {
      lessons: [
        { num: 1, start: '07:30', end: '08:15' },
        { num: 2, start: '08:20', end: '09:05' },
        { num: 3, start: '09:10', end: '09:55' },
        { num: 4, start: '10:05', end: '10:50' },
        { num: 5, start: '10:55', end: '11:40' },
        { num: 6, start: '11:45', end: '12:30' },
      ],
      breaks: [
        { after: 1, minutes: 5 },
        { after: 2, minutes: 5 },
        { after: 3, minutes: 10 },
        { after: 4, minutes: 5 },
        { after: 5, minutes: 5 },
      ],
    },
    afternoon: {
      lessons: [
        { num: 1, start: '13:30', end: '14:15' },
        { num: 2, start: '14:20', end: '15:05' },
        { num: 3, start: '15:10', end: '15:55' },
        { num: 4, start: '16:05', end: '16:50' },
        { num: 5, start: '16:55', end: '17:40' },
        { num: 6, start: '17:45', end: '18:30' },
      ],
      breaks: [
        { after: 1, minutes: 5 },
        { after: 2, minutes: 5 },
        { after: 3, minutes: 10 },
        { after: 4, minutes: 5 },
        { after: 5, minutes: 5 },
      ],
    },
  },
  classes: [],
};

const dayMap = {
  'Дүйшөмбү': 'mon',
  'Понедельник': 'mon',
  'Шейшемби': 'tue',
  'Вторник': 'tue',
  'Шаршемби': 'wed',
  'Среда': 'wed',
  'Бейшемби': 'thu',
  'Четверг': 'thu',
  'Жума': 'fri',
  'Пятница': 'fri',
};

for (const section of sections) {
  // Skip sections that aren't about classes
  if (!section.match(/\d+[-–]\w/)) continue;
  
  // Extract class header
  const gradeMatch = section.match(/^([1-9]|10|11)(-[А-Яа-яA-Z]+)?\s*\(.*?\)/);
  if (!gradeMatch) {
    // Try simpler pattern
    const simpleMatch = section.match(/^([1-9]|10|11)(-[А-Яа-яA-Z]+)?/);
    if (simpleMatch) {
      gradeMatch = simpleMatch;
    } else {
      continue;
    }
  }
  
  const grade = parseInt(gradeMatch[1]);
  const letter = gradeMatch[2] || '';
  const className = `${grade}${letter}`;
  
  // Detect shift
  let shift = 'morning';
  if (section.includes('2-я смена') || section.includes('2-й смены') || section.includes('Вторая смена')) {
    shift = 'afternoon';
  }
  
  // Extract teacher and room from first class mention
  const teacherMatch = section.match(/([А-Яа-яA-Z][а-яA-Z]+\s*[А-Яа-яA-Z][а-я]+\.[А-Яа-яA-Z]\.[А-Яа-яA-Z]\.?)/);
  const teacher = teacherMatch ? teacherMatch[1].trim() : null;
  
  const roomMatch = section.match(/каб\. №(\d+)/);
  const room = roomMatch ? roomMatch[1] : null;
  
  // Extract all class names from this section
  const classNames = [...section.matchAll(/([1-9]|10|11)-([А-Яа-яA-Z]+)/g)].map(m => ({
    grade: parseInt(m[1]),
    letter: m[2],
    name: `${m[1]}${m[2]}`,
  }));
  
  // Check for multiple classes in this section (like "1-А, 1-Б, 1-В")
  const isMultiClass = classNames.length > 1;
  
  for (const cls of classNames) {
    const clsName = cls.name;
    
    // Find the table for this class in the section
    // Look for the table that contains this class name
    const lines = section.split('\n');
    let inTable = false;
    let tableLines = [];
    
    for (const line of lines) {
      if (line.includes('| День') || line.includes('| **День') || line.includes('|---')) {
        inTable = true;
        tableLines = [];
        continue;
      }
      
      if (inTable && line.trim().startsWith('|')) {
        tableLines.push(line);
      } else if (inTable && !line.includes('|')) {
        inTable = false;
      }
    }
    
    // Parse lessons from table
    const lessons = [];
    for (const line of tableLines) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cells.length < 2) continue;
      
      // Find lesson number
      let lessonNum = 0;
      for (const cell of cells) {
        const numMatch = cell.match(/^(\d+)\s*(?:\(|–|—|—)/);
        if (numMatch) {
          lessonNum = parseInt(numMatch[1]);
          break;
        }
        const timeMatch = cell.match(/^(\d+)\s*[\u2013\u2014]/);
        if (timeMatch) {
          lessonNum = parseInt(timeMatch[1]);
          break;
        }
      }
      
      if (lessonNum === 0) continue;
      
      // Find our class column
      let classIdx = -1;
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].includes(clsName) || cells[i].includes(`${cls.grade}-${cls.letter}`)) {
          classIdx = i;
          break;
        }
      }
      
      if (classIdx < 0) continue;
      
      // Get subject for this class
      if (classIdx + 1 < cells.length) {
        const subjectRaw = cells[classIdx + 1];
        if (subjectRaw && subjectRaw !== '—' && !subjectRaw.includes('тАФ') && !subjectRaw.includes('День') && !subjectRaw.includes('№') && !subjectRaw.includes('каб.')) {
          lessons.push({
            lesson: lessonNum,
            subject: normalizeSubject(subjectRaw),
            room: extractRoom(subjectRaw),
          });
        }
      }
    }
    
    if (lessons.length > 0) {
      scheduleData.classes.push({
        id: clsName,
        grade: cls.grade,
        letter: cls.letter,
        teacher,
        room,
        shift,
        lessons,
      });
    }
  }
}

console.log(`Parsed ${scheduleData.classes.length} classes`);

// Write to JSON
fs.writeFileSync('scheduleCatalog.json', JSON.stringify(scheduleData, null, 2));
console.log('Written to scheduleCatalog.json');

// Print summary
const byGrade = {};
for (const cls of scheduleData.classes) {
  byGrade[cls.grade] = byGrade[cls.grade] || [];
  byGrade[cls.grade].push(cls.id);
}
for (const grade of Object.keys(byGrade).sort()) {
  console.log(`Grade ${grade}: ${byGrade[grade].join(', ')} (${scheduleData.classes.find(c => c.grade === parseInt(grade)).lessons.length} lessons)`);
}
