CREATE TABLE automation_events (
    id uuid DEFAULT uuid_generate_v4 (),
    box_id          uuid NOT NULL,
    automation_id   uuid NOT NULL,

    status          text NOT NULL,
    data            text NOT NULL,
    affected_rows   int NOT NULL default 0,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,

    PRIMARY KEY (id),

    CONSTRAINT fk_box
      FOREIGN KEY(box_id) 
	    REFERENCES boxes(id),

    CONSTRAINT fk_automation
      FOREIGN KEY(automation_id) 
	    REFERENCES automations(id)
);
