# Strataway

Strataway is a logic-driven navigation system that helps users turn long-term goals into structured, realistic paths of growth.

Instead of providing generic advice or black-box AI suggestions, Strataway models progress as interconnected layers of skills, routes, and timelines — enabling users to understand *how* to reach a goal, *what trade-offs exist*, and *what to do next*.

---

## Core Idea

Strataway treats growth as a structured system:

- Skills are interconnected and layered
- Goals can be reached through multiple valid routes
- Progress is incremental, not linear
- Decisions involve trade-offs, not “perfect paths”

The system focuses on **clarity over guesswork** and **structure over motivation**.

---

## Key Features

### Multi-Route Navigation
For any given goal, Strataway generates multiple structured routes:

- Fast
- Balanced
- Safe
- Prestige-oriented

Each route includes:
- Estimated duration (weeks)
- Total effort (hours)
- Cost (relative units)
- Risk level
- Sustainability level
- Confidence band

Routes are presented as **trade-offs**, not rankings.

---

### Skill Graph System
Strataway models goals as a graph:

- Nodes = skills
- Edges = prerequisites
- Skills unlock progressively
- Completed skills persist

This provides a clear visual understanding of progress and dependencies.

---

### Timeline & Weekly Planning
Each route is converted into a weekly execution plan:

- Time-constrained task generation
- Effort-balanced scheduling
- Burnout and overload detection
- Clear “next steps” focus

---

### Analytics Layer
Strataway provides structured, explainable analytics:

- Probability timelines (confidence over time)
- Risk breakdowns (with contributing factors)
- Weekly workload snapshots
- Route summaries

All metrics are **relative and explainable**, not absolute predictions.

---

### Adaptive Re-Routing
The system adapts dynamically when:

- Tasks are missed
- Time constraints change
- Goals are updated

Strataway:
- Preserves completed progress
- Recalculates future steps
- Avoids resetting the user

---

### Explainability
Every recommendation includes:
- A clear rationale
- Trade-off explanations
- Context for decisions

Strataway avoids black-box logic and prioritizes transparency.

---

## Architecture Overview

### Frontend
- Next.js (App Router)
- TypeScript
- Zustand (state management)
- Custom CSS system

### Core Layers
- Skill Graph Engine
- Route Generation System
- Timeline Planner
- Analytics Engine
- Adaptation Logic

---

## Project Structure

```txt
frontend/
├── app/
├── components/
├── store/
├── utils/
├── styles/
├── types/