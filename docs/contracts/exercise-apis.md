# 🏋️ Exercise Data Integration – Full Documentation (API + Import Plan)

---

## 📌 Overview

This document describes:

1. External Exercises API (API Ninjas)
2. One-time data import strategy
3. Firebase (Firestore) database design
4. End-to-end flow for your app

Goal:
Load all exercise data **once** into your internal database and stop depending on the external API at runtime.

---

## 🌐 External API – Exercises API

The Exercises API provides access to **3000+ gym exercises** including:

- Exercise name
- Equipment (machine/tools)
- Instructions (how to perform)
- Safety cues & tips
- Target muscle group
- Difficulty level

---

## 🔗 Base URL

^^^
https://api.api-ninjas.com/v1
^^^

---

## 🔑 Authentication

Header:

^^^
X-Api-Key: sFeGow4Le4WufapW6eHku4HqjwMqPmbWogyOiKMu
^^^

---

## 📡 Endpoint: Search Exercises

### GET `/v1/exercises`

Returns up to **5 exercises per request**

---

## 📥 Query Parameters

| Parameter | Description |
|----------|------------|
| `name` | Partial/full exercise name |
| `type` | Exercise type |
| `muscle` | Target muscle |
| `difficulty` | beginner / intermediate / expert |
| `equipments` | Equipment (comma-separated) |
| `offset` | Pagination (premium) |

---

## 🏷️ Possible Values

### type
- cardio
- strength
- powerlifting
- olympic_weightlifting
- plyometrics
- stretching
- strongman

### difficulty
- beginner
- intermediate
- expert

---

## 📤 Response Structure

^^^
[
{
"name": "Incline Hammer Curls",
"type": "strength",
"muscle": "biceps",
"difficulty": "beginner",
"instructions": "How to perform...",
"equipments": ["dumbbells", "incline bench"],
"safety_info": "Keep back stable, avoid swinging..."
}
]
^^^

---

## 🧠 Field Mapping (Important)

| API Field | Meaning |
|----------|--------|
| name | Exercise name |
| type | Category |
| muscle | Primary muscle |
| difficulty | Skill level |
| instructions | Execution steps |
| equipments | Machines/tools |
| safety_info | Cues & tips |

---

## ⚠️ API Limitations

- Only **5 results per request**
- Full dataset requires:
  - Premium (`offset`)
  - OR multiple queries
  - OR alternative API

---

# 🚀 One-Time Import Strategy

## 🎯 Goal

Use the API **once** to populate your internal DB.

After that:
👉 Your app uses ONLY Firebase

---

## 🔄 Flow

^^^
Import Script (Node.js)
↓
Call API (per muscle)
↓
Normalize data
↓
Save to Firebase (Firestore)
↓
App reads only from Firebase
^^^

---

## 🧩 Import Steps

1. Define muscle groups list:

^^^
["chest", "back", "biceps", "triceps", "shoulders", "legs", "abs"]
^^^

2. Loop over muscles

3. Call API:

^^^
GET /v1/exercises?muscle=biceps
^^^

4. For each exercise:
  - Transform fields
  - Save to DB

5. Prevent duplicates:
  - Use `name + muscle` as unique key

---

## 📌 Important Design Decision

❌ Do NOT call API from frontend
❌ Do NOT call API per user request

✅ ONLY call API in **import script**

---

# 🔥 Firebase (Firestore) Design

## 📁 Collection: `exercises`

Each document = one exercise

---

## 📄 Document Structure

^^^
{
id: "auto-id",

name: "Incline Hammer Curl",
type: "strength",
muscle: "biceps",
difficulty: "beginner",

instructions: "Step by step execution...",
safetyTips: "Keep elbows stable...",

equipments: ["dumbbells", "incline bench"],

createdAt: timestamp,
source: "api-ninjas"
}
^^^

---

## 🧠 Notes

- `equipments` → array (Firestore supports this)
- `instructions` → long text
- `safetyTips` → rename from `safety_info`
- Add indexes on:
  - muscle
  - type
  - difficulty

---

# 🧪 Example Query (From Your App)

Get all biceps exercises:

^^^
db.collection("exercises")
.where("muscle", "==", "biceps")
^^^

---

# ⚡ Performance Strategy

After import:

- 🚫 No external API latency
- 🚫 No API limits
- ✅ Fast Firestore queries
- ✅ Full control over data

---

# 🏗️ Architecture

## Final System

^^^
Frontend (HTML/JS)
↓
Firebase SDK
↓
Firestore (your DB)
^^^

---

## Import Phase Only

^^^
Node Script
↓
External API (API Ninjas)
↓
Firestore
^^^

---

# ✅ Why Firebase + JS is Perfect Here

- No backend required
- Easy integration with frontend
- Scalable
- Free tier is enough
- Simple JSON-like structure
- Real-time ready (if needed later)

---

# 🔚 Summary

✔ Use API Ninjas for initial data
✔ Run one-time import script
✔ Store everything in Firebase
✔ App reads only from Firestore

MOST IMPORTANT ALL ARCHITECTURE IS JUST A SUGGESTION - JUNIE USE WHATEVER EXISTING ARCHITECTURE WE ARE USING
