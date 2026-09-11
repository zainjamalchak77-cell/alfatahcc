# Auto updating fixtures

The fixtures page rebuilds itself from a Google Sheet. Add a row, and within the
hour the website shows the match, the venue, the time and the squad. Nobody needs
to touch any code.

---

## 1. Create the sheet

The quickest way is to import the file the site already runs on. In a blank
Google Sheet choose **File -> Import -> Upload**, pick `data/fixtures.csv` from
this repository, choose **Replace spreadsheet** and comma as the separator. That
gives you the correct headings and the current fixtures in one step. Name the
sheet **Al Fatah CC Fixtures**.

To build it by hand instead, put these headings in row 1, spelled exactly like
this, all lower case:

```
date | time | competition | opponent | home_away | venue | format | status | result | our_score | their_score | squad | notes | live_url | poster
```

Only **date** and **opponent** are required. Leave anything you do not know blank.

Tip: `live_url` is worth filling in every time. Paste the CricHeroes link for
that league or that specific scorecard and the site puts a live scores button on
the match, so supporters can follow ball by ball while it is being played.

### What each column means

| Column | What to put | Example |
| --- | --- | --- |
| `date` | Always `YYYY-MM-DD` | `2026-08-22` |
| `time` | Start time, any readable format | `1:00 pm` |
| `competition` | Which league | `Darebin Chargers League · T10 2026` |
| `opponent` | The other team | `Wollert Rhinos` |
| `home_away` | `home`, `away`, or `neutral` for a ground belonging to neither club | `neutral` |
| `venue` | Ground, and which oval | `Thomastown East Reserve, Lower Oval` |
| `format` | Overs | `10 over match` |
| `status` | `upcoming` or `result`. Nothing else counts as played | `upcoming` |
| `result` | Only once played | `Won by 6 wickets` |
| `our_score` | Al Fatah's score | `142/4` |
| `their_score` | Their score | `138/7` |
| `squad` | Names separated by commas, put `(C)` after the captain | `Faisal Hayat (C), Tahir Saeed, Rao Haider` |
| `notes` | Anything else, not shown on the site yet | |
| `live_url` | CricHeroes link for that match or league. Adds a "Live scores on CricHeroes" button | `https://cricheroes.com/cricket-league/2206/...` |
| `poster` | Filename of the match day poster in `assets/img/`. Leave blank to use the club default | `matchday-amuc-thumb.jpg` |

**The date decides everything.** The soonest upcoming match automatically becomes
the big "Next match" card on the fixtures page and the band on the home page. You
never choose it manually.

A row counts as a result if `status` is `result`, or if you fill in `result`.
Winning results get a green edge, losses a red one. That comes from the words
"won" or "lost" in the result column.

---

## 2. Publish the sheet

1. In the sheet: **File → Share → Publish to web**
2. Under the first dropdown pick the **sheet tab**, not "Entire document"
3. Under the second dropdown pick **Comma separated values (.csv)**
4. Click **Publish**, then confirm
5. Copy the link it gives you. It ends in `output=csv`

This publishes only the fixture rows. It does not make your Google account or
any other file public.

---

## 3. Give the link to the website

1. Go to **https://github.com/zainjamalchak77-cell/alfatahcc/settings/secrets/actions**
2. Click **New repository secret**
3. Name: `FIXTURES_CSV_URL`
4. Value: the link from step 2
5. **Add secret**

Done. From then on it runs by itself.

---

## Letting someone else update the fixtures

Anyone with edit access to the sheet can update the website. They do not need a
GitHub account and they never touch any code.

1. In the sheet click **Share**
2. Add their email, set them to **Editor**
3. Send them the link, plus the column guide above

**What they type goes live within the hour, with nobody reviewing it first.** So
give edit access only to people who should be able to change the public site,
and keep everyone else on Viewer.

### Guard the sheet against typos

A malformed row does not show an error on the website, it just quietly fails to
appear. Two minutes of setup prevents most of it. Select the column, then
**Data -> Data validation**, and add a dropdown:

| Column | Allowed values |
| --- | --- |
| `status` | `upcoming`, `result` |
| `home_away` | `home`, `away`, `neutral` |

For `date`, set the validation to **Date** so a mistyped day is rejected as it
is entered. The date format must stay `YYYY-MM-DD`.

The build also writes warnings into the Actions log when it sees a status it
does not recognise, or a match still marked upcoming after its date has passed.
That is the log to check when a fixture does not appear.

### Posters are not in the sheet

The `poster` column holds a filename, not an image. The file itself has to be
added to the repository, so whoever maintains the site adds new posters. Anyone
editing the sheet can leave `poster` blank and the fixture still builds with the
club default.

---

## How often it updates

Every hour, on its own. To publish something immediately instead of waiting:

1. Go to the repository's **Actions** tab
2. Pick **Update fixtures** on the left
3. **Run workflow**

It takes about thirty seconds.

---

## If the sheet ever breaks

The build keeps a copy of the last good data in `data/fixtures.csv`. If the sheet
is deleted, unpublished or unreachable, the site keeps showing the last fixtures
it successfully read rather than going blank. The failure is written into the
Actions log so it is visible.

That also means the site works with no sheet at all. Edit `data/fixtures.csv`
directly and the same build runs.

---

## Adding a match day poster

The poster is the tall graphic beside the "Next match" card. Posters live in the
repository, not in the sheet, because a sheet cannot hold an image file.

1. Save the poster into `assets/img/` twice, at these exact sizes:
   - `matchday-<opponent>.jpg` at 1024 x 1536, the full size for the gallery
   - `matchday-<opponent>-thumb.jpg` at 600 x 900, the one the page displays
2. Put the thumb filename in the `poster` column for that fixture.

If the `poster` cell is blank the site falls back to the club default poster, so
a fixture without one still builds. A sheet with no `poster` column at all also
still works, every fixture just uses the default.

---

## Adding a result after a match

Find the row for that match and fill in three cells:

- `status` → `result`
- `result` → `Won by 6 wickets`
- `our_score` and `their_score` → `142/4` and `138/7`

The match moves itself out of Upcoming and into Results, and the next fixture
takes over the "Next match" card automatically.
