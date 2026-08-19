# EduAI Platform

A production-ready, multi-agent educational AI platform built with **TypeScript**, **React**, **Vite**, **Express**, and **@google/genai**. The system orchestrates specialized agents (Curriculum, Retrieval/RAG, Tutor, Study Planner, Flashcard, Video Explainer Tool) to deliver personalized, citation-grounded tutoring for any country / curriculum / grade / subject.

## Core Features & Agents

1. **RAG-Grounded AI Tutor**: Delivers step-by-step explanations with inline/block LaTeX math formulas ($...$, $$...$$), visual Mermaid diagrams/flowcharts, interactive function plots, and cited syllabus sources.
2. **Personalized Study Planner**: Blends self-reported scores (35% weakness), confidence levels (25%), exam weighting (25%), and knowledge staleness (15%) to greedily schedule high-yield revision leading up to test day with AI rationales.
3. **Interactive 3D Flashcard Deck**: Generates exam-aligned recall flashcards with flip study mode, mastery tracker, and printable PDF export.
4. **Curriculum Specification Explorer**: Scans official exam board specifications across Cambridge, Edexcel, AQA, AP, IB, and CBSE with detailed Assessment Objectives (AO1, AO2, AO3) and paper formats.
5. **On-Demand AI Explainer Videos**: Generates visual storyboards and animated scene walkthroughs for complex topics.
6. **Knowledge Base Ingestion**: Ingests textbook excerpts, lecture notes, and syllabus PDFs into an in-memory vector store for retrieval-grounded answers.

## Setup & Running

```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev

# Build for production
npm run build
```

