# Goodreads TRMNL Reading Dashboard

A lightweight TRMNL dashboard that turns a Goodreads CSV export into an e-ink-friendly reading stats display.

The dashboard shows yearly reading progress, page totals, currently reading books, and book cover art using Open Library cover URLs.

## Features

* Upload a Goodreads library export CSV
* Generate reading stats automatically
* Display:

  * Books read this year
  * Pages read this year
  * Estimated pages per day
  * Total Goodreads books
  * Total books read
  * Currently reading books
  * Book cover art
* Exposes a JSON endpoint for TRMNL polling
* Designed for low-cost hosting on Render

## Tech Stack

* Node.js
* Express
* Multer
* csv-parser
* TRMNL Private Plugin
* Open Library cover images
* Render hosting

## Project Structure

```text
goodreads-trmnl/
├── server.js
├── package.json
├── package-lock.json
├── public/
│   └── upload.html
├── uploads/
├── data/
├── .gitignore
├── LICENSE
└── README.md
```

## Setup Locally

Clone the repo:

```bash
git clone https://github.com/YOUR_USERNAME/goodreads-trmnl.git
cd goodreads-trmnl
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Open the upload page:

```text
http://localhost:3000/upload
```

Upload your Goodreads CSV export.

Then view the dashboard JSON:

```text
http://localhost:3000/dashboard.json
```

## Export Your Goodreads Data

1. Go to Goodreads on desktop.
2. Open **My Books**.
3. Select **Import and export**.
4. Click **Export Library**.
5. Download the CSV file.
6. Upload it to this app.

## Deploy on Render

Create a new Render Web Service and connect this GitHub repo.

Use these settings:

```text
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

After deployment, open:

```text
https://YOUR-APP-NAME.onrender.com/upload
```

Upload your Goodreads CSV.

Then use this endpoint in TRMNL:

```text
https://YOUR-APP-NAME.onrender.com/dashboard.json
```

## TRMNL Setup

Create a TRMNL Private Plugin using polling.

Set the polling URL to:

```text
https://YOUR-APP-NAME.onrender.com/dashboard.json
```

The JSON fields can then be used in your TRMNL markup.

Example fields:

```liquid
{{ books_read_this_year }}
{{ pages_read_this_year }}
{{ pages_per_day_estimate }}
{{ total_books_on_goodreads }}
{{ current_book_1_title }}
{{ current_book_1_cover_url }}
{{ current_book_2_title }}
{{ current_book_2_cover_url }}
```

## Notes on Cover Art

Book covers are generated using ISBN values from the Goodreads CSV and Open Library cover URLs.

If a book does not have an ISBN or Open Library does not have a cover image, the cover may appear blank.

## Privacy

The uploaded Goodreads CSV is processed by the server and then deleted.

The app stores only the processed dashboard JSON.

Current MVP note: this version is designed for personal/single-user use. A public multi-user version should generate unique dashboard URLs per user.

## Roadmap

* Generate unique dashboard URLs per user
* Add better upload success page
* Add fallback cover image
* Add support for last three read books
* Add optional Goodreads RSS feed support
* Add Supabase or Postgres storage for public use
* Package as a public TRMNL plugin

## License

MIT License
