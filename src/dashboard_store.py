import json
import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# dashboard_store.py jest w: Generator/src/
# .parent = Generator/src
# .parent.parent = Generator
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Docelowo: Generator/DB/
DB_DIR = PROJECT_ROOT / "DB"

# Tworzymy katalog, jeśli jeszcze nie istnieje.
# Jest potrzebny, aby SQLite mogło utworzyć dashboards.db.
DB_DIR.mkdir(parents=True, exist_ok=True)

DASH_DB_PATH = DB_DIR / "dashboards.db"



def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DASH_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_column(conn: sqlite3.Connection, name: str, definition: str) -> None:
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(dashboards)").fetchall()}
    if name not in columns:
        conn.execute(f"ALTER TABLE dashboards ADD COLUMN {name} {definition}")


def init_db() -> None:
    with _get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dashboards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id TEXT NOT NULL,
                name TEXT NOT NULL DEFAULT 'Untitled Dashboard',
                user_input TEXT NOT NULL,
                sql_queries TEXT NOT NULL,
                schema_text TEXT NOT NULL,
                masked_data TEXT NOT NULL DEFAULT '',
                pii_mapping TEXT NOT NULL DEFAULT '{}',
                openui_response TEXT NOT NULL,
                layout_nodes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        # Migration for an existing dashboards.db created before layout_nodes existed.
        _ensure_column(conn, "layout_nodes", "TEXT")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dashboards_owner ON dashboards(owner_id)")
    logger.info("Dashboard database initialised at %s", DASH_DB_PATH)


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    result = dict(row)
    for key, default in (("sql_queries", []), ("pii_mapping", {}), ("layout_nodes", None)):
        raw = result.get(key)
        if raw is None or raw == "":
            result[key] = default
            continue
        try:
            result[key] = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            result[key] = default
    return result


def save_dashboard(*, owner_id: str, name: str, user_input: str,
                   sql_queries: List[str], schema_text: str, masked_data: str,
                   pii_mapping: Dict[str, str], openui_response: str,
                   layout_nodes: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    now = _utcnow()
    with _get_conn() as conn:
        cursor = conn.execute(
            """
            INSERT INTO dashboards (
                owner_id, name, user_input, sql_queries, schema_text, masked_data,
                pii_mapping, openui_response, layout_nodes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                owner_id, name, user_input, json.dumps(sql_queries, ensure_ascii=False),
                schema_text, masked_data, json.dumps(pii_mapping, ensure_ascii=False),
                openui_response, json.dumps(layout_nodes or [], ensure_ascii=False), now, now,
            ),
        )
        dashboard_id = cursor.lastrowid
    return get_dashboard(dashboard_id, owner_id)  # type: ignore[return-value]


def get_dashboard(dashboard_id: int, owner_id: str) -> Optional[Dict[str, Any]]:
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM dashboards WHERE id = ? AND owner_id = ?", (dashboard_id, owner_id)
        ).fetchone()
    return _row_to_dict(row) if row is not None else None


def list_dashboards(owner_id: str, *, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    with _get_conn() as conn:
        rows = conn.execute(
            """
            SELECT id, owner_id, name, user_input, created_at, updated_at
            FROM dashboards WHERE owner_id = ?
            ORDER BY updated_at DESC LIMIT ? OFFSET ?
            """,
            (owner_id, limit, offset),
        ).fetchall()
    return [dict(row) for row in rows]


def update_dashboard(*, dashboard_id: int, owner_id: str, name: Optional[str] = None,
                     openui_response: Optional[str] = None,
                     sql_queries: Optional[List[str]] = None,
                     schema_text: Optional[str] = None,
                     masked_data: Optional[str] = None,
                     pii_mapping: Optional[Dict[str, str]] = None,
                     layout_nodes: Optional[List[Dict[str, Any]]] = None) -> Optional[Dict[str, Any]]:
    fields: List[str] = []
    values: List[Any] = []

    for field, value in (("name", name), ("openui_response", openui_response),
                         ("schema_text", schema_text), ("masked_data", masked_data)):
        if value is not None:
            fields.append(f"{field} = ?")
            values.append(value)

    if sql_queries is not None:
        fields.append("sql_queries = ?")
        values.append(json.dumps(sql_queries, ensure_ascii=False))
    if pii_mapping is not None:
        fields.append("pii_mapping = ?")
        values.append(json.dumps(pii_mapping, ensure_ascii=False))
    if layout_nodes is not None:
        fields.append("layout_nodes = ?")
        values.append(json.dumps(layout_nodes, ensure_ascii=False))

    if not fields:
        return get_dashboard(dashboard_id, owner_id)

    fields.append("updated_at = ?")
    values.append(_utcnow())
    values.extend((dashboard_id, owner_id))
    with _get_conn() as conn:
        cursor = conn.execute(
            f"UPDATE dashboards SET {', '.join(fields)} WHERE id = ? AND owner_id = ?", values
        )
        if cursor.rowcount == 0:
            return None
    return get_dashboard(dashboard_id, owner_id)


def delete_dashboard(dashboard_id: int, owner_id: str) -> bool:
    with _get_conn() as conn:
        cursor = conn.execute(
            "DELETE FROM dashboards WHERE id = ? AND owner_id = ?", (dashboard_id, owner_id)
        )
        return cursor.rowcount > 0
