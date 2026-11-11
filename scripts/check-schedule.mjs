import { schedule10, scheduleClasses, subjectName, weekDays } from '../src/data/schedule.js'

const errors = []
const roomsBySlot = new Map()
for (const className of scheduleClasses) {
  const week = schedule10[className]
  if (!week) {
    errors.push(`${className}: missing weekly schedule`)
    continue
  }
  for (const day of weekDays) {
    const lessons = week[day.id]
    if (!Array.isArray(lessons) || lessons.length === 0) {
      errors.push(`${className}, ${day.id}: no lessons`)
      continue
    }
    lessons.forEach((lesson, index) => {
      const slot = `${className}/${day.id}/${index + 1}`
      if (!lesson || !lesson.subject || !lesson.room) errors.push(`${slot}: empty lesson slot`)
      else if (subjectName(lesson.subject, 'en') === lesson.subject) errors.push(`${slot}: unknown subject "${lesson.subject}"`)
      if (lesson?.room) {
        for (const room of String(lesson.room).split('/').map((item) => item.trim()).filter(Boolean)) {
          const key = `${day.id}/${index + 1}/${room.toLocaleLowerCase()}`
          const previous = roomsBySlot.get(key)
          if (previous && previous !== className) errors.push(`${day.id} lesson ${index + 1}: room ${room} assigned to ${previous} and ${className}`)
          else roomsBySlot.set(key, className)
        }
      }
    })
  }
}

if (errors.length) {
  console.error(`Schedule validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else if (scheduleClasses.length === 0) {
  console.log('Schedule is empty by design; no class allocations are published.')
} else {
  console.log(`Schedule validation passed for ${scheduleClasses.length} classes.`)
}
