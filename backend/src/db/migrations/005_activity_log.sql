CREATE TABLE activity_log (
  id          INTEGER PRIMARY KEY,
  user_id     INTEGER,
  username    TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  old_values  TEXT,
  new_values  TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_activity_created ON activity_log(created_at);
CREATE INDEX idx_activity_user    ON activity_log(user_id);
CREATE INDEX idx_activity_action  ON activity_log(action);