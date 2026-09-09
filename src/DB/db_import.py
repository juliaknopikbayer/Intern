import pandas as pd 
import sqlite3 

connection = sqlite3.connect("FLEX.db")

csv_files= {
"FLEX": "Flex-data/resources.csv"
# "employees": "employees_international.csv",
# "projects": "projects.csv",
# "project_assignments":"project_assignments.csv" 
}

for tab, file in csv_files.items():
    df = pd.read_csv(file)
    df.to_sql(tab, connection, if_exists="replace", index=False)
    print(f"File '{file}' saved as '{tab}'")

connection.close() 
print("Files imported. DB is ready")    
    




