#!/usr/bin/env bash
# Load db/seed.sql into the running Docker MariaDB.
# Usage:  ./scripts/seed.sh          (or: sudo ./scripts/seed.sh)
set -euo pipefail

cd "$(dirname "$0")/.."

DOCKER="${DOCKER:-docker}"
CONTAINER="${CONTAINER:-family-tree-db}"
DB="${DB:-family_tree}"
USER="${DB_USER:-family_tree}"
PASS="${DB_PASS:-family_tree}"

"$DOCKER" exec -i "$CONTAINER" mariadb -u"$USER" -p"$PASS" "$DB" < db/seed.sql
echo "Seeded $DB from db/seed.sql"
