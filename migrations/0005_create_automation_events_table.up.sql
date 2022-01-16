CREATE TABLE automation_events (
    id              uuid DEFAULT uuid_generate_v4 (),
    box_id          uuid NOT NULL,
    automation_id   uuid NOT NULL,

    status          text NOT NULL,
    data            text NOT NULL,
    affected_rows   int NOT NULL default 0,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,

    PRIMARY KEY (id),

    CONSTRAINT fk_box
      FOREIGN KEY(box_id) 
	    REFERENCES boxes(id) ON DELETE CASCADE,

    CONSTRAINT fk_automation
      FOREIGN KEY(automation_id) 
	    REFERENCES automations(id) ON DELETE CASCADE
);

CREATE INDEX idx_automation_events_boxid_automationid ON automation_events(box_id, automation_id);
CREATE INDEX idx_automation_events_boxid_status ON automation_events(box_id, status);
