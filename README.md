
  # SmartRecovery

  This is a code bundle for SmartRecovery. The original project is available at https://www.figma.com/design/yGVt1EaiY1QirHE4cyHwdv/SmartRecovery.

**AI-Driven Performance & Recovery Intelligence for Elite Athletes**

## 🚀 Overview
Elite athletes suffer from "App Fatigue." They use separate apps for workouts, sleep tracking, cycle tracking, and injury rehab. This leaves their health data siloed and ineffective. 

**Smart Recover** is a centralized HealthTech ecosystem that turns raw data into **Actionable Intelligence**. Originally conceptualized at SportHack 2025, the platform cross-references workout load, sleep, weather, active injuries, and female physiology to proactively adjust training schedules and prevent overtraining.

## ✨ Key Features
* **Holistic Recovery Score:** A daily readiness metric calculated from multiple physiological and environmental data points.
* **Dynamic AI Scheduling:** Automatically modifies workouts based on context (e.g., swapping a sprint for a pool session if an Achilles injury is active and local humidity is dangerously high).
* **Female Athlete Physiology:** Natively integrates menstrual cycle tracking into load management to optimize performance windows.
* **Proactive Contextual Alerts:** Real-time environmental warnings (e.g., heat/humidity alerts) to prevent strain.
* **24/7 AI Training Assistant:** A conversational AI (powered by Google Gemini) that provides instant, customized recovery protocols and nutrition advice based on the user's secure medical profile.

## 🛠️ Tech Stack
* **Frontend:** React, TypeScript, Vite
* **Styling:** Tailwind CSS, shadcn/ui, Lucide Icons
* **Backend & Auth:** Supabase (PostgreSQL, Row Level Security)
* **Serverless Functions:** Supabase Edge Functions (Deno)
* **AI Integration:** Google Gemini API 

## 💻 Running the Project Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/smart-recover-app.git](https://github.com/your-username/smart-recover-app.git)
   cd smart-recover-app
  
