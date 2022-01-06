CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE boxes (
    id          uuid DEFAULT uuid_generate_v4 (),
    name        VARCHAR(20) NOT NULL,
    containers  VARCHAR(20)[],

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);
