# Public content CSV sheets

Set `SHEET_NEWS_URL`, `SHEET_EVENTS_URL`, and `SHEET_DOCS_URL` as repository Actions variables to published CSV URLs. Missing URLs and fetch or schema errors produce empty arrays so builds remain available. Rows with missing required values are skipped. Set an optional `published` column to `false` to hide a row; all other values are treated as published.

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
