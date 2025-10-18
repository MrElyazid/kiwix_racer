
## Kiwixracer :

Kiwixracer is a game where you need to go from a wikipedia article ( English wikipedia ) to another in the quickest way possible.
we plan on making it a multiplayer game later ( using websockets ) if the developement for single play is successful.

## the plan :

we will use wikipedia archives from [kiwix](https://kiwix.org/en/) specifically at : [link](https://library.kiwix.org/#lang=eng&category=wikipedia) for the content, with a focus at the start on the `Wikipedia best 45000 articles` zim archive, ( we can easily add more archives later ) and serve the zim archives using a nodejs/express server using the `openzim/libzim` npm package.

but before telling the user to go from article X to article Y we need to make sure a path exists right?

thats the hardest part of the project, for that, we will need to use official wikipedia dumps, Wikipedia offers sql dumps ( Mariadb ) at : https://dumps.wikimedia.org/enwiki/latest/ , the two files that interest us are : `https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-pagelinks.sql.gz` which contains the internal links each wikipedia link contains, this file is 33gb after decompression... an sql table that is 33gb in size!!, and it doesnt contain article names, it contains article ids, this is why we need another file too : `https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-page.sql.gz` this one actually contains the articles titles and their IDs.

the plan to tackle this is :
- extract articles titles from the kiwix zim archive
- filter the `enwiki-latest-page.sql` so that it only contains articles we care about
- perform a sql `join` with the `latest-pagelinks.sql` so that we have all the links and relations between articles we have.

once that is done we can easily generate paths between articles and make sure a path exists before suggesting it to the player.

OR :

in case that doesnt go as planned we can just hardcode paths that are sure to exist, for example go from `Messi` to `Maradona` .. etc


## technologies to be used :

- nodejs/expressjs
- [bulma](https://bulma.io/) for the css
- vuejs only if the frontend becomes complicated ( it probably wont )
