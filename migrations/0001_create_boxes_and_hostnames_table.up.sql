CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE boxes (
    id          uuid DEFAULT uuid_generate_v4 (),
    name        VARCHAR NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TABLE hostnames (
    id          bigserial,
    hostname    VARCHAR NOT NULL,
    box_id      uuid NOT NULL,
    tags        text[],

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),

    UNIQUE(hostname, box_id),

    CONSTRAINT fk_box
      FOREIGN KEY(box_id) 
	    REFERENCES boxes(id)
);

CREATE INDEX idx_hostnames_box ON hostnames(box_id);
