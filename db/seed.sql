-- ═══════════════════════════════════════════════════════════
-- Family Tree Research — demo seed data (Latvian family)
-- 22 persons, 7 couples, 13 parent-child links
-- Load:  docker exec -i family-tree-db mariadb -ufamily_tree \
--          -pfamily_tree family_tree < db/seed.sql
-- ═══════════════════════════════════════════════════════════
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `parent_child`;
DELETE FROM `couples`;
DELETE FROM `persons`;
SET FOREIGN_KEY_CHECKS = 1;

-- ── PERSONS ────────────────────────────────────────────────
INSERT INTO `persons`
  (`id`,`first_name`,`last_name`,`maiden_name`,`gender`,
   `birth_date`,`birth_place`,`death_date`,`death_place`,
   `occupation`,`education`,`eye_color`,`hair_color`,`notes`,
   `canvas_x`,`canvas_y`) VALUES
('00000000-0000-4000-8000-000000000001', 'Jānis', 'Bērziņš', NULL, 'male', '1898', 'Rīga', '1975', 'Rīga', 'Saimnieks', 'Rīgas ģimnāzija', 'brūnas', 'tumši brūni', 'Pārdaugavas saimnieks; saglabājušās saimniecības piezīmes.', 100, 80),
('00000000-0000-4000-8000-000000000002', 'Anna', 'Bērziņa', 'Ozola', 'female', '03/1901', 'Rīga', '1980', 'Rīga', 'Mājturība', 'Rīgas mājturības kursi', 'zilas', 'gaiši brūni', 'Vadīja mājsaimniecību un pierakstīja ģimenes receptes.', 360, 80),
('00000000-0000-4000-8000-000000000003', 'Pēteris', 'Kalniņš', NULL, 'male', '15/06/1895', 'Cēsis', '1968', 'Cēsis', 'Mežzinis', 'Cēsu ģimnāzija', 'pelēkas', 'sirmi', 'Strādāja Kalna muižas mežniecībā.', 760, 80),
('00000000-0000-4000-8000-000000000004', 'Marija', 'Kalniņa', 'Liepa', 'female', '1899', 'Cēsis', '1972', 'Cēsis', 'Skolotāja', 'Cēsu skolotāju seminārs', 'zaļas', 'tumši brūni', 'Mācīja latviešu valodu Cēsu apkārtnē.', 1020, 80),
('00000000-0000-4000-8000-000000000005', 'Kārlis', 'Bērziņš', NULL, 'male', '1925', 'Rīga', '05/2005', 'Rīga', 'Inženieris', 'Rīgas Politehniskais institūts', 'pelēkas', 'sirmi', 'Projektēja tiltus un saglabāja skiču albumu.', 100, 360),
('00000000-0000-4000-8000-000000000006', 'Elza', 'Bērziņa', 'Kalniņa', 'female', '1928', 'Cēsis', '2010', 'Rīga', 'Skolotāja', 'LVU', 'brūnas', 'gaiši brūni', 'Mācīja sākumskolā; pārcēlās uz Rīgu pēc laulībām.', 360, 360),
('00000000-0000-4000-8000-000000000007', 'Roberts', 'Ozols', NULL, 'male', '1930', 'Liepāja', '1998', 'Liepāja', 'Zvejnieks', 'Liepājas arodskola', 'zilas', 'tumši', 'Strādāja zvejas ostā un glabāja kuģu fotogrāfijas.', 760, 360),
('00000000-0000-4000-8000-000000000008', 'Ilga', 'Ozola', 'Krastiņa', 'female', '1933', 'Liepāja', NULL, NULL, 'Šuvēja', 'Liepājas amatniecības kursi', 'zaļas', 'sirmi', 'Šuva apģērbu ģimenei un kaimiņiem.', 1020, 360),
('00000000-0000-4000-8000-000000000009', 'Jānis', 'Bērziņš', NULL, 'male', '1952', 'Rīga', NULL, NULL, 'Programmētājs', 'LVU', 'brūnas', 'tumši', 'Piedalījās agrīnu datorprogrammu ieviešanā Rīgā.', 100, 640),
('00000000-0000-4000-8000-000000000010', 'Līga', 'Bērziņa', 'Ozola', 'female', '1955', 'Liepāja', NULL, NULL, 'Ārste', 'Rīgas Stradiņa universitāte', 'zaļas', 'gaiši brūni', 'Strādāja ģimenes ārstes praksē.', 360, 640),
('00000000-0000-4000-8000-000000000011', 'Andris', 'Bērziņš', NULL, 'male', '1956', 'Rīga', NULL, NULL, 'Būvinženieris', 'RTU', 'pelēkas', 'tumši', 'Projektēja dzīvojamās ēkas un glabāja rasējumus.', 620, 640),
('00000000-0000-4000-8000-000000000012', 'Daina', 'Bērziņa', 'Ozola', 'female', '1960', 'Liepāja', '2018', 'Rīga', 'Grāmatvede', 'Rīgas finanšu tehnikums', 'zilas', 'brūni', 'Veda grāmatvedību; ģimenei saglabātas vēstules.', 880, 640),
('00000000-0000-4000-8000-000000000013', 'Māra', 'Zariņa', NULL, 'female', '1958', 'Valmiera', NULL, NULL, 'Mūziķe', 'JVLMA', 'brūnas', 'tumši', 'Māca klavierspēli; Lailu audzināja viena.', 1140, 640),
('00000000-0000-4000-8000-000000000014', 'Kristaps', 'Bērziņš', NULL, 'male', '1978', 'Rīga', NULL, NULL, 'Arhitekts', 'RTU', 'zilas', 'brūni', 'Projektē publiskās ēkas un interesējas par ģimenes vēsturi.', 100, 920),
('00000000-0000-4000-8000-000000000015', 'Ieva', 'Bērziņa', NULL, 'female', '1981', 'Rīga', NULL, NULL, 'Žurnāliste', 'LU', 'zaļas', 'gaiši', 'Raksta par kultūru un glabā interviju ierakstus.', 360, 920),
('00000000-0000-4000-8000-000000000016', 'Laila', 'Zariņa', NULL, 'female', '1985', 'Valmiera', NULL, NULL, 'Bioloģe', 'LU', 'brūnas', 'tumši brūni', 'Pēta piekrastes augus un veido lauka piezīmes.', 620, 920),
('00000000-0000-4000-8000-000000000017', 'Rihards', 'Bērziņš', NULL, 'male', '1983', 'Rīga', NULL, NULL, 'Skaņu režisors', 'Rīgas Doma kora skola', 'pelēkas', 'tumši', 'Ieraksta mūziku un digitalizē vecās ģimenes lentes.', 880, 920),
('00000000-0000-4000-8000-000000000018', 'Anete', 'Bērziņa', NULL, 'female', '1987', 'Rīga', NULL, NULL, 'Vides speciāliste', 'LLU', 'zilas', 'gaiši brūni', 'Strādā vides izglītības projektos.', 1140, 920),
('00000000-0000-4000-8000-000000000019', 'Emīls', 'Bērziņš', NULL, 'male', '1990', 'Rīga', NULL, NULL, 'Ekonomists', 'SSE Rīga', 'brūnas', 'tumši', 'Analizē ekonomikas datus; dzīvo Rīgā.', 1400, 920),
('00000000-0000-4000-8000-000000000020', 'Alise', 'Bērziņa', 'Vītola', 'female', '1980', 'Jūrmala', NULL, NULL, 'Dizainere', 'Latvijas Mākslas akadēmija', 'zaļas', 'rudi', 'Veido grāmatu dizainu un ģimenes fotogrāfiju albumus.', 100, 1200),
('00000000-0000-4000-8000-000000000021', 'Marta', 'Bērziņa', NULL, 'female', '2010', 'Rīga', NULL, NULL, 'Skolniece', 'Rīgas vidusskola', 'zilas', 'gaiši brūni', 'Mācās vidusskolā; interesējas par zīmēšanu.', 360, 1200),
('00000000-0000-4000-8000-000000000022', 'Voldemārs', 'Bērziņš', NULL, 'male', '1935', 'Rīga', '2015', 'Rīga', 'Dzelzceļa darbinieks', 'Rīgas arodskola', 'pelēkas', 'sirmi', 'Iespējams, Kārļa brālēns; radniecības saite vēl jāpārbauda.', NULL, NULL);

-- ── COUPLES ────────────────────────────────────────────────
INSERT INTO `couples`
  (`id`,`person1_id`,`person2_id`,`rel_type`,`start_date`,`start_place`,
   `status`,`end_date`,`end_place`,`line_color`) VALUES
('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'married', '1922', 'Rīga', 'active', NULL, NULL, '#2563eb'),
('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004', 'married', '1920', 'Cēsis', 'active', NULL, NULL, '#1d4ed8'),
('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000006', 'married', '1950', 'Rīga', 'active', NULL, NULL, '#3b82f6'),
('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000008', 'married', '1952', 'Liepāja', 'active', NULL, NULL, '#1e40af'),
('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000010', 'married', '1976', 'Rīga', 'divorced', '1990', 'Rīga', '#60a5fa'),
('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000012', 'married', '1980', 'Rīga', 'widowed', '2018', 'Rīga', '#1e3a8a'),
('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000020', 'married', '2005', 'Rīga', 'active', NULL, NULL, '#93c5fd');

-- ── PARENT_CHILD ───────────────────────────────────────────
INSERT INTO `parent_child` (`id`,`parent_id`,`child_id`,`couple_id`) VALUES
('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000101'),
('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000102'),
('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000103'),
('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000103'),
('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000104'),
('00000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000104'),
('00000000-0000-4000-8000-000000000207', '00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000105'),
('00000000-0000-4000-8000-000000000208', '00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000105'),
('00000000-0000-4000-8000-000000000209', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000106'),
('00000000-0000-4000-8000-000000000210', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000106'),
('00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000106'),
('00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000107'),
('00000000-0000-4000-8000-000000000213', '00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000016', NULL);
