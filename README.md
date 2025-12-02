# Kiwixracer :

A wikiracing game where the goal is to go from a wikipedia article X to another Y in the quickest way possible.

The game uses wikipedia REST api for fetching the articles and a modern build of the [six degrees of wikipedia](https://github.com/jwngr/sdow) database for visualization and path finiding.

- Singleplayer : the user chooses a starting and a target article or just chooses them randomly and enters a game.

- Multiplayer : we will not work on it now but if the work goes smoothly we will use socket io for game room creation where multiple users can join the same game and race each other.

- Explore : here the user can just explore the datasets/archives we are using, maybe visualize some algorithms ( visualizing a graph traversal algorithm would be interesting ), we will use most likely D3.js for this.

## Implementation plan :

### Data preparation :

- we will just use the wikipedia REST api for serving the articles

Once we have the data the rest is simple :

- for path contsruction and visualisation we use the archive's sqlite database.
- for the frontend we will use vuejs and [bulma](https://bulma.io/) for the css.
- [D3.js](https://d3js.org/) for graph visualization
- [p5.js](https://github.com/processing/p5.js) for animations if needed

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


## PS :
changes to the codebase over time are described in changelog.md (if you are a collaborator use it too).

