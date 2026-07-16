"""
Script 1: generate_projects.py
==============================
Generates a synthetic projects table (30 projects) and saves it to projects.csv.

Uses ONLY numpy and pandas.
Reads the existing employee database to ensure consistency
(departments, countries, currencies, manager IDs).

Run:  python generate_projects.py
Input: employees_international.csv  (in the same directory)
Output: projects.csv

Date context: today is 2026-07-16. All dates and statuses are generated
to be logically consistent with this date.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ──────────────────────────────────────────────
# 0. Configuration
# ──────────────────────────────────────────────
TODAY = datetime(2026, 7, 16)
NUM_PROJECTS = 30
EMPLOYEE_FILE = "employees_international.csv"
OUTPUT_FILE = "projects.csv"

np.random.seed(42)

# ──────────────────────────────────────────────
# 1. Load employee data for consistency
# ──────────────────────────────────────────────
emp = pd.read_csv(EMPLOYEE_FILE, encoding="utf-8-sig")

# Eligible managers: Active, senior/manager level
eligible_managers = emp[
    (emp["employment_status"] == "Active")
    & (emp["job_level"].isin(["senior", "manager", "lead"]))
].copy()

# Eligible sponsors: Active, manager level (higher bar)
eligible_sponsors = emp[
    (emp["employment_status"] == "Active")
    & (emp["job_level"].isin(["manager", "lead"]))
].copy()

# Unique departments / countries / currencies from the employee base
DEPARTMENTS = sorted(emp["department"].dropna().unique())
COUNTRIES = sorted(emp["country"].dropna().unique())
CURRENCIES = sorted(emp["currency"].dropna().unique())

# ──────────────────────────────────────────────
# 2. Reference data for realistic projects
# ──────────────────────────────────────────────
PROJECT_TYPES = ["Internal", "Client", "R&D", "Infrastructure", "Compliance"]
PRIORITIES = ["Low", "Medium", "High", "Critical"]
STATUSES = ["Planned", "Active", "On Hold", "Completed", "Cancelled"]
HEALTH_STATUS = ["Green", "Amber", "Red"]
RISK_LEVELS = ["Low", "Medium", "High"]

# Project name templates by department
PROJECT_NAME_TEMPLATES = {
    "IT": [
        "Cloud Migration Phase {n}", "ERP System Upgrade", "Cybersecurity Hardening",
        "Data Warehouse Build", "Mobile App Redesign", "API Gateway Implementation",
        "DevOps Pipeline Automation", "Legacy System Decommission",
    ],
    "Finance": [
        "IFRS 17 Compliance", "Treasury System Migration", "Budget Forecast Model",
        "Payment Gateway Integration", "Financial Reporting Automation",
        "Tax Optimization Initiative",
    ],
    "HR": [
        "HRIS Platform Rollout", "Global Compensation Review", "Learning Management System",
        "Employee Engagement Survey", "Diversity & Inclusion Program",
    ],
    "Marketing": [
        "Brand Refresh Campaign", "Digital Marketing Platform", "Customer Segmentation Model",
        "Social Media Strategy Overhaul", "Marketing Analytics Dashboard",
    ],
    "Sales": [
        "CRM Migration", "Sales Enablement Platform", "Channel Partner Portal",
        "Pricing Strategy Overhaul", "Territory Realignment",
    ],
    "Operations": [
        "Supply Chain Optimization", "Warehouse Automation", "Lean Process Improvement",
        "Inventory Management System", "Logistics Route Planning",
    ],
    "Legal": [
        "GDPR Audit & Remediation", "Contract Lifecycle Management",
        "Regulatory Filing Automation", "IP Portfolio Review",
    ],
    "Logistics": [
        "Fleet Management System", "Last-Mile Delivery Optimization",
        "Customs Compliance Framework", "Cold Chain Monitoring",
    ],
}

# Technology tags by department
TECH_TAGS = {
    "IT": "AWS, Kubernetes, Python, React, PostgreSQL, Docker",
    "Finance": "SAP, Power BI, SQL, Tableau, Python",
    "HR": "Workday, SuccessFactors, Power BI",
    "Marketing": "Salesforce, HubSpot, Google Analytics, Figma",
    "Sales": "Salesforce, Power BI, Excel, Python",
    "Operations": "SAP, Python, Power BI, IoT",
    "Legal": "DocuSign, SharePoint, Power Automate",
    "Logistics": "SAP, IoT, Python, GPS Tracking, RFID",
}

# Client names (for Client-type projects)
CLIENT_NAMES = [
    "Acme Corp", "Globex Inc", "Initech", "Umbrella Ltd", "Wayne Enterprises",
    "Stark Industries", "Wonka Industries", "Cyberdyne Systems",
    "Massive Dynamic", "Aperture Science", "Black Mesa", "Randall Corp",
]

# ──────────────────────────────────────────────
# 3. Generate project records
# ──────────────────────────────────────────────
rows = []
used_names = set()

for i in range(1, NUM_PROJECTS + 1):
    # --- Department (weighted toward IT, Sales, Operations) ---
    dept_probs = [0.25, 0.10, 0.12, 0.08, 0.15, 0.12, 0.10, 0.08]
    dept = np.random.choice(DEPARTMENTS, p=dept_probs)

    # --- Project name (unique) ---
    name_pool = PROJECT_NAME_TEMPLATES.get(dept, ["Strategic Initiative {n}"])
    attempts = 0
    while attempts < 50:
        candidate = np.random.choice(name_pool).replace("{n}", str(np.random.randint(1, 5)))
        if candidate not in used_names:
            used_names.add(candidate)
            project_name = candidate
            break
        attempts += 1
    else:
        project_name = f"{dept} Initiative {i}"

    # --- Project type ---
    ptype = np.random.choice(
        PROJECT_TYPES,
        p=[0.30, 0.30, 0.15, 0.15, 0.10],
    )

    # --- Dates: logically consistent with TODAY = 2026-07-16 ---
    # Spread start dates from 2023-01-01 to 2027-06-30
    earliest_start = datetime(2023, 1, 1)
    latest_start = datetime(2027, 6, 30)
    start_date = earliest_start + timedelta(
        days=int(np.random.randint(0, (latest_start - earliest_start).days))
    )

    # Duration: 30 to 540 days
    duration = int(np.random.randint(30, 540))
    planned_end = start_date + timedelta(days=duration)

    # --- Status: must be consistent with dates ---
    if start_date > TODAY:
        # Future project → must be Planned
        status = "Planned"
        actual_end = pd.NaT
        progress = 0
    elif planned_end < TODAY:
        # Past planned end → likely Completed or Cancelled
        roll = np.random.random()
        if roll < 0.75:
            status = "Completed"
            # Actual end: within ±30 days of planned end
            actual_end = planned_end + timedelta(days=int(np.random.randint(-20, 30)))
            actual_end = min(actual_end, TODAY)
            progress = 100
        elif roll < 0.90:
            status = "Cancelled"
            actual_end = planned_end + timedelta(days=int(np.random.randint(-30, 0)))
            actual_end = min(actual_end, TODAY)
            progress = int(np.random.randint(10, 60))
        else:
            # Overrun — still Active past planned end
            status = "Active"
            actual_end = pd.NaT
            progress = int(np.random.randint(70, 95))
    else:
        # Currently within planned window → Active or On Hold
        roll = np.random.random()
        if roll < 0.80:
            status = "Active"
        elif roll < 0.90:
            status = "On Hold"
        else:
            status = "Planned"  # delayed start
        actual_end = pd.NaT
        # Progress proportional to elapsed time
        if status == "Active":
            elapsed = (TODAY - start_date).days
            progress = min(int(elapsed / duration * 100), 95)
            progress = max(progress, int(np.random.randint(5, 20)))  # floor
        elif status == "On Hold":
            progress = int(np.random.randint(20, 70))
        else:
            progress = 0

    # --- Priority ---
    priority = np.random.choice(
        PRIORITIES,
        p=[0.20, 0.40, 0.30, 0.10],
    )

    # --- Health / RAG status (consistent with progress & status) ---
    if status == "Completed":
        health = "Green"
    elif status == "Cancelled":
        health = "Red"
    elif status == "On Hold":
        health = "Amber"
    elif status == "Planned":
        health = "Green"
    elif progress >= 75:
        health = np.random.choice(["Green", "Amber"], p=[0.70, 0.30])
    elif progress >= 40:
        health = np.random.choice(["Green", "Amber", "Red"], p=[0.40, 0.45, 0.15])
    else:
        health = np.random.choice(["Amber", "Red"], p=[0.55, 0.45])

    # --- Risk level ---
    risk = np.random.choice(
        RISK_LEVELS,
        p=[0.45, 0.40, 0.15],
    )

    # --- Budget (varies by project type) ---
    if ptype in ("Client", "R&D"):
        budget = int(np.random.uniform(150_000, 2_500_000))
    elif ptype == "Infrastructure":
        budget = int(np.random.uniform(200_000, 3_000_000))
    elif ptype == "Compliance":
        budget = int(np.random.uniform(50_000, 500_000))
    else:  # Internal
        budget = int(np.random.uniform(20_000, 800_000))

    # Actual cost: depends on progress
    if status == "Completed":
        actual_cost = int(budget * np.random.uniform(0.85, 1.15))
    elif status == "Cancelled":
        actual_cost = int(budget * np.random.uniform(0.10, 0.50))
    elif status == "Planned":
        actual_cost = 0
    else:  # Active / On Hold
        actual_cost = int(budget * (progress / 100) * np.random.uniform(0.80, 1.20))

    # --- Currency & country: pick from employee base ---
    # Prefer the manager's country/currency for consistency
    mgr_candidates = eligible_managers[eligible_managers["department"] == dept]
    if len(mgr_candidates) == 0:
        mgr_candidates = eligible_managers

    mgr_row = mgr_candidates.sample(1).iloc[0]
    project_manager_id = int(mgr_row["employee_id"])
    currency = mgr_row["currency"]
    country = mgr_row["country"]
    city = mgr_row["city"]
    office_id = int(mgr_row["office_id"])

    # Sponsor (from a different department or same, higher level)
    sponsor_row = eligible_sponsors.sample(1).iloc[0]
    sponsor_id = int(sponsor_row["employee_id"])

    # --- Client name (only for Client projects) ---
    client_name = np.random.choice(CLIENT_NAMES) if ptype == "Client" else ""

    # --- Technologies ---
    technologies = TECH_TAGS.get(dept, "Python, Power BI, SQL")

    # --- Description (templated but varied) ---
    description = (
        f"{project_name} is a {ptype.lower()} project led by the {dept} department. "
        f"It focuses on {technologies.split(', ')[0].lower()}-based solutions "
        f"with a budget of {budget:,} {currency}. "
        f"The project is currently {status.lower()} with {progress}% progress."
    )

    # --- Last updated ---
    if status in ("Completed", "Cancelled"):
        last_updated = actual_end
    elif status == "Planned":
        last_updated = TODAY - timedelta(days=int(np.random.randint(1, 60)))
    else:
        last_updated = TODAY - timedelta(days=int(np.random.randint(0, 14)))

    # --- Assemble row ---
    rows.append({
        "project_id": i,
        "project_code": f"PRJ-{start_date.year}-{i:03d}",
        "project_name": project_name,
        "project_description": description,
        "project_type": ptype,
        "department": dept,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "planned_end_date": planned_end.strftime("%Y-%m-%d"),
        "actual_end_date": actual_end.strftime("%Y-%m-%d") if pd.notna(actual_end) else "",
        "duration_days": duration,
        "status": status,
        "priority": priority,
        "progress_pct": progress,
        "health": health,
        "risk_level": risk,
        "budget": budget,
        "actual_cost": actual_cost,
        "currency": currency,
        "project_manager_id": project_manager_id,
        "sponsor_id": sponsor_id,
        "client_name": client_name,
        "country": country,
        "city": city,
        "office_id": office_id,
        "technologies": technologies,
        "last_updated": last_updated.strftime("%Y-%m-%d"),
    })

# ──────────────────────────────────────────────
# 4. Create DataFrame & save
# ──────────────────────────────────────────────
projects_df = pd.DataFrame(rows)

# Reorder columns for readability
column_order = [
    "project_id", "project_code", "project_name", "project_description",
    "project_type", "department",
    "start_date", "planned_end_date", "actual_end_date", "duration_days",
    "status", "priority", "progress_pct", "health", "risk_level",
    "budget", "actual_cost", "currency",
    "project_manager_id", "sponsor_id",
    "client_name", "country", "city", "office_id",
    "technologies", "last_updated",
]
projects_df = projects_df[column_order]

projects_df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")

# ──────────────────────────────────────────────
# 5. Summary
# ──────────────────────────────────────────────
print(f"✓ Generated {len(projects_df)} projects → {OUTPUT_FILE}")
print(f"  Columns: {len(projects_df.columns)}")
print()
print("Status distribution:")
print(projects_df["status"].value_counts().to_string())
print()
print("Department distribution:")
print(projects_df["department"].value_counts().to_string())
print()
print("Date range:")
print(f"  Earliest start: {projects_df['start_date'].min()}")
print(f"  Latest start:   {projects_df['start_date'].max()}")
print(f"  Today:          {TODAY.strftime('%Y-%m-%d')}")
print()
print("Sample rows:")
print(projects_df[["project_code", "project_name", "status", "start_date", "planned_end_date", "progress_pct"]].head(10).to_string(index=False))
