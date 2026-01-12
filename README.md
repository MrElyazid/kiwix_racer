
[README en Francais](./README_FR.md)

![logo](./client/public/favicon.png)

# wikiDash :

A wikiracing game and wikipedia visualizer

Visit at :

## Features :

- Singleplayer mode where you can choose a start and target articles from the English or French wikipedia and try to get from start to target.
- Multiplayer mode where you can create a room and play against your friends with the same rules as in singleplayer.
- Or you can just explore wikipedia as a graph and discover the shortest path between and two articles in the English wiki.

## Technologies Used :

- [Vuejs](https://vuejs.org/) for the frontend
- [Expressjs](https://expressjs.com/) for the backend
- [Bulma](https://bulma.io/) for the css
- [socketio](https://socket.io/) for playing in multiplayer
- [p5.js](https://p5js.org/) for the particles background
- [d3.js](https://d3js.org/) for graph visualizaion
- some key npm packages : [ufuzzy](https://github.com/leeoniya/uFuzzy) for in-game search, [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for querying the .sqlite database.


### How it works :

- We used the [wikipedia REST api](https://en.wikipedia.org/api/rest_v1/#/) for getting the article contents.

- For the database used in visualization, the project uses a custom fork of the build process for the [six degrees of wikipedia](https://github.com/jwngr/sdow) project, basically we built a modern version of the database used in that project, you can find the build script used [here](https://github.com/MrElyazid/sdow/tree/build_fix).

- You can download the database yourself from this [link](https://drive.google.com/file/d/1oeJnxvXm9olUjZ7RuRoRv_JBfHUvituO/view?usp=drive_link)

- Refere to this [section](#notes-about-the-sdow-database-) to see its sql structure.



## Run locally :

before cloning the repo make sure to download :

- the compressed database from [here](https://drive.google.com/file/d/1oeJnxvXm9olUjZ7RuRoRv_JBfHUvituO/view?usp=sharing)
- [this](https://drive.google.com/file/d/1joBco4RH4cWCHTLQXlplaZWyOVSE3R3e/view?usp=sharing) top 45k wikipedia articles titles file which is used to get a random article from the english wiki

1. clone this repo :

```bash
git clone https://github.com/MrElyazid/wikiDash
```
2. go into the `client` directory and run `npm install`, then do the same thing for the `server` directory

3. create a folder `data` at the same level as `client` and `server`
place the downloaded articles file in it, and make a folder `sdow` in which place the decompressed `tar.gz` database file, make sure its name is `sdow.sqlite`

4. in client rename `.env.example` to `.env`

5. now to launch the project in developpement mode just go to the `client` folder and run `npm run dev` and start the server by going to its folder and run `npm start`

### Note about the hosting :

- The website is temporarly hosted on a [DigitalOcean](https://www.digitalocean.com/) VPS.
- the IP of the Linux machine is Linked to the domain wikidash.ddns.net using the service [no-ip](https://www.noip.com/)
- the server has only 8gb of ram and a 2 core amd cpu, which for visualization isnt that great since graph visualization takes a lot of memory, in short, expect lag!!
- it uses http since we didnt set up an ssl certificate

## Some resources :

- [wikipedia official dumps](https://dumps.wikimedia.org/enwiki/latest/)
- [six degrees of wikipedia](https://github.com/jwngr/sdow)
- [A similar project](https://wiki-race.com/)

# Notes about the sdow database :

## Tables

### pages

| Column      | Type       | Description                             |
| ----------- | ---------- | --------------------------------------- |
| id          | INTEGER PK | Page ID                                 |
| title       | TEXT       | Article title (e.g., `Albert_Einstein`) |
| is_redirect | INTEGER    | 0=article, 1=redirect                   |

### links

| Column               | Type       | Description                           |
| -------------------- | ---------- | ------------------------------------- |
| id                   | INTEGER PK | Page ID (FK to pages.id)              |
| outgoing_links_count | INTEGER    | Count of outgoing links               |
| incoming_links_count | INTEGER    | Count of incoming links               |
| outgoing_links       | TEXT       | Pipe-separated IDs: `"123\|456\|789"` |
| incoming_links       | TEXT       | Pipe-separated IDs: `"321\|654\|987"` |

### redirects

| Column    | Type       | Description      |
| --------- | ---------- | ---------------- |
| source_id | INTEGER PK | Redirect page ID |
| target_id | INTEGER    | Target page ID   |

**Bidirectional BFS:**

- Search from both source and target
- Forward: uses `outgoing_links`
- Backward: uses `incoming_links`
- Meet in the middle

**Path Reconstruction:**

1. Meeting point found
2. Trace back to source via sourceParents
3. Trace forward to target via targetParents
4. Concatenate both paths


#### Team members :
- Elyazid Essoly
- Tefinjanahary Maharavo Anicet
- Baptiste Lheritier
- Ridiwane Mama Toure
