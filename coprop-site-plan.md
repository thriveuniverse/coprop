

# Copropriété Governance System Design (Minimal Architecture) – Updated

## Overview
Lightweight system to manage a small 3-lot copropriété:
- Proposals (discussion layer)
- Decisions (formalized legal layer)
- E-signature integration for legal validity
- **New: Admin compliance layer** to quickly cross-check proposals/decisions against the règlement de copropriété (93-page PDF)

**Goal:** Replace informal “chat-style” AGs with a structured, traceable, and legally responsible process while keeping everything minimal and user-friendly.

---

## Core Principles
- **Lots** are the legal unit of record (stable and immutable).
- Owners/tenants/proxies are contact entities **linked to lots**.
- Minimize personal data (GDPR-friendly).
- Clear separation between **discussion** (non-binding) and **legal decisions** (immutable + signed).
- **Human oversight** for compliance: the system assists the syndic/admin but never replaces legal judgment.

---

## Data Model

### 1. Lots (stable entity)
- lot_id (e.g. A1, B2)
- share (tantièmes / ownership percentage)
- description (optional)

**Notes:** Never changes. Basis for voting weight if needed.

### 2. Contacts (light identity layer)
- name
- email
- lot_id (FK → Lots)
- role: owner / tenant (optional) / proxy (optional)
- optional_postal_address (only if requested for notifications)

**Notes:** Email is the primary contact for auth, notifications, and signatures.

### 3. Authentication
- Preferred: Email-based magic link
- Alternative: Email + password via Supabase Auth

**Goal:** Minimal friction, no duplicate identity management.

### 4. Proposals (discussion layer)
- proposal_id
- title
- description
- created_by (user_id)
- status: discussion / consensus_reached / rejected / escalated_to_ag
- created_at
- **tags** (optional array, e.g. “travaux”, “charges”, “parties_communes”, “solar”, “règlement_modif” – helps with later compliance checks)

### 5. Proposal Votes / Agreements (non-binding intent)
- proposal_id
- user_id
- status: agree / disagree / neutral
- timestamp

**Notes:** Helps detect consensus early. Not legally binding.

### 6. Decisions (legal layer – immutable)
- decision_id
- source (AG / unanimous_written / AGE)
- proposal_id (optional link)
- title
- final_text (immutable once created)
- decided_at
- status: active / completed / archived

### 7. Decision Signatures
- decision_id
- user_id
- signed_at
- signature_provider (Yousign, etc.)
- signature_reference_id

### 8. Documents
- document_id
- decision_id (or proposal_id)
- file_url (Supabase Storage)
- type: draft / signed / certificate / reglement
- created_at

### 9. Comments
- comment_id
- user_id
- linked_to (proposal_id or decision_id)
- content
- created_at

---

## New: Admin Compliance Layer (Regulations Reference)
**Purpose:** Help the syndic/admin quickly verify that proposals and draft decisions align with the official **Règlement de Copropriété** (93-page PDF) and avoid legal risks, especially on topics like works, solar panels, usage of common areas, or tantièmes.

**Features (Admin-only, lightweight):**

1. **Upload & Store the Règlement**
   - Admin uploads the current PDF (and future amendments).
   - Stored in Supabase Storage with version number and “current” flag.
   - Simple metadata: version, upload date.

2. **Tagging on Proposals**
   - Optional tags when creating/editing proposals to flag potential sensitive areas.

3. **Compliance Check View**
   - Button on any Proposal or Draft Decision: **“Vérifier conformité avec le Règlement”**
   - Split view:
     - Left: Proposal/Decision text + tags
     - Right: Searchable PDF viewer of the règlement (with highlight on search terms)

4. **Compliance Notes Field** (Admin-only)
   - Free-text field on Proposals/Decisions: “Compliance Assessment”
     - Example: “Compliant – see Article 14” or “Risk: may require unanimity – check Article 22”
   - Timestamped + recorded by whom.

5. **Quick Scan Option (optional future enhancement)**
   - Button that sends proposal text + key règlement excerpts to a lightweight LLM prompt for suggestions (e.g., “Potential issues: Article 12 – usage des parties communes”).
   - Always clearly marked as **assistance only** – final responsibility stays with the syndic.

6. **Soft Warnings**
   - Gentle reminder when moving a proposal to Decision stage if compliance notes are missing.

**Philosophy:** Keeps the system minimal. The 93-page PDF is treated as a reference document (not auto-parsed). The syndic remains the human gatekeeper. Adds huge value without complexity.

---

## Workflow

1. **Proposal Phase** – Create, comment, vote informally + optional tags.
2. **Consensus Detection** – All owners agree → status update.
3. **Compliance Review** (Admin) – Check against règlement, add notes.
4. **Formalization** – Generate immutable decision document.
5. **Signature Phase** – Send via Yousign for electronic signatures.
6. **Finalization** – Store signed PDF, archive proposal, move decision to “upper section”.

**Electronic Notifications:** The system can also support sending convocations to AG/AGE via Yousign (or equivalent qualified LRE) as now allowed by default under the 2024/2025 rules. Owners can still opt for paper if they request it.

---

## Key Rules

- **Immutability:** Decisions and final_text cannot be edited. New changes require a new decision.
- **Auditability:** All actions timestamped. Signed documents stored permanently.
- **Legal Integrity:** Database is supporting evidence; the signed PDF is the primary legal proof.
- **Compliance:** Admin must review règlement alignment before formal decisions where relevant.

---

## Technology Stack Suggestion
- Backend & Auth: Supabase (Auth + Database + Storage)
- E-signature & Notifications: Yousign (or compatible qualified provider)
- Frontend: Simple React (or similar) web app
- PDF Viewer: Lightweight library for the règlement search/highlight

---

## Summary & Benefits
This system provides:
- Minimal personal data storage
- Clear separation between discussion and binding decisions
- Fully traceable governance workflow
- **New compliance assistance layer** tailored to the 93-page règlement – perfect for reviewing works lists or solar panel proposals
- Lightweight, responsible alternative to heavy syndic platforms
- Easy path to electronic notifications and signatures

**Next Steps Recommendation (for the 18 May AG context):**
- At the upcoming AG: Present the idea informally (no vote needed yet).
- After election: Convene a short **AG extraordinaire** to formally adopt the tool and any related processes (e.g., electronic notifications).

