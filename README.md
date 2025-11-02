# Kiwixracer :

A wikiracing game where the goal is to go from a wikipedia article X to another Y in the quickest way possible.

The game uses data from [Kiwix Library](https://library.kiwix.org/#lang=eng&category=wikipedia) and has three main features :

- Singleplayer : the user chooses a starting and a target article or just chooses them randomly and enters a game.

- Multiplayer : we will not work on it now but if the work goes smoothly we will use socket io for game room creation where multiple users can join the same game and race each other.

- Explore : here the user can just explore the datasets/archives we are using, maybe visualize some algorithms ( visualizing a graph traversal algorithm would be interesting ), we will use most likely D3.js for this.

## Implementation plan :

### Data preparation :

- After downloading a ZIM archive from kiwix we will run two scripts to build a corresponding sqlite database that has metadata about all the articles in the archive and internal links contained in each one.

Once we have the data the rest is simple :

- use a nodejs/express server to serve the ZIM archives using the `openzim/libzim` npm package.
- for path contsruction and visualisation we use the archive's sqlite database.
- for the frontend we will use vuejs and [bulma](https://bulma.io/) for the css.
- [D3.js](https://d3js.org/) for graph visualization
- [p5.js](https://github.com/processing/p5.js) for animations if needed

## Some resources :

- [Kiwix](https://kiwix.org/en/)
- [wikipedia official dumps](https://dumps.wikimedia.org/enwiki/latest/)
- [six degrees of wikipedia](https://github.com/jwngr/sdow)
- [A similar project](https://wiki-race.com/)

## PS :
changes to the codebase over time are described in changelog.md (if you are a collaborator use it too).

