-- Certificates menu (Problem 3: Blockchain Challenge)
-- Adds the sidebar entries for certificate verification / issuance.
-- Admin sees everything automatically (backend bypasses permission checks
-- for role_id = 1). Teachers and Students only get the verify page;
-- issuing stays admin-only.
--
-- Run once:
--   psql -d school_mgmt -f seed_db/certificates-menu.sql
-- Safe to re-run (each INSERT skips when the row already exists).

-- Parent menu group
INSERT INTO access_controls (name, path, icon, parent_path, hierarchy_id, type)
SELECT 'Certificates', 'certificates_parent', 'certificates.svg', NULL, 8, 'menu-screen'
WHERE NOT EXISTS (SELECT 1 FROM access_controls WHERE path = 'certificates_parent');

-- Child: verify + list (everyone)
INSERT INTO access_controls (name, path, parent_path, hierarchy_id, type)
SELECT 'Verify Certificates', 'certificates', 'certificates_parent', 1, 'menu-screen'
WHERE NOT EXISTS (SELECT 1 FROM access_controls WHERE path = 'certificates');

-- Child: issue (admin only, so no permission rows below)
INSERT INTO access_controls (name, path, parent_path, hierarchy_id, type)
SELECT 'Issue Certificate', 'certificates/issue', 'certificates_parent', 2, 'menu-screen'
WHERE NOT EXISTS (SELECT 1 FROM access_controls WHERE path = 'certificates/issue');

-- Teachers and Students may verify / list only
INSERT INTO permissions (role_id, access_control_id)
SELECT 2, id FROM access_controls WHERE path = 'certificates_parent'
AND NOT EXISTS (
  SELECT 1 FROM permissions p JOIN access_controls ac ON ac.id = p.access_control_id
  WHERE p.role_id = 2 AND ac.path = 'certificates_parent'
);

INSERT INTO permissions (role_id, access_control_id)
SELECT 2, id FROM access_controls WHERE path = 'certificates'
AND NOT EXISTS (
  SELECT 1 FROM permissions p JOIN access_controls ac ON ac.id = p.access_control_id
  WHERE p.role_id = 2 AND ac.path = 'certificates'
);

INSERT INTO permissions (role_id, access_control_id)
SELECT 3, id FROM access_controls WHERE path = 'certificates_parent'
AND NOT EXISTS (
  SELECT 1 FROM permissions p JOIN access_controls ac ON ac.id = p.access_control_id
  WHERE p.role_id = 3 AND ac.path = 'certificates_parent'
);

INSERT INTO permissions (role_id, access_control_id)
SELECT 3, id FROM access_controls WHERE path = 'certificates'
AND NOT EXISTS (
  SELECT 1 FROM permissions p JOIN access_controls ac ON ac.id = p.access_control_id
  WHERE p.role_id = 3 AND ac.path = 'certificates'
);
