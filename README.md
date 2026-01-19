# Dough Temperature Tracker

A React app that helps sourdough bakers predict the optimal water temperature based on historical baking data using multivariate linear regression.

## Features

- 📊 **Water Temperature Calculator** - Get instant recommendations based on current conditions
- 🧮 **Multi-variable Regression** - Considers room temp, flour temp, levain temp, mix time, and hydration
- 📈 **Model Training** - Learns from your baking sessions to improve predictions
- 💾 **Data Export** - Export your baking data as CSV
- 🎯 **Friction Factor** - Automatically calculates friction heat

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Initial Setup**: Add at least 3 complete baking sessions in the "Training Data" table
2. **Calculate**: Once you have 3+ sessions, the calculator will activate
3. **Predict**: Enter your current conditions to get the recommended water temperature
4. **Improve**: Keep adding sessions to improve prediction accuracy

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
