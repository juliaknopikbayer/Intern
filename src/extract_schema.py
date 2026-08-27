# import sqlite3 

# def extract_schema(db_path:str):
    # conn = sqlite3.connect(db_path)
    # cursor = conn.cursor() 
    
    # query = """
    
    # SELECT sql 
    # FROM sqlite_master
    # WHERE sql IS NOT NULL
    # AND name NOT LIKE 'sqlite_%' 
    # ORDER BY type DESC, name ASC;
    
    
    # """
    # cursor.execute(query)
    # rows = cursor.fetchall()
    # conn.close()
    
    # schema = ";\n\n".join(row[0] for row in rows) + ";"
    # return schema
    
# db_file = "DB/local_db.db"
# schema_text = extract_schema(db_file)
# print(schema_text)


import sqlite3


def quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def format_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, str):
        return repr(value)
    return str(value)


def extract_schema(db_path: str, sample_limit: int = 3):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT name, sql
        FROM sqlite_master
        WHERE type = 'table'
          AND sql IS NOT NULL
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name ASC;
    """)
    tables = cursor.fetchall()

    result = []

    for table_name, create_sql in tables:
        result.append(create_sql + ";")
        result.append("-- sample values:")

        cursor.execute(f"PRAGMA table_info({quote_ident(table_name)})")
        columns = cursor.fetchall()

        for col in columns:
            col_name = col[1]

            sample_query = f"""
                SELECT DISTINCT {quote_ident(col_name)}
                FROM {quote_ident(table_name)}
                WHERE {quote_ident(col_name)} IS NOT NULL
                LIMIT {sample_limit}
            """
            cursor.execute(sample_query)
            samples = [format_value(row[0]) for row in cursor.fetchall()]

            if samples:
                result.append(f"--   {col_name}: {', '.join(samples)}")
            else:
                result.append(f"--   {col_name}: no sample values")

        result.append("")

    conn.close()
    return "\n".join(result)


db_file = "DB/local_db.db"
schema_text = extract_schema(db_file)
print(schema_text)
