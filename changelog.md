# 02/11/2025 :

- created the project structure with a working server for zim archives and scripts to generate the sqlite databases.
There are two folders, client for the frontend and server for the backend, the structure of each one is explained in its correspondant README.md file.

For the data folder, downloading any archive and placing it in the zim folder then running one the scripts :
    - `process_all_zims.sh` on Linux
    - `process_all_zims.bat` on windows
will generate the sqlite databases automatically.

Also for the server .env, its never tracked by git, copy .env.example to a .env file and make sure the configs in it are correct.

# 11/11/2025 :

- We will NOT use zim archives anymore, working with zim archives direclty via the `openzim` npm package is complicated, and its not fun to limit the player to only articles present in an archive ( a wikipedia article has way too many links that are not relevant to its context ), we will use the wikipedia REST api to fetch the html direclty.

- Since we now have the six degrees of wikipedia database, we will use it for path finding and visualization, the date of the build for the database is `03-NOV-2025`

- The project is already like 40% finished.