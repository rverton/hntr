CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE automations (
    id uuid DEFAULT uuid_generate_v4 (),
    name VARCHAR NOT NULL,
    box_id  uuid NOT NULL,
    command text NOT NULL,

    source_table text NOT NULL,
    source_tags text[],

    destination_table text NOT NULL,
    destination_tags text[],

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),

    CONSTRAINT fk_box
      FOREIGN KEY(box_id) 
	    REFERENCES boxes(id)
);
