import summary from './scheduleSummary.json' with { type: 'json' }

// Числа для секции «школа в цифрах»: считаем из фактического расписания,
// а не придумываем — так блок остаётся честным до подтверждения школой.
// Итоги лежат в лёгком scheduleSummary.json (его пишет
// scripts/build-schedule-catalog.mjs вместе с каталогом), чтобы главная
// страница не тянула 517-килобайтный каталог расписания в стартовый бандл.
export function scheduleStats() {
  return {
    classes: summary.classes,
    subjects: summary.subjects,
    rooms: summary.rooms,
    lessons: summary.lessons,
    lessonMinutes: 45,
    bellRange: summary.bellRange,
  }
}
