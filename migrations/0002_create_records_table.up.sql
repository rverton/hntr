CREATE TABLE records (
    data            VARCHAR(250) NOT NULL,
    tags            VARCHAR(50)[],

    box_id          uuid NOT NULL,
    container       varchar(20) NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (box_id, container, data),

    CONSTRAINT fk_box
      FOREIGN KEY(box_id) 
	    REFERENCES boxes(id)
);

CREATE INDEX idx_containers_box_type ON records(box_id, container);
