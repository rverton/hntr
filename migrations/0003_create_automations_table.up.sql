CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE automations (
    id                      uuid DEFAULT uuid_generate_v4 (),
    name                    VARCHAR NOT NULL,
    description             text NOT NULL,
    box_id                  uuid NOT NULL,
    command                 text NOT NULL,

    source_container        text NOT NULL,
    source_tags             text[],

    destination_container   text NOT NULL,
    destination_tags        text[],

    is_public               BOOL NOT NULL DEFAULT false,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),

    CONSTRAINT fk_box
      FOREIGN KEY(box_id) 
	    REFERENCES boxes(id)
);
