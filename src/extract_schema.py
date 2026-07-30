import sqlite3 

def extract_schema(db_path:str):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor() 
    
    query = """
    
    SELECT sql 
    FROM sqlite_master
    WHERE sql IS NOT NULL
    AND name NOT LIKE 'sqlite_%' 
    ORDER BY type DESC, name ASC;
    
    
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    
    schema = ";\n\n".join(row[0] for row in rows) + ";"
    return schema
    
db_file = "DB/local_db.db"
schema_text = extract_schema(db_file)
print(schema_text)