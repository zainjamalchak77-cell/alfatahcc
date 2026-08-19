# Auto updating fixtures

The fixtures page rebuilds itself from a Google Sheet. Add a row, and within the
hour the website shows the match, the venue, the time and the squad. Nobody needs
to touch any code.

---

## 1. Create the sheet

Make a new Google Sheet called **Al Fatah CC Fixtures**. Put these headings in
row 1, spelled exactly like this, all lower case:

```
date | time | competition | opponent | home_away | venue | format | status | result | our_score | their_score | squad | notes | live_url
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
| `home_away` | `home` or `away` | `away` |
| `venue` | Ground, and which oval | `Thomastown East Reserve, Lower Oval` |
| `format` | Overs | `10 over match` |
| `status` | `upcoming` or `result` | `upcoming` |
| `result` | Only once played | `Won by 6 wickets` |
| `our_score` | Al Fatah's score | `142/4` |
| `their_score` | Their score | `138/7` |
| `squad` | Names separated by commas, put `(C)` after the captain | `Faisal Hayat (C), Tahir Saeed, Rao Haider` |
| `notes` | Anything else, not shown on the site yet | |
| `live_url` | CricHeroes link for that match or league. Adds a "Live scores on CricHeroes" button | `https://cricheroes.com/cricket-league/2206/...` |

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

## Adding a result after a match

Find the row for that match and fill in three cells:

- `status` → `result`
- `result` → `Won by 6 wickets`
- `our_score` and `their_score` → `142/4` and `138/7`

The match moves itself out of Upcoming and into Results, and the next fixture
takes over the "Next match" card automatically.
