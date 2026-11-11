# Public content CSV sheets

Set `SHEET_NEWS_URL`, `SHEET_EVENTS_URL`, and `SHEET_DOCS_URL` as repository Actions variables to published CSV URLs. News can also be loaded from the Supabase `news` table when `SHEET_NEWS_URL` is unset; the deploy workflow already supplies the public Supabase URL and key. Only rows with `status = 'published'` and a `published_at` time in the past are included. The scheduled deployment refreshes this content hourly.

If neither news source is configured, the build preserves the existing generated news instead of replacing it with an empty list. A configured news source that cannot be fetched or validated fails the build, preventing an accidental empty-news deployment. Missing event and document sources continue to produce empty arrays. Rows with missing required CSV values are skipped. Set an optional `published` column to `false` to hide a CSV row; all other values are treated as published.

To publish Supabase news, add a row in the `news` table with a unique `slug`, `title`, `body`, `status = published`, and a `published_at` timestamp. The `created_by` field must reference an authorized profile. The public site only reads rows allowed by the database's published-news policy.

CSV files must have a header row. Required columns:

| Sheet | Required columns |
| --- | --- |
| News | `slug`, `title`, `date`, `summary`, `body` |
| Events | `title`, `date`, `summary` |
| Documents | `title`, `url`, `category` |

News may also include optional `cover` (image path/URL) and `slides` (paragraphs separated by `---`). Markdown image references in `body` or `slides` become photo slides. If `slides` is blank, the viewer creates slides from `body`. Additional columns are preserved in generated JSON. Dates and URLs are supplied by the school; this importer does not invent or verify their truth.

Example news row for format testing only (fictional, do not publish):

```csv
slug,title,date,summary,body,published
test-only,FICTIONAL TEST ROW,2099-01-01,Not a real announcement,Delete this sample before publishing,false
```
