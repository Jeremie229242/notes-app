

-- Initialisation d'une base de données distincte pour chaque microservice

-- Ce script s'exécute au premier démarrage du conteneur PostgreSQL

-- Création d'une base de données pour chaque service
CREATE DATABASE notesapp_auth;
CREATE DATABASE notesapp_users;
CREATE DATABASE notesapp_notes;
CREATE DATABASE notesapp_tags;


-- Accorder les autorisations à l'utilisateur de l'application Notes
GRANT ALL PRIVILEGES ON DATABASE notesapp_auth TO notesapp;
GRANT ALL PRIVILEGES ON DATABASE notesapp_users TO notesapp;
GRANT ALL PRIVILEGES ON DATABASE notesapp_notes TO notesapp;
GRANT ALL PRIVILEGES ON DATABASE notesapp_tags TO notesapp;