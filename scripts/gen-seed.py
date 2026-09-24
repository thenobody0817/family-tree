#!/usr/bin/env python3
"""Generate the demo family dataset as both JSON and SQL.

Run from the repo root:  python3 scripts/gen-seed.py
Outputs:
  seed/family-tree-demo.json   (import via the app's Export/Import UI)
  db/seed.sql                  (load into MariaDB directly)
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def uid(n: int) -> str:
    return f"00000000-0000-4000-8000-{n:012d}"


# id, first, last, maiden, gender, bdate, bplace, ddate, dplace, occ, edu, eye, hair, notes, x, y
PEOPLE = [
    # ── Gen 1 ──────────────────────────────────────────────────────
    (1, "Jānis", "Bērziņš", None, "male", "1898", "Rīga", "1975", "Rīga",
     "Saimnieks", "Rīgas ģimnāzija", None, None, "Dzimis Pārdaugavā.", 100, 80),
    (2, "Anna", "Bērziņa", "Ozola", "female", "03/1901", "Rīga", "1980", "Rīga",
     "Mājturība", None, "zilas", "gaiši", None, 360, 80),
    (3, "Pēteris", "Kalniņš", None, "male", "15/06/1895", "Cēsis", "1968", "Cēsis",
     "Mežzinis", None, None, None, "Kalna muižas mežzinis.", 760, 80),
    (4, "Marija", "Kalniņa", "Liepa", "female", "1899", "Cēsis", "1972", "Cēsis",
     "Skolotāja", "Cēsu skolotāju seminārs", None, None, None, 1020, 80),
    # ── Gen 2 ──────────────────────────────────────────────────────
    (5, "Kārlis", "Bērziņš", None, "male", "1925", "Rīga", "05/2005", "Rīga",
     "Inženieris", "RTU", "pelēkas", "tumši", "Būvēja tiltus.", 100, 360),
    (6, "Elza", "Bērziņa", "Kalniņa", "female", "1928", "Cēsis", "2010", "Rīga",
     "Skolotāja", "LVU", None, None, None, 360, 360),
    (7, "Roberts", "Ozols", None, "male", "1930", "Liepāja", "1998", "Liepāja",
     "Zvejnieks", None, None, None, None, 760, 360),
    (8, "Ilga", "Ozola", "Krastiņa", "female", "1933", "Liepāja", None, None,
     "Šuvēja", None, "zaļas", "balti", None, 1020, 360),
    # ── Gen 3 ──────────────────────────────────────────────────────
    (9, "Jānis", "Bērziņš", None, "male", "1952", "Rīga", None, None,
     "Programmētājs", "LVU", None, None, None, 100, 640),
    (10, "Līga", "Bērziņa", "Ozola", "female", "1955", "Liepāja", None, None,
     "Ārste", "Rīgas Stradiņa universitāte", None, None, None, 360, 640),
    (11, "Andris", "Bērziņš", None, "male", "1956", "Rīga", None, None,
     "Būvinženieris", "RTU", None, None, None, 620, 640),
    (12, "Daina", "Bērziņa", "Ozola", "female", "1960", "Liepāja", "2018", "Rīga",
     "Grāmatvede", None, None, None, "Mirusi 2018. gadā.", 880, 640),
    (13, "Māra", "Zariņa", None, "female", "1958", "Valmiera", None, None,
     "Mūziķe", "JVLMA", None, None, "Bērnu audzinājusi viena.", 1140, 640),
    # ── Gen 4 ──────────────────────────────────────────────────────
    (14, "Kristaps", "Bērziņš", None, "male", "1978", "Rīga", None, None,
     "Arhitekts", "RTU", None, None, None, 100, 920),
    (15, "Ieva", "Bērziņa", None, "female", "1981", "Rīga", None, None,
     "Žurnāliste", "LU", None, None, None, 360, 920),
    (16, "Laila", "Zariņa", None, "female", "1985", "Valmiera", None, None,
     "Bioloģe", "LU", None, None, None, 620, 920),
    (17, "Rihards", "Bērziņš", None, "male", "1983", "Rīga", None, None,
     "Skaņu režisors", None, None, None, None, 880, 920),
    (18, "Anete", "Bērziņa", None, "female", "1987", "Rīga", None, None,
     "Vides speciāliste", "LLU", None, None, None, 1140, 920),
    (19, "Emīls", "Bērziņš", None, "male", "1990", "Rīga", None, None,
     "Ekonomists", "SSE Rīga", None, None, None, 1400, 920),
    # ── Gen 5 ──────────────────────────────────────────────────────
    (20, "Alise", "Bērziņa", "Vītola", "female", "1980", "Jūrmala", None, None,
     "Dizainere", None, None, None, None, 100, 1200),
    (21, "Marta", "Bērziņa", None, "female", "2010", "Rīga", None, None,
     "Skolniece", None, None, None, None, 360, 1200),
    # ── Unassigned research lead (no canvas position) ──────────────
    (22, "Voldemārs", "Bērziņš", None, "male", "1935", "Rīga", None, None,
     None, None, None, None, "Iespējams, Kārļa brālēns — jāpārbauda.", None, None),
]

# Extra fictional research details for the sample. Death and maiden-name fields
# remain empty when they do not apply.
BIO = {
    1: dict(eye_color="brūnas", hair_color="tumši brūni", notes="Pārdaugavas saimnieks; saglabājušās saimniecības piezīmes."),
    2: dict(education="Rīgas mājturības kursi", hair_color="gaiši brūni", notes="Vadīja mājsaimniecību un pierakstīja ģimenes receptes."),
    3: dict(education="Cēsu ģimnāzija", eye_color="pelēkas", hair_color="sirmi", notes="Strādāja Kalna muižas mežniecībā."),
    4: dict(eye_color="zaļas", hair_color="tumši brūni", notes="Mācīja latviešu valodu Cēsu apkārtnē."),
    5: dict(education="Rīgas Politehniskais institūts", hair_color="sirmi", notes="Projektēja tiltus un saglabāja skiču albumu."),
    6: dict(eye_color="brūnas", hair_color="gaiši brūni", notes="Mācīja sākumskolā; pārcēlās uz Rīgu pēc laulībām."),
    7: dict(education="Liepājas arodskola", eye_color="zilas", hair_color="tumši", notes="Strādāja zvejas ostā un glabāja kuģu fotogrāfijas."),
    8: dict(education="Liepājas amatniecības kursi", hair_color="sirmi", notes="Šuva apģērbu ģimenei un kaimiņiem."),
    9: dict(eye_color="brūnas", hair_color="tumši", notes="Piedalījās agrīnu datorprogrammu ieviešanā Rīgā."),
    10: dict(eye_color="zaļas", hair_color="gaiši brūni", notes="Strādāja ģimenes ārstes praksē."),
    11: dict(eye_color="pelēkas", hair_color="tumši", notes="Projektēja dzīvojamās ēkas un glabāja rasējumus."),
    12: dict(education="Rīgas finanšu tehnikums", eye_color="zilas", hair_color="brūni", notes="Veda grāmatvedību; ģimenei saglabātas vēstules."),
    13: dict(eye_color="brūnas", hair_color="tumši", notes="Māca klavierspēli; Lailu audzināja viena."),
    14: dict(eye_color="zilas", hair_color="brūni", notes="Projektē publiskās ēkas un interesējas par ģimenes vēsturi."),
    15: dict(eye_color="zaļas", hair_color="gaiši", notes="Raksta par kultūru un glabā interviju ierakstus."),
    16: dict(eye_color="brūnas", hair_color="tumši brūni", notes="Pēta piekrastes augus un veido lauka piezīmes."),
    17: dict(education="Rīgas Doma kora skola", eye_color="pelēkas", hair_color="tumši", notes="Ieraksta mūziku un digitalizē vecās ģimenes lentes."),
    18: dict(eye_color="zilas", hair_color="gaiši brūni", notes="Strādā vides izglītības projektos."),
    19: dict(eye_color="brūnas", hair_color="tumši", notes="Analizē ekonomikas datus; dzīvo Rīgā."),
    20: dict(education="Latvijas Mākslas akadēmija", eye_color="zaļas", hair_color="rudi", notes="Veido grāmatu dizainu un ģimenes fotogrāfiju albumus."),
    21: dict(education="Rīgas vidusskola", eye_color="zilas", hair_color="gaiši brūni", notes="Mācās vidusskolā; interesējas par zīmēšanu."),
    22: dict(occupation="Dzelzceļa darbinieks", education="Rīgas arodskola", eye_color="pelēkas", hair_color="sirmi", death_date="2015", death_place="Rīga", notes="Iespējams, Kārļa brālēns; radniecības saite vēl jāpārbauda."),
}

# id, p1, p2, rel_type, start_date, start_place, status, end_date, end_place
COUPLES = [
    (1, 1, 2, "married", "1922", "Rīga", "active", None, None),
    (2, 3, 4, "married", "1920", "Cēsis", "active", None, None),
    (3, 5, 6, "married", "1950", "Rīga", "active", None, None),
    (4, 7, 8, "married", "1952", "Liepāja", "active", None, None),
    (5, 9, 10, "married", "1976", "Rīga", "divorced", "1990", "Rīga"),
    (6, 11, 12, "married", "1980", "Rīga", "widowed", "2018", "Rīga"),
    (7, 14, 20, "married", "2005", "Rīga", "active", None, None),
]

# parent_id, child_id, couple_id (None => solo parent)
PARENT_CHILD = [
    (1, 5, 1),
    (3, 6, 2),
    (5, 9, 3), (5, 11, 3),
    (7, 10, 4), (7, 12, 4),
    (9, 14, 5), (9, 15, 5),
    (11, 17, 6), (11, 18, 6), (11, 19, 6),
    (14, 21, 7),
    (13, 16, None),  # solo parent
]

COUPLE_LINE_COLORS = ["#2563eb", "#1d4ed8", "#3b82f6", "#1e40af", "#60a5fa", "#1e3a8a", "#93c5fd"]

def person_row(p):
    (n, fn, ln, mn, g, bd, bp, dd, dp, occ, edu, eye, hair, notes, x, y) = p
    row = {
        "id": uid(n), "first_name": fn, "last_name": ln, "maiden_name": mn,
        "gender": g, "birth_date": bd, "birth_place": bp,
        "death_date": dd, "death_place": dp,
        "occupation": occ, "education": edu,
        "eye_color": eye, "hair_color": hair, "notes": notes,
        "canvas_x": x, "canvas_y": y,
    }
    row.update(BIO.get(n, {}))
    return row


def couple_row(c):
    (n, p1, p2, rt, sd, sp, st, ed, ep) = c
    return {
        "id": uid(100 + n), "person1_id": uid(p1), "person2_id": uid(p2),
        "rel_type": rt, "start_date": sd, "start_place": sp,
        "status": st, "end_date": ed, "end_place": ep,
        "line_color": COUPLE_LINE_COLORS[(n - 1) % len(COUPLE_LINE_COLORS)],
    }


def pc_row(i, pc):
    (pid, cid, couple) = pc
    return {
        "id": uid(200 + i), "parent_id": uid(pid), "child_id": uid(cid),
        "couple_id": uid(100 + couple) if couple else None,
    }


def sql_str(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"


def sql_num(v):
    return "NULL" if v is None else str(v)


def main():
    persons = [person_row(p) for p in PEOPLE]
    couples = [couple_row(c) for c in COUPLES]
    pcs = [pc_row(i, pc) for i, pc in enumerate(PARENT_CHILD, start=1)]

    payload = {
        "format": "family-tree",
        "version": 1,
        "exported_at": "2026-09-24T00:00:00.000Z",
        "persons": persons,
        "couples": couples,
        "parent_child": pcs,
    }

    seed_dir = os.path.join(ROOT, "seed")
    os.makedirs(seed_dir, exist_ok=True)
    with open(os.path.join(seed_dir, "family-tree-demo.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # Also ship a copy with the frontend so the static (GitHub Pages) demo can
    # load it via the "Sample" button.
    public_dir = os.path.join(ROOT, "public")
    os.makedirs(public_dir, exist_ok=True)
    with open(os.path.join(public_dir, "family-tree-demo.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    lines = [
        "-- ═══════════════════════════════════════════════════════════",
        "-- Family Tree Research — demo seed data (Latvian family)",
        f"-- {len(persons)} persons, {len(couples)} couples, {len(pcs)} parent-child links",
        "-- Load:  docker exec -i family-tree-db mariadb -ufamily_tree \\",
        "--          -pfamily_tree family_tree < db/seed.sql",
        "-- ═══════════════════════════════════════════════════════════",
        "SET NAMES utf8mb4;",
        "SET FOREIGN_KEY_CHECKS = 0;",
        "DELETE FROM `parent_child`;",
        "DELETE FROM `couples`;",
        "DELETE FROM `persons`;",
        "SET FOREIGN_KEY_CHECKS = 1;",
        "",
        "-- ── PERSONS ────────────────────────────────────────────────",
        "INSERT INTO `persons`",
        "  (`id`,`first_name`,`last_name`,`maiden_name`,`gender`,",
        "   `birth_date`,`birth_place`,`death_date`,`death_place`,",
        "   `occupation`,`education`,`eye_color`,`hair_color`,`notes`,",
        "   `canvas_x`,`canvas_y`) VALUES",
    ]
    rows = []
    for p in persons:
        rows.append(
            "(" + ", ".join([
                sql_str(p["id"]), sql_str(p["first_name"]), sql_str(p["last_name"]),
                sql_str(p["maiden_name"]), sql_str(p["gender"]),
                sql_str(p["birth_date"]), sql_str(p["birth_place"]),
                sql_str(p["death_date"]), sql_str(p["death_place"]),
                sql_str(p["occupation"]), sql_str(p["education"]),
                sql_str(p["eye_color"]), sql_str(p["hair_color"]), sql_str(p["notes"]),
                sql_num(p["canvas_x"]), sql_num(p["canvas_y"]),
            ]) + ")"
        )
    lines.append(",\n".join(rows) + ";")

    lines += [
        "",
        "-- ── COUPLES ────────────────────────────────────────────────",
        "INSERT INTO `couples`",
        "  (`id`,`person1_id`,`person2_id`,`rel_type`,`start_date`,`start_place`,",
        "   `status`,`end_date`,`end_place`,`line_color`) VALUES",
    ]
    rows = []
    for c in couples:
        rows.append(
            "(" + ", ".join([
                sql_str(c["id"]), sql_str(c["person1_id"]), sql_str(c["person2_id"]),
                sql_str(c["rel_type"]), sql_str(c["start_date"]), sql_str(c["start_place"]),
                sql_str(c["status"]), sql_str(c["end_date"]), sql_str(c["end_place"]),
                sql_str(c["line_color"]),
            ]) + ")"
        )
    lines.append(",\n".join(rows) + ";")

    lines += [
        "",
        "-- ── PARENT_CHILD ───────────────────────────────────────────",
        "INSERT INTO `parent_child` (`id`,`parent_id`,`child_id`,`couple_id`) VALUES",
    ]
    rows = []
    for pc in pcs:
        rows.append(
            "(" + ", ".join([
                sql_str(pc["id"]), sql_str(pc["parent_id"]),
                sql_str(pc["child_id"]), sql_str(pc["couple_id"]),
            ]) + ")"
        )
    lines.append(",\n".join(rows) + ";")
    lines.append("")

    with open(os.path.join(ROOT, "db", "seed.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Wrote seed/family-tree-demo.json and db/seed.sql "
          f"({len(persons)} persons, {len(couples)} couples, {len(pcs)} parent_child)")


if __name__ == "__main__":
    main()
