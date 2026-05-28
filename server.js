const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return isNaN(date) ? null : date;
}

function cleanIsbn(value) {
  if (!value) return "";

  return String(value)
    .replace(/[^0-9Xx]/g, "")
    .trim();
}

function getCoverUrl(book) {
  const isbn13 = cleanIsbn(book["ISBN13"]);
  const isbn = cleanIsbn(book["ISBN"]);

  const bestIsbn = isbn13 || isbn;

  if (!bestIsbn) return "";

  return `https://covers.openlibrary.org/b/isbn/${bestIsbn}-L.jpg`;
}

app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload.html"));
});

app.post("/upload", upload.single("goodreadsCsv"), (req, res) => {
  const results = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", () => {
      const currentYear = new Date().getFullYear();

      const readBooks = results.filter(
        (book) => book["Exclusive Shelf"] === "read"
      );

      const sortedReadBooks = readBooks
        .filter((book) => parseDate(book["Date Read"]))
        .sort((a, b) => parseDate(b["Date Read"]) - parseDate(a["Date Read"]));

      const latestBook = sortedReadBooks[0];

      const lastThreeReadBooks = sortedReadBooks.slice(0, 3).map((book) => ({
        title: book["Title"],
        author: book["Author"],
        pages: Number(book["Number of Pages"] || 0),
        rating: Number(book["My Rating"] || 0),
        date_read: book["Date Read"],
        cover_url: getCoverUrl(book),
      }));

      const readThisYear = readBooks.filter((book) => {
        const dateRead = parseDate(book["Date Read"]);
        return dateRead && dateRead.getFullYear() === currentYear;
      });

      const pagesThisYear = readThisYear.reduce((sum, book) => {
        return sum + Number(book["Number of Pages"] || 0);
      }, 0);

      const ratedBooks = results.filter((book) => Number(book["My Rating"]) > 0);

      const averageRating =
        ratedBooks.length > 0
          ? (
              ratedBooks.reduce(
                (sum, book) => sum + Number(book["My Rating"]),
                0
              ) / ratedBooks.length
            ).toFixed(1)
          : "N/A";

      const currentlyReading = results
        .filter((book) => book["Exclusive Shelf"] === "currently-reading")
        .slice(0, 3)
        .map((book) => ({
          title: book["Title"],
          author: book["Author"],
          pages: Number(book["Number of Pages"] || 0),
          cover_url: getCoverUrl(book),
        }));

      const yearlyStatsMap = {};

      readBooks.forEach((book) => {
        const dateRead = parseDate(book["Date Read"]);
        if (!dateRead) return;

        const year = dateRead.getFullYear();

        if (!yearlyStatsMap[year]) {
          yearlyStatsMap[year] = {
            year,
            books_read: 0,
            pages_read: 0,
          };
        }

        yearlyStatsMap[year].books_read += 1;
        yearlyStatsMap[year].pages_read += Number(book["Number of Pages"] || 0);
      });

      const yearlyStats = Object.values(yearlyStatsMap).sort(
        (a, b) => b.year - a.year
      );

      const yearlyStatsAscending = yearlyStats
        .slice()
        .sort((a, b) => a.year - b.year);

      const booksPerYearChart = yearlyStatsAscending.map((item) => [
        String(item.year),
        item.books_read,
      ]);

      const booksPerYearLabels = yearlyStatsAscending.map((item) =>
        String(item.year)
      );

      const booksPerYearValues = yearlyStatsAscending.map(
        (item) => item.books_read
      );

      const totalPagesAllBooks = results.reduce((sum, book) => {
        return sum + Number(book["Number of Pages"] || 0);
      }, 0);

      const totalPagesRead = readBooks.reduce((sum, book) => {
        return sum + Number(book["Number of Pages"] || 0);
      }, 0);

      const daysElapsedThisYear = Math.max(
        1,
        Math.ceil(
          (new Date() - new Date(`${currentYear}-01-01`)) /
            (1000 * 60 * 60 * 24)
        )
      );

      const dashboard = {
        total_books_on_goodreads: results.length,
        total_books_read: readBooks.length,
        total_to_read: results.filter(
          (book) => book["Exclusive Shelf"] === "to-read"
        ).length,
        total_currently_reading: results.filter(
          (book) => book["Exclusive Shelf"] === "currently-reading"
        ).length,

        total_pages_all_books: totalPagesAllBooks,
        total_pages_read: totalPagesRead,

        books_read_this_year: readThisYear.length,
        pages_read_this_year: pagesThisYear,
        pages_per_day_estimate: Math.round(
          pagesThisYear / daysElapsedThisYear
        ),

        average_rating: averageRating,

        latest_book: latestBook?.["Title"] || "No books read yet",
        latest_author: latestBook?.["Author"] || "",

        latest_read_title: latestBook?.["Title"] || "No books read yet",
        latest_read_author: latestBook?.["Author"] || "",
        latest_read_cover_url: latestBook ? getCoverUrl(latestBook) : "",

        currently_reading: currentlyReading,
        last_three_read_books: lastThreeReadBooks,
   

        yearly_stats: yearlyStats,

        books_per_year_chart: booksPerYearChart,
        books_per_year_labels: booksPerYearLabels,
        books_per_year_values: booksPerYearValues,

        current_book_1_title: currentlyReading[0]?.title || "",
        current_book_1_author: currentlyReading[0]?.author || "",
        current_book_1_pages: currentlyReading[0]?.pages || "",
        current_book_1_cover_url: currentlyReading[0]?.cover_url || "",

        current_book_2_title: currentlyReading[1]?.title || "",
        current_book_2_author: currentlyReading[1]?.author || "",
        current_book_2_pages: currentlyReading[1]?.pages || "",
        current_book_2_cover_url: currentlyReading[1]?.cover_url || "",

        
        last_updated: new Date().toISOString(),
      };

      fs.writeFileSync(
        path.join(__dirname, "data", "demo-dashboard.json"),
        JSON.stringify(dashboard, null, 2)
      );

      fs.unlinkSync(filePath);

      res.json({
        message: "CSV uploaded and dashboard created.",
        dashboard_url: "/dashboard.json",
        dashboard,
      });
    });
});

app.get("/dashboard.json", (req, res) => {
  const dashboardPath = path.join(__dirname, "data", "demo-dashboard.json");

  if (!fs.existsSync(dashboardPath)) {
    return res.status(404).json({ error: "No dashboard created yet." });
  }

  res.sendFile(dashboardPath);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});