# Al Fatah Cricket Club

Official website of **Al Fatah Cricket Club**, a cricket club based in Melbourne,
Victoria, Australia. Established 2021.

**Live site: https://alfatahcc.com/**

> One Club. One Family. One Goal.

## About the club

Al Fatah Cricket Club was founded in 2021 by a group of players in Melbourne who
wanted a side that selected on merit and trained properly. The club are Trugannina
Premier League champions and are competing in the Darebin Chargers T10 League 2026
across August and September 2026.

- **President and Captain:** Faisal Hayat
- **Vice Captain and Senior Analyst:** Tahir Saeed
- **Core Member:** Jamal

New players and supporters are welcome. See the
[contact page](https://alfatahcc.com/contact.html).

## Club partners

PSI, iDo Events Hire, and JK Project Management.

## About this repository

A static website. Plain HTML, CSS and vanilla JavaScript, with no build step, no
framework and no dependencies. Anton and Inter are self hosted, so the site makes no
external requests and renders correctly offline.

| Path | Contents |
| --- | --- |
| `index.html` and the other `.html` files | The seven pages plus a 404 page |
| `assets/css/styles.css` | All styling |
| `assets/js/main.js` | All behaviour |
| `assets/fonts/` | Self hosted Anton and Inter |
| `assets/img/` | Crest, photos and the social share image |

### Publishing

Hosted on GitHub Pages from the `main` branch, root folder. Any commit pushed to
`main` goes live automatically within about a minute.

### Running it locally

No tooling required. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```
