"""
Script 2: generate_assignments.py
=================================
Generates a project_assignments table that links employees to projects.
Each row = one employee assigned to one project, with a role and allocation.

Uses ONLY numpy and pandas.
Reads both the employee database and the generated projects table.

Run:  python generate_assignments.py
Inputs:
    - employees_international.csv  (employee base)
    - projects.csv                 (output of generate_projects.py)
Output:
    - project_assignments.csv

Date context: today is 2026-07-16. Assignment dates are consistent
with project start/end dates and employee hire/termination dates.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ──────────────────────────────────────────────
# 0. Configuration
# ──────────────────────────────────────────────
TODAY = datetime(2026, 7, 16)
EMPLOYEE_FILE = "employees_international.csv"
PROJECTS_FILE = "projects.csv"
OUTPUT_FILE = "project_assignments.csv"

np.random.seed(99)

# ──────────────────────────────────────────────
# 1. Load data
# ──────────────────────────────────────────────
emp = pd.read_csv(EMPLOYEE_FILE, encoding="utf-8-sig")
proj = pd.read_csv(PROJECTS_FILE, encoding="utf-8-sig")

# ──────────────────────────────────────────────
# 2. Prepare employee pool
# ──────────────────────────────────────────────
# Only employees who could plausibly be on a project:
#   - Not Terminated before the project started
#   - Hired before or during the project
# We'll filter per-project at assignment time.

# Parse date columns
emp["hire_date"] = pd.to_datetime(emp["hire_date"])
emp["termination_date"] = pd.to_datetime(emp["termination_date"], errors="coerce")

# ──────────────────────────────────────────────
# 3. Role definitions
# ──────────────────────────────────────────────
# Roles mapped to job levels for realistic assignment
ROLE_BY_LEVEL = {
    "junior":   ["Junior Developer", "Junior Analyst", "QA Tester", "Data Entry Clerk"],
    "mid":      ["Developer", "Business Analyst", "QA Specialist", "Data Analyst",
                 "Marketing Specialist", "Sales Representative"],
    "senior":   ["Senior Developer", "Senior Analyst", "QA Lead", "Data Scientist",
                 "Marketing Lead", "Sales Lead", "Solution Architect"],
    "lead":     ["Technical Lead", "Project Lead", "Functional Lead",
                 "Business Partner", "Subject Matter Expert"],
    "manager":  ["Project Manager", "Program Manager", "Delivery Manager",
                 "Stakeholder Manager"],
}

# Roles that make sense as "lead" on a project
LEAD_ROLES = ["Technical Lead", "Project Lead", "Functional Lead",
              "Project Manager", "Program Manager", "Delivery Manager",
              "Solution Architect", "QA Lead"]

# ──────────────────────────────────────────────
# 4. Generate assignments
# ──────────────────────────────────────────────
assignments = []
assignment_id = 1

for _, p in proj.iterrows():
    pid = p["project_id"]
    p_status = p["status"]
    p_start = pd.to_datetime(p["start_date"])
    p_planned_end = pd.to_datetime(p["planned_end_date"])
    p_actual_end = pd.to_datetime(p["actual_end_date"]) if p["actual_end_date"] else pd.NaT
    p_dept = p["department"]
    p_mgr = p["project_manager_id"]

    # --- Determine team size based on project type & status ---
    if p_status == "Planned":
        # Planned projects: small team being assembled
        team_size = int(np.random.randint(2, 5))
    elif p_status == "Cancelled":
        team_size = int(np.random.randint(2, 6))
    elif p_status == "Completed":
        team_size = int(np.random.randint(3, 12))
    elif p_status == "On Hold":
        team_size = int(np.random.randint(3, 8))
    else:  # Active
        team_size = int(np.random.randint(4, 15))

    # --- Filter eligible employees for this project ---
    eligible = emp[
        (emp["hire_date"] <= p_start + timedelta(days=90))  # hired around or before project start
        & (
            (emp["employment_status"] != "Terminated")
            | (emp["termination_date"].isna())
            | (emp["termination_date"] >= p_start)  # wasn't terminated before project started
        )
    ].copy()

    # Prefer same-department employees (70% chance), but allow cross-department (30%)
    same_dept = eligible[eligible["department"] == p_dept]
    other_dept = eligible[eligible["department"] != p_dept]

    # Build the team: sample from same dept first, fill from other dept
    team_ids = set()

    # Always include the project manager
    team_ids.add(p_mgr)

    # Try to fill from same department
    same_pool = same_dept[~same_dept["employee_id"].isin(team_ids)]
    n_same = min(len(same_pool), team_size - 1)
    if n_same > 0:
        sampled = same_pool.sample(n=n_same, replace=False)
        team_ids.update(sampled["employee_id"].tolist())

    # Fill remaining from other departments
    remaining = team_size - len(team_ids)
    if remaining > 0:
        other_pool = other_dept[~other_dept["employee_id"].isin(team_ids)]
        n_other = min(len(other_pool), remaining)
        if n_other > 0:
            sampled = other_pool.sample(n=n_other, replace=False)
            team_ids.update(sampled["employee_id"].tolist())

    # --- Create assignment rows for each team member ---
    for eid in team_ids:
        emp_row = emp[emp["employee_id"] == eid].iloc[0]
        level = emp_row["job_level"]

        # --- Role on project ---
        if eid == p_mgr:
            role = "Project Manager"
            is_lead = True
        else:
            possible_roles = ROLE_BY_LEVEL.get(level, ["Team Member"])
            # Exclude "Project Manager" — only the designated PM gets that role
            possible_roles = [r for r in possible_roles if r != "Project Manager"]
            if not possible_roles:
                possible_roles = ["Team Member"]
            role = np.random.choice(possible_roles)
            is_lead = role in LEAD_ROLES and np.random.random() < 0.5

        # --- Allocation percentage ---
        if role == "Project Manager":
            alloc = int(np.random.choice([50, 75, 100], p=[0.30, 0.40, 0.30]))
        elif is_lead:
            alloc = int(np.random.choice([50, 75, 100], p=[0.20, 0.50, 0.30]))
        elif level == "junior":
            alloc = int(np.random.choice([25, 50, 75, 100], p=[0.15, 0.35, 0.35, 0.15]))
        else:
            alloc = int(np.random.choice([25, 50, 75, 100], p=[0.25, 0.40, 0.25, 0.10]))

        # --- Assignment dates ---
        # Assigned: on or shortly after project start (or slightly before for manager/leads)
        if eid == p_mgr or is_lead:
            assigned_date = p_start - timedelta(days=int(np.random.randint(7, 30)))
        else:
            assigned_date = p_start + timedelta(days=int(np.random.randint(0, 45)))

        # Ensure assigned_date is not before employee's hire date
        emp_hire = emp_row["hire_date"]
        if assigned_date < emp_hire:
            assigned_date = emp_hire + timedelta(days=int(np.random.randint(0, 14)))

        # End date: consistent with project status
        if p_status == "Completed" and pd.notna(p_actual_end):
            end_date = p_actual_end + timedelta(days=int(np.random.randint(-10, 5)))
        elif p_status == "Cancelled":
            end_date = p_actual_end + timedelta(days=int(np.random.randint(-5, 5)))
        elif p_status in ("Active", "On Hold"):
            # Some members may have already left
            if np.random.random() < 0.15:
                end_date = TODAY - timedelta(days=int(np.random.randint(1, 120)))
            else:
                end_date = pd.NaT  # still on the project
        elif p_status == "Planned":
            end_date = pd.NaT  # not started yet
        else:
            end_date = pd.NaT

        # Ensure end_date is not after today (unless it's NaT)
        if pd.notna(end_date) and end_date > TODAY:
            end_date = TODAY

        # Ensure end_date is not before assigned_date
        if pd.notna(end_date) and end_date < assigned_date:
            end_date = assigned_date + timedelta(days=7)

        assignments.append({
            "assignment_id": assignment_id,
            "project_id": pid,
            "employee_id": int(eid),
            "role_on_project": role,
            "allocation_pct": alloc,
            "assigned_date": assigned_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d") if pd.notna(end_date) else "",
            "is_lead": is_lead,
        })
        assignment_id += 1

# ──────────────────────────────────────────────
# 5. Create DataFrame & save
# ──────────────────────────────────────────────
assign_df = pd.DataFrame(assignments)

assign_df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")

# ──────────────────────────────────────────────
# 6. Summary
# ──────────────────────────────────────────────
print(f"✓ Generated {len(assign_df)} project assignments → {OUTPUT_FILE}")
print(f"  Columns: {list(assign_df.columns)}")
print()
print("Assignments per project:")
print(assign_df.groupby("project_id").size().describe().to_string())
print()
print("Role distribution:")
print(assign_df["role_on_project"].value_counts().head(15).to_string())
print()
print("Allocation distribution:")
print(assign_df["allocation_pct"].value_counts().sort_index().to_string())
print()
print("Lead vs non-lead:")
print(assign_df["is_lead"].value_counts().to_string())
print()
print("Active assignments (no end date):")
print(f"  {len(assign_df[assign_df['end_date'] == ''])} out of {len(assign_df)}")
print()
print("Sample rows:")
print(assign_df.head(10).to_string(index=False))
