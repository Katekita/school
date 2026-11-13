import { documents, events, newsDataError, newsItems } from '../data/mockData'
import textbookCatalog from '../data/textbooks.json'
import schoolData from '../data/school'
import * as scheduleData from '../data/schedule'

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeRecords(records) {
  if (!Array.isArray(records)) return []
  return records.flatMap((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return []
    const title = typeof record.title === 'string' ? record.title.trim() : ''
    if (!title) return []

    const slug = String(record.slug || record.id || slugify(title) || `record-${index + 1}`)
    return [{
      ...record,
      id: String(record.id ?? slug),
      slug,
      title,
      excerpt: String(record.excerpt ?? record.summary ?? record.description ?? ''),
      content: String(record.content ?? record.body ?? record.description ?? ''),
      category: String(record.category ?? ''),
      image: String(record.image ?? record.cover ?? ''),
      publishedAt: String(record.publishedAt ?? record.published_at ?? record.date ?? ''),
      status: String(record.status ?? (record.published === false ? 'draft' : 'published')),
      verified: record.verified === true,
    }]
  })
}

export function getNews() {
  return normalizeRecords(newsItems).filter((item) => item.published !== false && item.status !== 'draft')
}

export function getNewsError() {
  return newsDataError
}

export function getEvents() {
  return normalizeRecords(events).filter((item) => item.published !== false && item.status !== 'draft')
}

export function getDocuments() {
  return normalizeRecords(documents).filter((item) => item.published !== false && item.status !== 'draft')
}

export function getTextbooks() {
  const books = textbookCatalog?.books
  return normalizeRecords(books).filter((item) => item.published !== false && item.status !== 'draft')
}

export function getSchedule() {
  const records = []
  for (const classKey of scheduleData.scheduleClasses) {
    const days = scheduleData.schedule10[classKey] || {}
    for (const [day, lessons] of Object.entries(days)) {
      for (const [index, lesson] of (Array.isArray(lessons) ? lessons : []).entries()) {
        records.push({
          id: `${classKey}-${day}-${index + 1}`,
          slug: `${slugify(classKey)}-${day}-${index + 1}`,
          title: scheduleData.subjectName(lesson.subject, 'ru'),
          content: '',
          category: classKey,
          publishedAt: '',
          status: 'published',
          verified: false,
          ...lesson,
          day,
          lessonNumber: index + 1,
        })
      }
    }
  }
  return {
    ...scheduleData,
    records: normalizeRecords(records),
  }
}

export function getSchoolInfo() {
  return schoolData
}
