# AI-LOP Product Requirements Document (PRD)

## 1. Project Overview
AI-LOP is an AI-enabled Co-creation Learning Platform for Game Storytelling, instantiated for the **T-S-AIs (Teacher-Student-AIs)** co-design framework. It supports students in developing **Interactive Narrative Design** schemes through structured multi-AI collaboration.

## 2. Core Functional Modules (Current Implementation)

### 2.1 Multi-AI Interaction System
- **Dual-Model Conversation**: Concurrent interaction with multiple LLMs (GPT-4, Claude, etc.) for side-by-side comparison.
- **Dialogue to Outcome Flow**: Transitioning from messy chat logs to structured artifacts via workspace-based synthesis.
- **Multimodal Support**: File uploads (Images/Docs) for context setting and asset management.

### 2.2 Inline Annotation & Synthesis (The "Dialogue-to-Outcome" Engine)
- **Selection-Based Tagging**: Marking text as `KnowledgePoint`, `DeleteMark`, or `Comment`.
- **Knowledge Capture**: Promoting highlighted text to a persistent "Notes" column.
- **Draft Organization**: Consolidating multiple annotations into a structured narrative "Draft" with label-based formatting.

### 2.3 Teacher Orchestration & Dashboard
- **Interactive Narrative Workflow**: A 7-step guided process (Concept -> World -> Character -> Plot Branches -> Interaction Points -> Dialogue -> Integration).
- **Engagement Monitoring**: Real-time tracking of student progress, "Idle" state (10 mins), and student/AI contribution ratios.
- **Direct Intervention**: Internal messaging system for teacher-led scaffolding.

### 2.4 Research-Grade Logging
- **Granular Event Logs**: Timestamped tracking of prompts, message-index level annotations, synthesis choices, and task progress transitions.

## 3. Technical Architecture
- **Frontend**: React + TypeScript + Vite + Zustand.
- **Backend**: Node.js + Express + Multer.
- **Database**: PostgreSQL with Prisma ORM.
- **Workflow Engine**: TipTap-based rich text workspace for seamless content manipulation.
