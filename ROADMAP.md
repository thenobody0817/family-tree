# Family Tree Research roadmap

The workspace redesign is a foundation. The following features need data migrations and
independent review before deployment to a family database.

## 1. Durable genealogy records

- Add normalized `events`, `places`, `person_names`, `sources`, `citations`, and
  `media` tables with versioned migration scripts for existing MariaDB databases.
- Give facts their own dates, source links, and uncertainty rather than encoding
  them in a person's free text notes. Preserve older JSON imports and export a
  versioned native backup containing every new record.
- Support several portraits and documents per person. Store media outside MariaDB
  with validation, size limits, and a backup manifest.
- Add adoption, foster, step, and guardianship links without changing the meaning
  of existing biological parent links.

## 2. Tree exploration

- Layout options for ancestors, descendants, pedigree, compact family, and fan
  views. Keep stored manual positions independent from generated layouts.
- Branch focus with configurable generations, a minimap for large trees, and a
  clear reset back to the full tree.
- In-place relative creation, keyboard navigation, and accessible touch controls.
- Better duplicate comparison and merge, with a reversible merge record.

## 3. Research and interchange

- Source-aware completeness and conflict queues, an event timeline, and a map of
  recorded places after place normalization/geocoding is available.
- Expand GEDCOM support beyond the current core fields, including name variants,
  citations, adoption, multimedia references, date qualifiers, and record-level
  provenance. Provide an import preview with conflict handling before replacement.
- Add region/branch selection, print page sizing, and media options to the SVG,
  PNG, and PDF export dialogs.

## 4. Reliable server editing

- Add optimistic revision numbers to every write and return a conflict when a
  record has changed since an editor loaded it.
- Store a server revision log to support undo and recovery for MariaDB mode.
- Add authenticated media access and consider push updates only after conflict
  handling is in place. Current polling remains useful for direct SQL edits.

## Deployment sequence

Merge each schema migration with its API and JSON interchange support. Export a
native JSON backup before applying migrations to an existing hosted database.
Deploy to the hosted PHP/MariaDB instance and the static GitHub Pages branch
separately; Pages does not run PHP.
