# 02/11/2025 :

- created the project structure with a working server for zim archives and scripts to generate the sqlite databases.
There are two folders, client for the frontend and server for the backend, the structure of each one is explained in its correspondant README.md file.

For the data folder, downloading any archive and placing it in the zim folder then running one the scripts :
    - `process_all_zims.sh` on Linux
    - `process_all_zims.bat` on windows
will generate the sqlite databases automatically.

Also for the server .env, its never tracked by git, copy .env.example to a .env file and make sure the configs in it are correct.

