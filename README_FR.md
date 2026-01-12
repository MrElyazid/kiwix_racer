[README in English](./README.md)

![logo](./client/public/favicon.png)

# wikiDash :

Un jeu de course Wikipedia et un visualiseur de Wikipedia

Visitez le site à :

## Fonctionnalités :

- Mode solo où vous pouvez choisir un article de départ et un article cible de Wikipedia anglais ou français et essayer d'aller du départ à la cible.
- Mode multijoueur où vous pouvez créer une salle et jouer contre vos amis avec les mêmes règles qu'en solo.
- Ou vous pouvez simplement explorer Wikipedia comme un graphe et découvrir le chemin le plus court entre deux articles dans le wiki anglais.

## Technologies Utilisées :

- [Vuejs](https://vuejs.org/) pour le frontend
- [Expressjs](https://expressjs.com/) pour le backend
- [Bulma](https://bulma.io/) pour le CSS
- [socketio](https://socket.io/) pour jouer en multijoueur
- [p5.js](https://p5js.org/) pour l'arrière-plan de particules
- [d3.js](https://d3js.org/) pour la visualisation de graphes
- quelques packages npm clés : [ufuzzy](https://github.com/leeoniya/uFuzzy) pour la recherche en jeu, [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) pour interroger la base de données .sqlite.

### Comment ça marche :

- Nous avons utilisé l'[API REST Wikipedia](https://en.wikipedia.org/api/rest_v1/#/) pour obtenir le contenu des articles.

- Pour la base de données utilisée dans la visualisation, le projet utilise un fork du processus de construction du projet [six degrees of wikipedia](https://github.com/jwngr/sdow), nous avons essentiellement construit une version moderne de la base de données utilisée dans ce projet, vous pouvez trouver les scripts de construction utilisés [ici](https://github.com/MrElyazid/sdow/tree/build_fix).

- Vous pouvez télécharger la base de données vous-même depuis ce [lien](https://drive.google.com/file/d/1oeJnxvXm9olUjZ7RuRoRv_JBfHUvituO/view?usp=drive_link)

- Référez-vous à cette [section](#notes-sur-la-base-de-données-sdow-) pour voir sa structure SQL.

## Exécuter localement :

avant de cloner le dépôt, assurez-vous de télécharger :

- la base de données compressée [ici](https://drive.google.com/file/d/1oeJnxvXm9olUjZ7RuRoRv_JBfHUvituO/view?usp=sharing)
- [ce fichier](https://drive.google.com/file/d/1joBco4RH4cWCHTLQXlplaZWyOVSE3R3e/view?usp=sharing) de titres des 45 000 meilleurs articles Wikipedia qui est utilisé pour obtenir un article aléatoire du wiki anglais

1. clonez ce dépôt :

```bash
git clone https://github.com/MrElyazid/wikiDash
```

2. allez dans le répertoire `client` et exécutez `npm install`, puis faites de même pour le répertoire `server`

3. créez un dossier `data` au même niveau que `client` et `server`
placez le fichier d'articles téléchargé dedans, et créez un dossier `sdow` dans lequel vous placerez le fichier de base de données décompressé `tar.gz`, assurez-vous que son nom est `sdow.sqlite`

4. dans client, renommez `.env.example` en `.env`

5. maintenant pour lancer le projet en mode développement, allez simplement dans le dossier `client` et exécutez `npm run dev` et démarrez le serveur en allant dans son dossier et exécutez `npm start`

### Note sur l'hébergement :

- Le site web est temporairement hébergé sur un VPS [DigitalOcean](https://www.digitalocean.com/).
- l'IP de la machine Linux est liée au domaine wikidash.ddns.net en utilisant le service [no-ip](https://www.noip.com/)
- le serveur n'a que 8 Go de RAM et un processeur AMD à 2 cœurs, ce qui pour la visualisation n'est pas terrible car la visualisation de graphes prend beaucoup de mémoire, en bref, attendez-vous à des ralentissements !!
- il utilise http car nous n'avons pas configuré de certificat SSL

## Quelques ressources :

- [dumps officiels de wikipedia](https://dumps.wikimedia.org/enwiki/latest/)
- [six degrees of wikipedia](https://github.com/jwngr/sdow)
- [Un projet similaire](https://wiki-race.com/)

# Notes sur la base de données sdow :

## Tables

### pages

| Colonne     | Type       | Description                                    |
| ----------- | ---------- | ---------------------------------------------- |
| id          | INTEGER PK | ID de la page                                  |
| title       | TEXT       | Titre de l'article (ex : `Albert_Einstein`)    |
| is_redirect | INTEGER    | 0=article, 1=redirection                       |

### links

| Colonne              | Type       | Description                                  |
| -------------------- | ---------- | -------------------------------------------- |
| id                   | INTEGER PK | ID de la page (FK vers pages.id)             |
| outgoing_links_count | INTEGER    | Nombre de liens sortants                     |
| incoming_links_count | INTEGER    | Nombre de liens entrants                     |
| outgoing_links       | TEXT       | IDs séparés par des pipes : `"123\|456\|789"` |
| incoming_links       | TEXT       | IDs séparés par des pipes : `"321\|654\|987"` |

### redirects

| Colonne   | Type       | Description            |
| --------- | ---------- | ---------------------- |
| source_id | INTEGER PK | ID de la page de redirection |
| target_id | INTEGER    | ID de la page cible    |

**BFS Bidirectionnel :**

- Recherche à partir de la source et de la cible
- Avant : utilise `outgoing_links`
- Arrière : utilise `incoming_links`
- Se rencontrent au milieu

**Reconstruction du chemin :**

1. Point de rencontre trouvé
2. Tracer en arrière vers la source via sourceParents
3. Tracer en avant vers la cible via targetParents
4. Concaténer les deux chemins

#### Membres de l'équipe :
- Elyazid Essoly
- Tefinjanahary Maharavo Anicet
- Baptiste Lheritier
- Ridiwane Mama Toure