module.exports = `
  
  CREATE TABLE IF NOT EXISTS Users (
        id integer NOT NULL PRIMARY KEY,
        login text NOT NULL UNIQUE,
        password text NOT NULL,
        email text NOT NULL UNIQUE,
        first_name text,
        last_name text
    );


`